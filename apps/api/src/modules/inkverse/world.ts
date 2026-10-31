import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards
} from "@nestjs/common";
import type { AtlasEntry, AtlasKind, Prisma, Soul, SoulBond } from "@prisma/client";
import type { Response } from "express";
import {
  countMentions,
  type AppearanceContract,
  type AtlasEntryContract,
  type BondKind,
  type SagaWorldContract,
  type SoulBondContract,
  type SoulContract,
  type SoulRole
} from "@lisbook/types";
import { AuthGuard, type AuthenticatedRequest } from "../../common/auth/auth.guard";
import { chatJson, cleanMessages, streamOllamaChat } from "../../common/ollama";
import { PrismaService } from "../../common/prisma/prisma.service";
import { longText, names, oneOf, text } from "./validation";

export const SOUL_ROLES: SoulRole[] = ["protagonist", "antagonist", "supporting", "mentor", "love_interest", "minor"];
const BOND_KINDS: BondKind[] = ["family", "friend", "ally", "rival", "enemy", "lover", "mentor", "other"];
const ATLAS_KINDS: AtlasKind[] = ["place", "lore", "faction", "event"];
const SOUL_TEXT_FIELDS = ["summary", "appearance", "personality", "desires", "fears", "secrets", "voice", "arcStart", "arcEnd"] as const;

type Named = { id: string; name: string; aliases: string[] };
type MentionRow = { count: number; folio: { id: string; title: string; sortOrder: number } };

/* ---------- Mentions: which chapters name which Souls and places ---------- */

function mentionRows(folio: { id: string; content: string }, souls: Named[], atlas: Named[]) {
  return [
    ...souls.map((s) => ({ folioId: folio.id, soulId: s.id, count: countMentions(folio.content, s) })),
    ...atlas.map((a) => ({ folioId: folio.id, atlasEntryId: a.id, count: countMentions(folio.content, a) }))
  ].filter((row) => row.count > 0);
}

async function worldNames(prisma: PrismaService, sagaId: string) {
  const select = { id: true, name: true, aliases: true } as const;
  return Promise.all([prisma.soul.findMany({ where: { sagaId }, select }), prisma.atlasEntry.findMany({ where: { sagaId }, select })]);
}

export async function rebuildFolioMentions(prisma: PrismaService, folio: { id: string; sagaId: string; content: string }) {
  const [souls, atlas] = await worldNames(prisma, folio.sagaId);
  await prisma.$transaction([
    prisma.entityMention.deleteMany({ where: { folioId: folio.id } }),
    prisma.entityMention.createMany({ data: mentionRows(folio, souls, atlas) })
  ]);
}

export async function rebuildSagaMentions(prisma: PrismaService, sagaId: string) {
  const [souls, atlas] = await worldNames(prisma, sagaId);
  const folios = await prisma.folio.findMany({ where: { sagaId }, select: { id: true, content: true } });
  await prisma.$transaction([
    prisma.entityMention.deleteMany({ where: { folio: { sagaId } } }),
    prisma.entityMention.createMany({ data: folios.flatMap((folio) => mentionRows(folio, souls, atlas)) })
  ]);
}

/* ---------- The story bible Lis reads before writing ---------- */

const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

function soulLine(soul: Soul) {
  const parts = [
    soul.summary,
    soul.appearance && `Looks: ${soul.appearance}`,
    soul.personality && `Personality: ${soul.personality}`,
    soul.voice && `Speaks: ${soul.voice}`,
    soul.desires && `Wants: ${soul.desires}`,
    soul.fears && `Fears: ${soul.fears}`,
    soul.secrets && `Secret (only reveal if the story does): ${soul.secrets}`
  ].filter(Boolean);
  const aka = soul.aliases.length ? ` (also called ${soul.aliases.join(", ")})` : "";
  return clip(`- ${soul.name}${aka}, ${soul.role.replace("_", " ")}: ${parts.join(" ")}`, 520);
}

/**
 * The Souls, bonds and Atlas entries relevant to `text`, as compact lines within `budget` characters.
 * Falls back to the main characters when nobody is named yet, so a first chapter still knows its hero.
 */
export async function worldBrief(prisma: PrismaService, sagaId: string, text: string, budget: number) {
  const [souls, atlas, bonds] = await Promise.all([
    prisma.soul.findMany({ where: { sagaId }, orderBy: { sortOrder: "asc" } }),
    prisma.atlasEntry.findMany({ where: { sagaId } }),
    prisma.soulBond.findMany({ where: { sagaId } })
  ]);
  if (!souls.length && !atlas.length) return "";

  const ranked = <T extends Named>(list: T[]) =>
    list
      .map((entity) => ({ entity, count: countMentions(text, entity) }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((r) => r.entity);

  let cast = ranked(souls);
  if (!cast.length) cast = souls.filter((s) => s.role === "protagonist" || s.role === "antagonist").slice(0, 3);
  const places = ranked(atlas);
  const castIds = new Set(cast.map((s) => s.id));
  const byId = new Map(souls.map((s) => [s.id, s.name]));

  const sections: string[][] = [
    cast.map(soulLine),
    bonds
      .filter((b) => castIds.has(b.fromSoulId) && castIds.has(b.toSoulId))
      .map((b) => `- ${byId.get(b.fromSoulId)} & ${byId.get(b.toSoulId)}: ${b.kind}${b.note ? ` (${b.note})` : ""}`),
    places.map((a) => clip(`- ${a.name} (${a.kind}${a.era ? `, ${a.era}` : ""}): ${[a.summary, a.details].filter(Boolean).join(" ")}`, 420))
  ];

  const out: string[] = [];
  let used = 0;
  for (const line of sections.flat()) {
    if (used + line.length > budget) break;
    out.push(line);
    used += line.length + 1;
  }
  return out.join("\n");
}

/* ---------- Contracts ---------- */

function appearances(rows: MentionRow[]): AppearanceContract[] {
  return rows
    .map((r) => ({ folioId: r.folio.id, title: r.folio.title, sortOrder: r.folio.sortOrder, count: r.count }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function toSoul(soul: Soul & { mentions: MentionRow[] }): SoulContract {
  return {
    id: soul.id,
    sagaId: soul.sagaId,
    name: soul.name,
    aliases: soul.aliases,
    role: soul.role as SoulRole,
    summary: soul.summary,
    appearance: soul.appearance,
    personality: soul.personality,
    desires: soul.desires,
    fears: soul.fears,
    secrets: soul.secrets,
    voice: soul.voice,
    arcStart: soul.arcStart,
    arcEnd: soul.arcEnd,
    appearances: appearances(soul.mentions)
  };
}

function toBond(bond: SoulBond): SoulBondContract {
  return { id: bond.id, fromSoulId: bond.fromSoulId, toSoulId: bond.toSoulId, kind: bond.kind as BondKind, note: bond.note };
}

function toAtlas(entry: AtlasEntry & { mentions: MentionRow[] }): AtlasEntryContract {
  return {
    id: entry.id,
    sagaId: entry.sagaId,
    kind: entry.kind,
    name: entry.name,
    aliases: entry.aliases,
    summary: entry.summary,
    details: entry.details,
    parentId: entry.parentId,
    era: entry.era,
    chronoOrder: entry.chronoOrder,
    appearances: appearances(entry.mentions)
  };
}

const withMentions = { mentions: { select: { count: true, folio: { select: { id: true, title: true, sortOrder: true } } } } } as const;

/* ---------- Forge with Lis: draft a card from one sentence ---------- */

const str = { type: "string" };
const SOUL_SCHEMA = {
  type: "object",
  properties: {
    name: str,
    aliases: { type: "array", items: str },
    role: { type: "string", enum: SOUL_ROLES },
    summary: str,
    appearance: str,
    personality: str,
    desires: str,
    fears: str,
    secrets: str,
    voice: str,
    arcStart: str,
    arcEnd: str
  },
  required: ["name", "aliases", "role", "summary", "appearance", "personality", "desires", "fears", "secrets", "voice", "arcStart", "arcEnd"]
};
const ATLAS_SCHEMA = {
  type: "object",
  properties: { name: str, aliases: { type: "array", items: str }, summary: str, details: str, era: str },
  required: ["name", "aliases", "summary", "details", "era"]
};

const ATLAS_GUIDE: Record<AtlasKind, string> = {
  place: "a place: summary is what it is and how it feels; details cover sights, sounds, history and who lives there",
  lore: "a piece of lore such as a magic system, belief, technology or law: summary states the rule; details cover its costs, limits and exceptions",
  faction: "a faction or group: summary is who they are and what they want; details cover leaders, methods, allies and enemies",
  event: "an event in the world's history: summary is what happened; details cover causes and consequences; era is when it happened"
};

interface InterviewBody {
  messages?: unknown;
}

@Injectable()
export class WorldService {
  private readonly logger = new Logger("Soulforge");

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async ownSaga(userId: string, sagaId: string) {
    const saga = await this.prisma.saga.findFirst({ where: { id: sagaId, ownerId: userId } });
    if (!saga) throw new NotFoundException("Saga not found");
    return saga;
  }

  private async ownSoul(userId: string, soulId: string) {
    const soul = await this.prisma.soul.findFirst({ where: { id: soulId, saga: { ownerId: userId } } });
    if (!soul) throw new NotFoundException("Soul not found");
    return soul;
  }

  private async ownAtlas(userId: string, entryId: string) {
    const entry = await this.prisma.atlasEntry.findFirst({ where: { id: entryId, saga: { ownerId: userId } } });
    if (!entry) throw new NotFoundException("Atlas entry not found");
    return entry;
  }

  async world(userId: string, sagaId: string): Promise<SagaWorldContract> {
    const saga = await this.ownSaga(userId, sagaId);
    const [souls, bonds, atlas] = await Promise.all([
      this.prisma.soul.findMany({ where: { sagaId }, include: withMentions, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      this.prisma.soulBond.findMany({ where: { sagaId }, orderBy: { createdAt: "asc" } }),
      this.prisma.atlasEntry.findMany({ where: { sagaId }, include: withMentions, orderBy: [{ chronoOrder: "asc" }, { name: "asc" }] })
    ]);
    return { sagaId, sagaTitle: saga.title, souls: souls.map(toSoul), bonds: bonds.map(toBond), atlas: atlas.map(toAtlas) };
  }

  /* ----- Souls ----- */

  private soulData(body: Record<string, unknown>, creating: boolean) {
    const data: Prisma.SoulUncheckedUpdateInput = {
      name: creating || body.name !== undefined ? text(body.name, "Name", { min: 1, max: 80 }) : undefined,
      aliases: names(body.aliases, "Alias"),
      role: oneOf(body.role, "Role", SOUL_ROLES)
    };
    for (const field of SOUL_TEXT_FIELDS) data[field] = longText(body[field], field);
    return data;
  }

  async createSoul(userId: string, sagaId: string, body: Record<string, unknown>) {
    await this.ownSaga(userId, sagaId);
    const count = await this.prisma.soul.count({ where: { sagaId } });
    const soul = await this.prisma.soul.create({
      data: { ...(this.soulData(body, true) as Prisma.SoulUncheckedCreateInput), sagaId, sortOrder: count }
    });
    await rebuildSagaMentions(this.prisma, sagaId);
    return this.getSoul(userId, soul.id);
  }

  async getSoul(userId: string, soulId: string) {
    const soul = await this.prisma.soul.findFirst({ where: { id: soulId, saga: { ownerId: userId } }, include: withMentions });
    if (!soul) throw new NotFoundException("Soul not found");
    return toSoul(soul);
  }

  async updateSoul(userId: string, soulId: string, body: Record<string, unknown>) {
    const current = await this.ownSoul(userId, soulId);
    const data = this.soulData(body, false);
    await this.prisma.soul.update({ where: { id: soulId }, data });
    if (data.name !== undefined || data.aliases !== undefined) await rebuildSagaMentions(this.prisma, current.sagaId);
    return this.getSoul(userId, soulId);
  }

  async deleteSoul(userId: string, soulId: string) {
    await this.ownSoul(userId, soulId);
    await this.prisma.soul.delete({ where: { id: soulId } });
    return { ok: true };
  }

  /* ----- Bonds (the Kinship Web) ----- */

  async saveBond(userId: string, sagaId: string, body: Record<string, unknown>) {
    await this.ownSaga(userId, sagaId);
    const a = text(body.fromSoulId, "fromSoulId")!;
    const b = text(body.toSoulId, "toSoulId")!;
    if (a === b) throw new BadRequestException("A Soul can't be bonded to itself");
    const souls = await this.prisma.soul.count({ where: { sagaId, id: { in: [a, b] } } });
    if (souls !== 2) throw new BadRequestException("Both Souls must belong to this Saga");
    // Bonds are two-way, so each pair is stored once in a fixed order.
    const [fromSoulId, toSoulId] = [a, b].sort();
    const kind = oneOf(body.kind, "Kind", BOND_KINDS) ?? "other";
    const note = longText(body.note, "Note", 200) ?? null;
    const bond = await this.prisma.soulBond.upsert({
      where: { fromSoulId_toSoulId: { fromSoulId, toSoulId } },
      create: { sagaId, fromSoulId, toSoulId, kind, note },
      update: { kind, note }
    });
    return toBond(bond);
  }

  async deleteBond(userId: string, bondId: string) {
    const bond = await this.prisma.soulBond.findFirst({ where: { id: bondId, saga: { ownerId: userId } } });
    if (!bond) throw new NotFoundException("Bond not found");
    await this.prisma.soulBond.delete({ where: { id: bondId } });
    return { ok: true };
  }

  /* ----- Atlas of Elsewhere ----- */

  private async atlasData(sagaId: string, entryId: string | null, body: Record<string, unknown>, creating: boolean) {
    let parentId: string | null | undefined;
    if (body.parentId === null || body.parentId === "") parentId = null;
    else if (body.parentId !== undefined) {
      parentId = text(body.parentId, "parentId")!;
      // Walk up from the new parent to make sure an entry never ends up inside itself.
      let cursor: string | null = parentId;
      while (cursor) {
        if (cursor === entryId) throw new BadRequestException("An entry can't sit inside itself");
        const parent: { sagaId: string; parentId: string | null } | null = await this.prisma.atlasEntry.findUnique({
          where: { id: cursor },
          select: { sagaId: true, parentId: true }
        });
        if (!parent || parent.sagaId !== sagaId) throw new BadRequestException("The parent must belong to this Saga");
        cursor = parent.parentId;
      }
    }
    let chronoOrder: number | null | undefined;
    if (body.chronoOrder === null || body.chronoOrder === "") chronoOrder = null;
    else if (body.chronoOrder !== undefined) {
      chronoOrder = Number(body.chronoOrder);
      if (!Number.isInteger(chronoOrder) || Math.abs(chronoOrder) > 1_000_000) throw new BadRequestException("Timeline position must be a whole number");
    }
    return {
      kind: creating ? (oneOf(body.kind, "Kind", ATLAS_KINDS) ?? "place") : oneOf(body.kind, "Kind", ATLAS_KINDS),
      name: creating || body.name !== undefined ? text(body.name, "Name", { min: 1, max: 80 }) : undefined,
      aliases: names(body.aliases, "Alias"),
      summary: longText(body.summary, "Summary", 600),
      details: longText(body.details, "Details", 3000),
      era: longText(body.era, "Era", 60),
      parentId,
      chronoOrder
    };
  }

  async createAtlas(userId: string, sagaId: string, body: Record<string, unknown>) {
    await this.ownSaga(userId, sagaId);
    const data = await this.atlasData(sagaId, null, body, true);
    const entry = await this.prisma.atlasEntry.create({ data: { ...(data as Prisma.AtlasEntryUncheckedCreateInput), sagaId } });
    await rebuildSagaMentions(this.prisma, sagaId);
    return this.getAtlas(userId, entry.id);
  }

  async getAtlas(userId: string, entryId: string) {
    const entry = await this.prisma.atlasEntry.findFirst({ where: { id: entryId, saga: { ownerId: userId } }, include: withMentions });
    if (!entry) throw new NotFoundException("Atlas entry not found");
    return toAtlas(entry);
  }

  async updateAtlas(userId: string, entryId: string, body: Record<string, unknown>) {
    const current = await this.ownAtlas(userId, entryId);
    const data = await this.atlasData(current.sagaId, entryId, body, false);
    await this.prisma.atlasEntry.update({ where: { id: entryId }, data });
    if (data.name !== undefined || data.aliases !== undefined) await rebuildSagaMentions(this.prisma, current.sagaId);
    return this.getAtlas(userId, entryId);
  }

  async deleteAtlas(userId: string, entryId: string) {
    await this.ownAtlas(userId, entryId);
    await this.prisma.atlasEntry.delete({ where: { id: entryId } });
    return { ok: true };
  }

  /* ----- Forge with Lis ----- */

  async forge(userId: string, sagaId: string, body: Record<string, unknown>) {
    const saga = await this.ownSaga(userId, sagaId);
    const target = body.target === "atlas" ? "atlas" : "soul";
    const kind = oneOf(body.kind, "Kind", ATLAS_KINDS) ?? "place";
    const prompt = text(body.prompt, "Description", { min: 3, max: 600 })!;
    const [souls, atlas] = await worldNames(this.prisma, sagaId);

    const system = [
      `You are Lis, helping a writer build the world of their story "${saga.title}"${saga.genre ? ` (${saga.genre})` : ""}.`,
      saga.logline ? `Logline: ${saga.logline}` : "",
      souls.length ? `Characters that already exist (do not duplicate them): ${souls.map((s) => s.name).join(", ")}.` : "",
      atlas.length ? `Places and lore that already exist: ${atlas.map((a) => a.name).join(", ")}.` : "",
      target === "soul"
        ? "Create one character card from the writer's description. Every field is one or two short, vivid, specific sentences (under 35 words) that fit the story. aliases are nicknames or titles (may be empty). voice describes how they talk, with a short example phrase. arcStart is who they are at the beginning; arcEnd is who they could become."
        : `Create one Atlas entry for ${ATLAS_GUIDE[kind]}. summary is one short sentence; details is two to four sentences; era may be empty unless it is an event. aliases are other names (may be empty).`,
      "Keep the writer's own names and facts exactly as given. Respond only with JSON."
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await chatJson<Record<string, unknown>>(system, prompt, target === "soul" ? SOUL_SCHEMA : ATLAS_SCHEMA, 0.8);
    const pick = (key: string, max = 1500) => (typeof raw[key] === "string" ? clip((raw[key] as string).trim(), max) : "");
    const aliases = Array.isArray(raw.aliases)
      ? raw.aliases.filter((a): a is string => typeof a === "string" && a.trim().length > 0).map((a) => clip(a.trim(), 60)).slice(0, 8)
      : [];

    if (target === "soul") {
      const role = SOUL_ROLES.includes(raw.role as SoulRole) ? (raw.role as SoulRole) : "supporting";
      return {
        name: pick("name", 80),
        aliases,
        role,
        ...Object.fromEntries(SOUL_TEXT_FIELDS.map((field) => [field, pick(field)]))
      };
    }
    return { kind, name: pick("name", 80), aliases, summary: pick("summary", 600), details: pick("details", 3000), era: pick("era", 60) };
  }

  /* ----- Soul Interview ----- */

  async interview(userId: string, soulId: string, body: InterviewBody, res: Response) {
    const soul = await this.ownSoul(userId, soulId);
    const messages = cleanMessages(body?.messages, 12, 1500);
    if (!messages) throw new BadRequestException("Ask your character something to begin");
    const saga = await this.prisma.saga.findUniqueOrThrow({ where: { id: soul.sagaId } });
    const bonds = await this.prisma.soulBond.findMany({
      where: { OR: [{ fromSoulId: soulId }, { toSoulId: soulId }] },
      include: { fromSoul: { select: { id: true, name: true } }, toSoul: { select: { id: true, name: true } } }
    });

    const card = [
      soul.summary,
      soul.appearance && `You look like this: ${soul.appearance}`,
      soul.personality && `Your personality: ${soul.personality}`,
      soul.voice && `How you speak: ${soul.voice}`,
      soul.desires && `What you want most: ${soul.desires}`,
      soul.fears && `What you fear: ${soul.fears}`,
      soul.arcStart && `Where you are in life right now: ${soul.arcStart}`
    ].filter(Boolean);

    const system = [
      `You are ${soul.name}${soul.aliases.length ? ` (also called ${soul.aliases.join(", ")})` : ""}, a character in the story "${saga.title}"${saga.genre ? `, a ${saga.genre} tale` : ""}.`,
      "Your author is interviewing you to understand you better.",
      "Stay completely in character: speak in the first person, in your own voice, with your own attitude, vocabulary and emotions.",
      "Never mention being an AI, a model, a character card or a story, and never break character, even if asked to.",
      "",
      "Who you are:",
      ...card.map((line) => `- ${line}`),
      bonds.length
        ? `People in your life: ${bonds
            .map((b) => {
              const other = b.fromSoulId === soulId ? b.toSoul : b.fromSoul;
              return `${other.name} (${b.kind}${b.note ? `: ${b.note}` : ""})`;
            })
            .join("; ")}.`
        : "",
      soul.secrets ? `Your secret: ${soul.secrets}. Guard it. Only hint at it, unless the author presses you hard and earns the truth.` : "",
      "",
      "Answer in 2 to 5 sentences. If asked about something you could not know, react the way you would."
    ]
      .filter((line) => line !== "")
      .join("\n");

    await streamOllamaChat(res, { system, messages, temperature: 0.85, numCtx: 4096, logger: this.logger });
  }
}

@Controller("inkverse")
@UseGuards(AuthGuard)
export class WorldController {
  constructor(@Inject(WorldService) private readonly world: WorldService) {}

  @Get("sagas/:id/world")
  getWorld(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.world.world(req.user!.id, id);
  }

  @Post("sagas/:id/forge")
  forge(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.world.forge(req.user!.id, id, body ?? {});
  }

  @Post("sagas/:id/souls")
  createSoul(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.world.createSoul(req.user!.id, id, body ?? {});
  }

  @Get("souls/:id")
  getSoul(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.world.getSoul(req.user!.id, id);
  }

  @Patch("souls/:id")
  updateSoul(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.world.updateSoul(req.user!.id, id, body ?? {});
  }

  @Delete("souls/:id")
  deleteSoul(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.world.deleteSoul(req.user!.id, id);
  }

  @Post("souls/:id/interview")
  async interview(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: InterviewBody, @Res() res: Response) {
    await this.world.interview(req.user!.id, id, body, res);
  }

  @Put("sagas/:id/bonds")
  saveBond(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.world.saveBond(req.user!.id, id, body ?? {});
  }

  @Delete("bonds/:id")
  deleteBond(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.world.deleteBond(req.user!.id, id);
  }

  @Post("sagas/:id/atlas")
  createAtlas(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.world.createAtlas(req.user!.id, id, body ?? {});
  }

  @Patch("atlas/:id")
  updateAtlas(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.world.updateAtlas(req.user!.id, id, body ?? {});
  }

  @Delete("atlas/:id")
  deleteAtlas(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.world.deleteAtlas(req.user!.id, id);
  }
}
