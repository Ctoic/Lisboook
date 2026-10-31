import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Logger,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards
} from "@nestjs/common";
import { Prisma, type Folio, type FolioStatus, type SagaForm } from "@prisma/client";
import type { Response } from "express";
import type {
  CreatorProfileContract,
  FolioContract,
  FolioSnapshotContract,
  FolioSummaryContract,
  MuseMode,
  SagaDetailContract,
  SagaSummaryContract
} from "@lisbook/types";
import { AuthGuard, type AuthenticatedRequest } from "../../common/auth/auth.guard";
import { cleanMessages, streamOllamaChat } from "../../common/ollama";
import { oneOf, text } from "./validation";
import { recordWritingDay } from "./ranks";
import { StudioController, StudioService } from "./studio";
import { rebuildFolioMentions, worldBrief, WorldController, WorldService } from "./world";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";

const SAGA_FORMS: SagaForm[] = ["novel", "novella", "short_story", "serial"];
const FOLIO_STATUSES: FolioStatus[] = ["draft", "revising", "done"];
const GOALS = ["finish_novel", "short_fiction", "worldbuild", "play"];
const MUSE_MODES: MuseMode[] = ["write", "spark", "polish", "echo"];
const MAX_CONTENT_CHARS = 200_000;
const MAX_SNAPSHOTS = 30;
// How much of the manuscript each Muse mode sees; the local model runs with a 4k context.
const PASSAGE_BUDGET: Record<MuseMode, number> = { write: 3000, spark: 1500, polish: 3000, echo: 5000 };
// How much of the story bible (Souls, bonds, Atlas) rides along with each mode.
const BIBLE_BUDGET: Record<MuseMode, number> = { write: 1400, spark: 1000, polish: 700, echo: 2200 };

function countWords(content: string) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

function toFolioSummary(folio: Omit<Folio, "content">): FolioSummaryContract {
  return {
    id: folio.id,
    sagaId: folio.sagaId,
    title: folio.title,
    sortOrder: folio.sortOrder,
    status: folio.status,
    wordCount: folio.wordCount,
    updatedAt: folio.updatedAt.toISOString()
  };
}

const folioSummarySelect = {
  id: true,
  sagaId: true,
  title: true,
  sortOrder: true,
  status: true,
  wordCount: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.FolioSelect;

interface MuseBody {
  sagaId?: string;
  folioId?: string;
  mode?: string;
  passage?: string;
  messages?: unknown;
}

@Injectable()
class InkverseService {
  private readonly logger = new Logger("Muse");

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /* ---------- Creator profile (the Threshold) ---------- */

  async profile(userId: string): Promise<CreatorProfileContract | null> {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    return profile
      ? { userId: profile.userId, quillName: profile.quillName, bio: profile.bio, genres: profile.genres, goal: profile.goal }
      : null;
  }

  async saveProfile(userId: string, body: Record<string, unknown>) {
    const quillName = text(body.quillName, "Quill Name", { min: 2, max: 40 })!;
    const bio = text(body.bio, "Bio", { max: 400, optional: true }) ?? null;
    const goal = oneOf(body.goal, "Goal", GOALS) ?? null;
    const genres = Array.isArray(body.genres)
      ? [...new Set(body.genres.map((g, i) => text(g, `Genre ${i + 1}`, { min: 1, max: 30 })!))].slice(0, 8)
      : [];

    try {
      await this.prisma.creatorProfile.upsert({
        where: { userId },
        create: { userId, quillName, bio, goal, genres },
        update: { quillName, bio, goal, genres }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("That Quill Name is already taken. Try another.");
      }
      throw error;
    }
    return this.profile(userId);
  }

  /* ---------- Sagas ---------- */

  private async ownSaga(userId: string, sagaId: string) {
    const saga = await this.prisma.saga.findFirst({ where: { id: sagaId, ownerId: userId } });
    if (!saga) throw new NotFoundException("Saga not found");
    return saga;
  }

  private async ownFolio(userId: string, folioId: string) {
    const folio = await this.prisma.folio.findFirst({ where: { id: folioId, saga: { ownerId: userId } } });
    if (!folio) throw new NotFoundException("Folio not found");
    return folio;
  }

  async listSagas(userId: string): Promise<SagaSummaryContract[]> {
    const sagas = await this.prisma.saga.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      include: { folios: { select: { wordCount: true } } }
    });
    return sagas.map(({ folios, ...saga }) => ({
      id: saga.id,
      title: saga.title,
      logline: saga.logline,
      genre: saga.genre,
      form: saga.form,
      visibility: saga.visibility,
      folioCount: folios.length,
      wordCount: folios.reduce((sum, f) => sum + f.wordCount, 0),
      createdAt: saga.createdAt.toISOString(),
      updatedAt: saga.updatedAt.toISOString()
    }));
  }

  async getSaga(userId: string, sagaId: string): Promise<SagaDetailContract> {
    const saga = await this.prisma.saga.findFirst({
      where: { id: sagaId, ownerId: userId },
      include: { folios: { select: folioSummarySelect, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } }
    });
    if (!saga) throw new NotFoundException("Saga not found");
    const folios = saga.folios.map(toFolioSummary);
    return {
      id: saga.id,
      title: saga.title,
      logline: saga.logline,
      genre: saga.genre,
      form: saga.form,
      visibility: saga.visibility,
      folioCount: folios.length,
      wordCount: folios.reduce((sum, f) => sum + f.wordCount, 0),
      createdAt: saga.createdAt.toISOString(),
      updatedAt: saga.updatedAt.toISOString(),
      folios
    };
  }

  async createSaga(userId: string, body: Record<string, unknown>) {
    const saga = await this.prisma.saga.create({
      data: {
        ownerId: userId,
        title: text(body.title, "Title", { min: 1, max: 120 })!,
        logline: text(body.logline, "Logline", { max: 400, optional: true }) ?? null,
        genre: text(body.genre, "Genre", { max: 40, optional: true }) ?? null,
        form: oneOf(body.form, "Form", SAGA_FORMS) ?? "novel",
        // Every Saga starts with an empty first chapter so the writer can begin straight away.
        folios: { create: { title: "Chapter 1", sortOrder: 0 } }
      }
    });
    return this.getSaga(userId, saga.id);
  }

  async updateSaga(userId: string, sagaId: string, body: Record<string, unknown>) {
    await this.ownSaga(userId, sagaId);
    await this.prisma.saga.update({
      where: { id: sagaId },
      data: {
        title: body.title === undefined ? undefined : text(body.title, "Title", { min: 1, max: 120 }),
        logline: body.logline === undefined ? undefined : (text(body.logline, "Logline", { max: 400, optional: true }) ?? null),
        genre: body.genre === undefined ? undefined : (text(body.genre, "Genre", { max: 40, optional: true }) ?? null),
        form: oneOf(body.form, "Form", SAGA_FORMS)
      }
    });
    return this.getSaga(userId, sagaId);
  }

  async deleteSaga(userId: string, sagaId: string) {
    await this.ownSaga(userId, sagaId);
    await this.prisma.saga.delete({ where: { id: sagaId } });
    return { ok: true };
  }

  /* ---------- Folios (chapters in the Quill Room) ---------- */

  async createFolio(userId: string, sagaId: string, body: Record<string, unknown>) {
    await this.ownSaga(userId, sagaId);
    const last = await this.prisma.folio.findFirst({ where: { sagaId }, orderBy: { sortOrder: "desc" } });
    const count = await this.prisma.folio.count({ where: { sagaId } });
    const folio = await this.prisma.folio.create({
      data: {
        sagaId,
        title: text(body.title, "Title", { min: 1, max: 120, optional: true }) ?? `Chapter ${count + 1}`,
        sortOrder: (last?.sortOrder ?? -1) + 1
      }
    });
    await this.touchSaga(sagaId);
    return this.toFolio(folio);
  }

  async reorderFolios(userId: string, sagaId: string, body: Record<string, unknown>) {
    await this.ownSaga(userId, sagaId);
    const ids = Array.isArray(body.folioIds) ? body.folioIds.filter((id): id is string => typeof id === "string") : [];
    const existing = await this.prisma.folio.findMany({ where: { sagaId }, select: { id: true } });
    if (ids.length !== existing.length || !existing.every((f) => ids.includes(f.id))) {
      throw new BadRequestException("folioIds must list every chapter of the Saga exactly once");
    }
    await this.prisma.$transaction(ids.map((id, index) => this.prisma.folio.update({ where: { id }, data: { sortOrder: index } })));
    return this.getSaga(userId, sagaId);
  }

  async getFolio(userId: string, folioId: string) {
    return this.toFolio(await this.ownFolio(userId, folioId));
  }

  async updateFolio(userId: string, folioId: string, body: Record<string, unknown>) {
    const current = await this.ownFolio(userId, folioId);
    let content: string | undefined;
    if (body.content !== undefined) {
      if (typeof body.content !== "string") throw new BadRequestException("content must be text");
      if (body.content.length > MAX_CONTENT_CHARS) throw new BadRequestException("This chapter is too long to save. Split it in two.");
      content = body.content;
    }
    const folio = await this.prisma.folio.update({
      where: { id: folioId },
      data: {
        title: body.title === undefined ? undefined : text(body.title, "Title", { min: 1, max: 120 }),
        status: oneOf(body.status, "Status", FOLIO_STATUSES),
        content,
        wordCount: content === undefined ? undefined : countWords(content)
      }
    });
    if (content !== undefined) {
      await rebuildFolioMentions(this.prisma, folio);
      await recordWritingDay(this.prisma, userId);
    }
    await this.touchSaga(current.sagaId);
    return this.toFolio(folio);
  }

  async deleteFolio(userId: string, folioId: string) {
    const folio = await this.ownFolio(userId, folioId);
    const count = await this.prisma.folio.count({ where: { sagaId: folio.sagaId } });
    if (count <= 1) throw new BadRequestException("A Saga needs at least one chapter.");
    await this.prisma.folio.delete({ where: { id: folioId } });
    await this.touchSaga(folio.sagaId);
    return { ok: true };
  }

  /* ---------- Snapshots ---------- */

  async listSnapshots(userId: string, folioId: string): Promise<FolioSnapshotContract[]> {
    await this.ownFolio(userId, folioId);
    const snapshots = await this.prisma.folioSnapshot.findMany({
      where: { folioId },
      orderBy: { createdAt: "desc" },
      take: MAX_SNAPSHOTS,
      select: { id: true, folioId: true, label: true, wordCount: true, createdAt: true }
    });
    return snapshots.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }));
  }

  async createSnapshot(userId: string, folioId: string, body: Record<string, unknown>) {
    const folio = await this.ownFolio(userId, folioId);
    await this.snapshot(folio, text(body.label, "Label", { max: 80, optional: true }) ?? null);
    return this.listSnapshots(userId, folioId);
  }

  async restoreSnapshot(userId: string, folioId: string, snapshotId: string) {
    const folio = await this.ownFolio(userId, folioId);
    const snapshot = await this.prisma.folioSnapshot.findFirst({ where: { id: snapshotId, folioId } });
    if (!snapshot) throw new NotFoundException("Snapshot not found");
    // Keep what is being replaced, so a restore can always be undone.
    await this.snapshot(folio, "Before restore");
    const restored = await this.prisma.folio.update({
      where: { id: folioId },
      data: { content: snapshot.content, wordCount: snapshot.wordCount }
    });
    await rebuildFolioMentions(this.prisma, restored);
    return this.toFolio(restored);
  }

  private async snapshot(folio: Folio, label: string | null) {
    await this.prisma.folioSnapshot.create({
      data: { folioId: folio.id, label, content: folio.content, wordCount: folio.wordCount }
    });
    const stale = await this.prisma.folioSnapshot.findMany({
      where: { folioId: folio.id },
      orderBy: { createdAt: "desc" },
      skip: MAX_SNAPSHOTS,
      select: { id: true }
    });
    if (stale.length) await this.prisma.folioSnapshot.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  }

  private toFolio(folio: Folio): FolioContract {
    return { ...toFolioSummary(folio), content: folio.content };
  }

  private touchSaga(sagaId: string) {
    return this.prisma.saga.update({ where: { id: sagaId }, data: { updatedAt: new Date() } });
  }

  /* ---------- Lis the Muse ---------- */

  async muse(userId: string, body: MuseBody, res: Response) {
    const mode = oneOf(body?.mode, "mode", MUSE_MODES);
    if (!mode) throw new BadRequestException("mode is required");
    const messages = cleanMessages(body.messages, 10, 2000);
    if (!messages) throw new BadRequestException("Tell Lis what you need to get started");
    const saga = await this.ownSaga(userId, text(body.sagaId, "sagaId")!);
    const folio = body.folioId ? await this.ownFolio(userId, body.folioId) : null;
    if (folio && folio.sagaId !== saga.id) throw new BadRequestException("That chapter belongs to another Saga");
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });

    const raw = typeof body.passage === "string" ? body.passage : "";
    const budget = PASSAGE_BUDGET[mode];
    // Polish works on a selection, so keep its start; Echo reads both ends of a long chapter;
    // the other modes care about where the text ends.
    const passage =
      mode === "polish"
        ? raw.slice(0, budget)
        : mode === "echo" && raw.length > budget
          ? `${raw.slice(0, budget / 2)}\n[…]\n${raw.slice(-budget / 2)}`
          : raw.slice(-budget);
    if (mode === "polish" && !passage.trim()) throw new BadRequestException("Select the passage you want Lis to polish");
    if (mode === "echo" && !passage.trim()) throw new BadRequestException("Write something first, then Lis can check it");
    const bible = await worldBrief(this.prisma, saga.id, `${passage}\n${messages[messages.length - 1].content}`, BIBLE_BUDGET[mode]);

    const chapterNumber = folio
      ? (await this.prisma.folio.count({ where: { sagaId: saga.id, sortOrder: { lt: folio.sortOrder } } })) + 1
      : null;

    const lines = [
      "You are Lis, the Muse of the Lisbook Inkverse: a warm, imaginative writing partner who helps writers develop their own stories.",
      "The story belongs to the writer. Offer possibilities rather than verdicts, never lecture, and match their voice, genre and tone.",
      "Get straight to the work: no greetings, no flattery and no preamble.",
      "",
      "The story:",
      `- Title: "${saga.title}" (${saga.form.replace("_", " ")}${saga.genre ? `, ${saga.genre}` : ""}).`,
      saga.logline ? `- Logline: ${saga.logline}` : "",
      profile ? `- The writer's pen name is ${profile.quillName}.${profile.genres.length ? ` They love ${profile.genres.join(", ")}.` : ""}` : "",
      folio ? `- They are working on chapter ${chapterNumber}, "${folio.title}".` : "",
      ""
    ];
    if (bible) {
      lines.push(
        "Story bible (the writer's characters and world). Stay consistent with it: names, looks, voices, relationships and rules.",
        bible,
        ""
      );
    }

    if (mode === "spark") {
      lines.push(
        "Mode: Spark (brainstorm).",
        "Offer 3 to 5 distinct, surprising options as a markdown bullet list. Start each bullet with a short bold name, then one or two sentences on the same line.",
        "Make the options genuinely different from each other. End with one short line asking which direction excites them."
      );
      if (passage.trim()) lines.push("", "For context, the chapter so far ends like this:", '"""', passage, '"""');
    } else if (mode === "echo") {
      lines.push(
        "Mode: Echo (continuity check).",
        bible
          ? "Compare the chapter with the story bible and with itself. Look for real slips: a character's looks, name, age, voice or relationships contradicting their card; places or world rules used inconsistently; facts that change within the chapter; someone knowing something they shouldn't."
          : "There is no story bible yet, so check only whether the chapter contradicts itself (names, facts, timeline). End by suggesting the writer add their main characters in the Soulforge so Lis can check more.",
        "For each slip, write a markdown bullet: quote the line briefly in italics, explain the conflict in one sentence, and suggest a fix.",
        "Only report genuine conflicts and never invent problems. If you find none, say so in one line, then name one thing that is consistent and working well.",
        "",
        "The chapter:",
        `"""\n${passage}\n"""`
      );
    } else if (mode === "write") {
      lines.push(
        "Mode: Write (draft the chapter). Your words go straight into the writer's manuscript.",
        "Write story prose for this chapter that follows the writer's request. If the chapter already has text, continue seamlessly from where it ends, in the same voice, tense and point of view.",
        "Write about 350 to 600 words in well-paced paragraphs separated by blank lines.",
        "Output only the story prose: no chapter title, no headings, no preamble, no notes and no quotation marks around it."
      );
      lines.push(
        "",
        passage.trim() ? "The chapter so far ends like this:" : "The chapter is empty, so write a strong opening.",
        passage.trim() ? `"""\n${passage}\n"""` : ""
      );
    } else {
      lines.push(
        "Mode: Polish (line edit).",
        "Rewrite the selected passage to improve clarity, rhythm and vividness while keeping the writer's meaning, voice, tense and point of view.",
        "Keep roughly the same length unless asked otherwise. Output only the revised passage, with no preamble or commentary, unless the writer asks you to explain your changes.",
        "",
        "The selected passage:",
        `"""\n${passage}\n"""`
      );
    }

    const system = lines.filter((line) => line !== "").join("\n");
    const temperature = mode === "polish" || mode === "echo" ? 0.3 : mode === "write" ? 0.8 : 0.9;
    await streamOllamaChat(res, { system, messages, temperature, numCtx: 4096, logger: this.logger });
  }
}

@Controller("inkverse")
@UseGuards(AuthGuard)
class InkverseController {
  constructor(@Inject(InkverseService) private readonly inkverse: InkverseService) {}

  @Get("me")
  async me(@Req() req: AuthenticatedRequest) {
    return { profile: await this.inkverse.profile(req.user!.id) };
  }

  @Put("me")
  async saveMe(@Req() req: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return { profile: await this.inkverse.saveProfile(req.user!.id, body ?? {}) };
  }

  @Get("sagas")
  listSagas(@Req() req: AuthenticatedRequest) {
    return this.inkverse.listSagas(req.user!.id);
  }

  @Post("sagas")
  createSaga(@Req() req: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.inkverse.createSaga(req.user!.id, body ?? {});
  }

  @Get("sagas/:id")
  getSaga(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.inkverse.getSaga(req.user!.id, id);
  }

  @Patch("sagas/:id")
  updateSaga(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.inkverse.updateSaga(req.user!.id, id, body ?? {});
  }

  @Delete("sagas/:id")
  deleteSaga(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.inkverse.deleteSaga(req.user!.id, id);
  }

  @Post("sagas/:id/folios")
  createFolio(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.inkverse.createFolio(req.user!.id, id, body ?? {});
  }

  @Put("sagas/:id/folios/order")
  reorderFolios(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.inkverse.reorderFolios(req.user!.id, id, body ?? {});
  }

  @Get("folios/:id")
  getFolio(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.inkverse.getFolio(req.user!.id, id);
  }

  @Patch("folios/:id")
  updateFolio(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.inkverse.updateFolio(req.user!.id, id, body ?? {});
  }

  @Delete("folios/:id")
  deleteFolio(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.inkverse.deleteFolio(req.user!.id, id);
  }

  @Get("folios/:id/snapshots")
  listSnapshots(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.inkverse.listSnapshots(req.user!.id, id);
  }

  @Post("folios/:id/snapshots")
  createSnapshot(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.inkverse.createSnapshot(req.user!.id, id, body ?? {});
  }

  @Post("folios/:id/snapshots/:snapshotId/restore")
  restoreSnapshot(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Param("snapshotId") snapshotId: string) {
    return this.inkverse.restoreSnapshot(req.user!.id, id, snapshotId);
  }

  @Post("muse")
  async muse(@Req() req: AuthenticatedRequest, @Body() body: MuseBody, @Res() res: Response) {
    await this.inkverse.muse(req.user!.id, body, res);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [InkverseController, WorldController, StudioController],
  providers: [InkverseService, WorldService, StudioService]
})
export class InkverseModule {}
