import { BadRequestException, Body, Controller, Get, Inject, Injectable, NotFoundException, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type {
  HearthCasting,
  HearthVoice,
  LoomBoard,
  LoomShard,
  LoomThread,
  PressContract,
  ShardKind,
  SoulRole,
  ThreadKind
} from "@lisbook/types";
import { AuthGuard, type AuthenticatedRequest } from "../../common/auth/auth.guard";
import { chatJson } from "../../common/ollama";
import { PrismaService } from "../../common/prisma/prisma.service";
import { slugify } from "../../common/slugify";
import { computeRanks } from "./ranks";
import { longText, text } from "./validation";

const SHARD_KINDS: ShardKind[] = ["scene", "beat", "idea", "note", "quote"];
const THREAD_KINDS: ThreadKind[] = ["leads_to", "foreshadows", "conflicts", "flashback", "reveals"];
const MAX_SHARDS = 300;
const MAX_THREADS = 600;
const COVER_STYLES = 8;

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

/* ---------- The Loom: validating the board document ---------- */

function readBoard(raw: unknown): LoomBoard {
  const board = (raw ?? {}) as { shards?: unknown; threads?: unknown };
  const shardsIn = Array.isArray(board.shards) ? board.shards : [];
  const threadsIn = Array.isArray(board.threads) ? board.threads : [];
  if (shardsIn.length > MAX_SHARDS) throw new BadRequestException(`A Loom holds at most ${MAX_SHARDS} Shards`);
  if (threadsIn.length > MAX_THREADS) throw new BadRequestException(`A Loom holds at most ${MAX_THREADS} Threads`);

  const shards: LoomShard[] = shardsIn.map((item, i) => {
    const s = (item ?? {}) as Record<string, unknown>;
    const id = str(s.id, 40);
    if (!id) throw new BadRequestException(`Shard ${i + 1} needs an id`);
    return {
      id,
      kind: SHARD_KINDS.includes(s.kind as ShardKind) ? (s.kind as ShardKind) : "scene",
      title: str(s.title, 120),
      body: str(s.body, 1500),
      x: clampNumber(s.x, -20000, 20000, 0),
      y: clampNumber(s.y, -20000, 20000, 0),
      order: clampNumber(s.order, -100000, 100000, i),
      soulIds: Array.isArray(s.soulIds) ? s.soulIds.filter((v): v is string => typeof v === "string").slice(0, 12) : [],
      folioId: typeof s.folioId === "string" ? s.folioId : null
    };
  });
  const ids = new Set(shards.map((s) => s.id));
  const threads: LoomThread[] = threadsIn
    .map((item) => {
      const t = (item ?? {}) as Record<string, unknown>;
      return {
        id: str(t.id, 40) || randomUUID(),
        from: str(t.from, 40),
        to: str(t.to, 40),
        kind: THREAD_KINDS.includes(t.kind as ThreadKind) ? (t.kind as ThreadKind) : "leads_to"
      };
    })
    // Threads whose ends were deleted simply fall away.
    .filter((t) => ids.has(t.from) && ids.has(t.to) && t.from !== t.to);
  return { shards, threads };
}

const WEAVE_SCHEMA = {
  type: "object",
  properties: {
    shards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          kind: { type: "string", enum: ["scene", "beat"] },
          characters: { type: "array", items: { type: "string" } }
        },
        required: ["title", "body", "kind", "characters"]
      }
    }
  },
  required: ["shards"]
};

const BLURB_SCHEMA = {
  type: "object",
  properties: { tagline: { type: "string" }, blurb: { type: "string" } },
  required: ["tagline", "blurb"]
};

function readVoice(raw: unknown): HearthVoice {
  const v = (raw ?? {}) as Record<string, unknown>;
  return {
    voiceName: typeof v.voiceName === "string" && v.voiceName.trim() ? v.voiceName.slice(0, 120) : null,
    pitch: clampNumber(v.pitch, 0.5, 2, 1),
    rate: clampNumber(v.rate, 0.5, 2, 1)
  };
}

@Injectable()
export class StudioService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async ownSaga(userId: string, sagaId: string) {
    const saga = await this.prisma.saga.findFirst({ where: { id: sagaId, ownerId: userId } });
    if (!saga) throw new NotFoundException("Saga not found");
    return saga;
  }

  /* ----- Loom ----- */

  async loom(userId: string, sagaId: string): Promise<LoomBoard> {
    const saga = await this.ownSaga(userId, sagaId);
    return saga.loom ? readBoard(saga.loom) : { shards: [], threads: [] };
  }

  async saveLoom(userId: string, sagaId: string, body: unknown): Promise<LoomBoard> {
    await this.ownSaga(userId, sagaId);
    const board = readBoard(body);
    await this.prisma.saga.update({ where: { id: sagaId }, data: { loom: board as unknown as Prisma.InputJsonValue } });
    return board;
  }

  /** Lis proposes story beats that continue the board, ready to drop onto the Loom. */
  async weave(userId: string, sagaId: string, body: Record<string, unknown>) {
    const saga = await this.ownSaga(userId, sagaId);
    const prompt = text(body.prompt, "Direction", { max: 400, optional: true });
    const board = saga.loom ? readBoard(saga.loom) : { shards: [], threads: [] };
    const [souls, folios] = await Promise.all([
      this.prisma.soul.findMany({ where: { sagaId }, select: { id: true, name: true, role: true, summary: true } }),
      this.prisma.folio.findMany({ where: { sagaId }, orderBy: { sortOrder: "asc" }, select: { title: true } })
    ]);
    const existing = [...board.shards].sort((a, b) => a.order - b.order);

    const system = [
      `You are Lis, helping a writer plot their story "${saga.title}"${saga.genre ? ` (${saga.genre})` : ""} on a story board.`,
      saga.logline ? `Logline: ${saga.logline}` : "",
      souls.length ? `Characters: ${souls.map((s) => `${s.name} (${s.role.replace("_", " ")}${s.summary ? `: ${s.summary}` : ""})`).join("; ")}.` : "",
      folios.length ? `Chapters so far: ${folios.map((f) => f.title).join(", ")}.` : "",
      existing.length ? `Beats already on the board, in order: ${existing.map((s) => s.title).join(" → ")}.` : "The board is empty.",
      existing.length
        ? "Propose the next 5 beats that continue from the last beat on the board, building toward a climax."
        : "Propose 6 beats that take the story from its opening to its climax.",
      "Each beat has a short evocative title (2 to 6 words), a body of one or two sentences, kind 'scene' or 'beat', and the names of the characters in it (only names from the list).",
      "Respond only with JSON."
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await chatJson<{ shards?: Array<Record<string, unknown>> }>(system, prompt || "Weave the next beats of my story.", WEAVE_SCHEMA, 0.85);
    const byName = new Map(souls.map((s) => [s.name.toLowerCase(), s.id]));
    const startX = existing.length ? Math.max(...board.shards.map((s) => s.x)) + 300 : 80;
    const baseOrder = existing.length ? Math.max(...board.shards.map((s) => s.order)) + 1 : 0;
    const shards: LoomShard[] = (raw.shards ?? []).slice(0, 8).map((s, i) => ({
      id: randomUUID().slice(0, 12),
      kind: s.kind === "beat" ? "beat" : "scene",
      title: str(s.title, 120) || `Beat ${i + 1}`,
      body: str(s.body, 1500),
      // A gentle wave from left to right, so new beats read in order.
      x: startX + i * 290,
      y: 120 + (i % 2 ? 170 : 0),
      order: baseOrder + i,
      soulIds: Array.isArray(s.characters)
        ? [...new Set(s.characters.map((n) => byName.get(String(n).toLowerCase())).filter((id): id is string => Boolean(id)))]
        : [],
      folioId: null
    }));
    const last = existing[existing.length - 1];
    const chain = last ? [last, ...shards] : shards;
    const threads: LoomThread[] = chain.slice(1).map((s, i) => ({ id: randomUUID().slice(0, 12), from: chain[i].id, to: s.id, kind: "leads_to" }));
    return { shards, threads };
  }

  /* ----- Lantern Press ----- */

  async press(userId: string, sagaId: string): Promise<PressContract> {
    const saga = await this.ownSaga(userId, sagaId);
    const [folios, souls] = await Promise.all([
      this.prisma.folio.findMany({ where: { sagaId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, title: true, status: true, wordCount: true } }),
      this.prisma.soul.findMany({ where: { sagaId }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, role: true } })
    ]);
    return {
      sagaId: saga.id,
      title: saga.title,
      logline: saga.logline,
      genre: saga.genre,
      slug: saga.slug,
      tagline: saga.tagline,
      blurb: saga.blurb,
      coverStyle: saga.coverStyle,
      publishedAt: saga.publishedAt?.toISOString() ?? null,
      hearth: (saga.hearth as HearthCasting | null) ?? null,
      chapters: folios,
      souls: souls.map((s) => ({ ...s, role: s.role as SoulRole }))
    };
  }

  async savePress(userId: string, sagaId: string, body: Record<string, unknown>) {
    await this.ownSaga(userId, sagaId);
    let hearth: HearthCasting | undefined;
    if (body.hearth !== undefined) {
      const raw = (body.hearth ?? {}) as { narrator?: unknown; souls?: Record<string, unknown> };
      const soulIds = new Set((await this.prisma.soul.findMany({ where: { sagaId }, select: { id: true } })).map((s) => s.id));
      hearth = {
        narrator: readVoice(raw.narrator),
        souls: Object.fromEntries(Object.entries(raw.souls ?? {}).filter(([id]) => soulIds.has(id)).map(([id, v]) => [id, readVoice(v)]))
      };
    }
    await this.prisma.saga.update({
      where: { id: sagaId },
      data: {
        tagline: longText(body.tagline, "Tagline", 160),
        blurb: longText(body.blurb, "Blurb", 1200),
        coverStyle: body.coverStyle === undefined ? undefined : Math.round(clampNumber(body.coverStyle, 0, COVER_STYLES - 1, 0)),
        hearth: hearth as unknown as Prisma.InputJsonValue | undefined
      }
    });
    return this.press(userId, sagaId);
  }

  /** Lis drafts a back-cover blurb and a one-line tagline from the logline and opening. */
  async blurb(userId: string, sagaId: string) {
    const saga = await this.ownSaga(userId, sagaId);
    const [folios, souls] = await Promise.all([
      this.prisma.folio.findMany({ where: { sagaId }, orderBy: { sortOrder: "asc" }, select: { title: true, content: true } }),
      this.prisma.soul.findMany({ where: { sagaId }, select: { name: true, summary: true }, take: 5 })
    ]);
    const opening = folios.map((f) => f.content).join("\n\n").slice(0, 2500);
    const system = [
      `You are Lis, writing the back-cover copy for "${saga.title}"${saga.genre ? `, a ${saga.genre} story` : ""}.`,
      saga.logline ? `Logline: ${saga.logline}` : "",
      souls.length ? `Main characters: ${souls.map((s) => `${s.name}${s.summary ? ` (${s.summary})` : ""}`).join("; ")}.` : "",
      folios.length ? `Chapters: ${folios.map((f) => f.title).join(", ")}.` : "",
      "tagline: one gripping line under 15 words. blurb: 70 to 110 words that hook a reader without spoiling the ending, in present tense.",
      "Respond only with JSON."
    ]
      .filter(Boolean)
      .join("\n");
    const raw = await chatJson<{ tagline?: string; blurb?: string }>(system, opening ? `The story opens:\n${opening}` : "Write the copy from the logline.", BLURB_SCHEMA, 0.8);
    return { tagline: str(raw.tagline, 160).trim(), blurb: str(raw.blurb, 1200).trim() };
  }

  async publish(userId: string, sagaId: string) {
    const saga = await this.ownSaga(userId, sagaId);
    const written = await this.prisma.folio.count({ where: { sagaId, wordCount: { gt: 0 } } });
    if (!written) throw new BadRequestException("Write at least one chapter before lighting the lantern.");
    if (!saga.blurb?.trim()) throw new BadRequestException("Add a blurb so readers know what they're opening.");
    let slug = saga.slug;
    if (!slug) {
      const base = slugify(saga.title) || "saga";
      slug = base;
      for (let n = 2; await this.prisma.saga.findFirst({ where: { slug, id: { not: sagaId } } }); n++) slug = `${base}-${n}`;
    }
    await this.prisma.saga.update({ where: { id: sagaId }, data: { slug, publishedAt: new Date(), visibility: "public", status: "published" } });
    return this.press(userId, sagaId);
  }

  async unpublish(userId: string, sagaId: string) {
    await this.ownSaga(userId, sagaId);
    await this.prisma.saga.update({ where: { id: sagaId }, data: { publishedAt: null, visibility: "private", status: "draft" } });
    return this.press(userId, sagaId);
  }
}

@Controller("inkverse")
@UseGuards(AuthGuard)
export class StudioController {
  constructor(
    @Inject(StudioService) private readonly studio: StudioService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  @Get("me/ranks")
  ranks(@Req() req: AuthenticatedRequest) {
    return computeRanks(this.prisma, req.user!.id);
  }

  @Get("sagas/:id/loom")
  loom(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.studio.loom(req.user!.id, id);
  }

  @Put("sagas/:id/loom")
  saveLoom(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: unknown) {
    return this.studio.saveLoom(req.user!.id, id, body);
  }

  @Post("sagas/:id/loom/weave")
  weave(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.studio.weave(req.user!.id, id, body ?? {});
  }

  @Get("sagas/:id/press")
  press(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.studio.press(req.user!.id, id);
  }

  @Put("sagas/:id/press")
  savePress(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.studio.savePress(req.user!.id, id, body ?? {});
  }

  @Post("sagas/:id/press/blurb")
  blurb(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.studio.blurb(req.user!.id, id);
  }

  @Post("sagas/:id/press/publish")
  publish(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.studio.publish(req.user!.id, id);
  }

  @Post("sagas/:id/press/unpublish")
  unpublish(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.studio.unpublish(req.user!.id, id);
  }
}

