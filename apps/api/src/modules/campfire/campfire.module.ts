import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import type { CampfireKind, CampfirePost, CampfireReply, Prisma, User } from "@prisma/client";
import type { Request } from "express";
import type {
  CampfireAuthor,
  CampfirePostContract,
  CampfireReplyContract,
  CampfireThreadContract,
  CreatorPageContract,
  HearthCasting,
  ShelfBookContract,
  ShelfBookDetailContract,
  SoulRole
} from "@lisbook/types";
import { AuthGuard, type AuthenticatedRequest } from "../../common/auth/auth.guard";
import { readToken } from "../../common/auth/tokens";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";
import { computeRanks } from "../inkverse/ranks";
import { names, oneOf, text } from "../inkverse/validation";

const KINDS: CampfireKind[] = ["spark", "duel", "tale", "prompt"];
export const TAVERNS = ["general", "fantasy", "sci-fi", "horror", "romance", "mystery", "worldbuilding", "craft"];

/** The signed-in viewer for public pages, or null; never throws. */
function viewerId(req: Request) {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? readToken(header.slice(7).trim(), "access") : null;
}

type AuthorRow = Pick<User, "id" | "displayName"> & { creatorProfile: { quillName: string } | null };
const authorSelect = { select: { id: true, displayName: true, creatorProfile: { select: { quillName: true } } } } as const;
const toAuthor = (a: AuthorRow): CampfireAuthor => ({ id: a.id, name: a.creatorProfile?.quillName ?? a.displayName, quillName: a.creatorProfile?.quillName ?? null });

type PostRow = CampfirePost & { author: AuthorRow; reactions: Array<{ kind: string; userId: string }>; _count: { replies: number } };
type ReplyRow = CampfireReply & { author: AuthorRow; reactions: Array<{ kind: string; userId: string }> };

function toPost(post: PostRow, viewer: string | null): CampfirePostContract {
  const count = (kind: string) => post.reactions.filter((r) => r.kind === kind).length;
  const mineVote = post.reactions.find((r) => r.userId === viewer && r.kind.startsWith("vote_"))?.kind;
  return {
    id: post.id,
    kind: post.kind,
    title: post.title,
    body: post.body,
    sideA: post.sideA,
    sideB: post.sideB,
    tags: post.tags,
    tavern: post.tavern,
    pinned: post.pinned,
    adoptedCount: post.adoptedCount,
    author: toAuthor(post.author),
    embers: count("ember"),
    replyCount: post._count.replies,
    votesA: count("vote_a"),
    votesB: count("vote_b"),
    mine: {
      ember: post.reactions.some((r) => r.userId === viewer && r.kind === "ember"),
      vote: mineVote === "vote_a" ? "a" : mineVote === "vote_b" ? "b" : null,
      isAuthor: post.authorId === viewer
    },
    createdAt: post.createdAt.toISOString()
  };
}

function toReply(reply: ReplyRow, viewer: string | null): CampfireReplyContract {
  return {
    id: reply.id,
    body: reply.body,
    side: reply.side === "a" || reply.side === "b" ? reply.side : null,
    author: toAuthor(reply.author),
    embers: reply.reactions.filter((r) => r.kind === "ember").length,
    mine: { ember: reply.reactions.some((r) => r.userId === viewer && r.kind === "ember"), isAuthor: reply.authorId === viewer },
    createdAt: reply.createdAt.toISOString()
  };
}

const postInclude = {
  author: authorSelect,
  reactions: { select: { kind: true, userId: true } },
  _count: { select: { replies: true } }
} satisfies Prisma.CampfirePostInclude;

/* ---------- The Debut Shelf: published Sagas, readable by anyone ---------- */

type ShelfRow = Prisma.SagaGetPayload<{ include: { owner: { select: { displayName: true; creatorProfile: { select: { quillName: true } } } }; folios: { select: { wordCount: true } } } }>;
const shelfInclude = {
  owner: { select: { displayName: true, creatorProfile: { select: { quillName: true } } } },
  folios: { select: { wordCount: true } }
} as const;

function toShelf(saga: ShelfRow): ShelfBookContract {
  const written = saga.folios.filter((f) => f.wordCount > 0);
  return {
    slug: saga.slug!,
    title: saga.title,
    tagline: saga.tagline,
    blurb: saga.blurb,
    genre: saga.genre,
    coverStyle: saga.coverStyle,
    author: { quillName: saga.owner.creatorProfile?.quillName ?? saga.owner.displayName, displayName: saga.owner.displayName },
    chapterCount: written.length,
    wordCount: written.reduce((sum, f) => sum + f.wordCount, 0),
    publishedAt: saga.publishedAt!.toISOString()
  };
}

@Injectable()
class CampfireService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /* ----- Shelf ----- */

  async shelf(): Promise<ShelfBookContract[]> {
    const sagas = await this.prisma.saga.findMany({ where: { publishedAt: { not: null } }, include: shelfInclude, orderBy: { publishedAt: "desc" } });
    return sagas.map(toShelf);
  }

  async book(slug: string): Promise<ShelfBookDetailContract> {
    const saga = await this.prisma.saga.findFirst({ where: { slug, publishedAt: { not: null } }, include: shelfInclude });
    if (!saga) throw new NotFoundException("This book isn't on the Debut Shelf");
    const [folios, souls] = await Promise.all([
      this.prisma.folio.findMany({
        where: { sagaId: saga.id, wordCount: { gt: 0 } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, title: true, content: true, wordCount: true }
      }),
      this.prisma.soul.findMany({ where: { sagaId: saga.id }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, aliases: true, role: true, summary: true } })
    ]);
    return {
      ...toShelf(saga),
      logline: saga.logline,
      chapters: folios,
      souls: souls.map((s) => ({ ...s, role: s.role as SoulRole })),
      hearth: (saga.hearth as HearthCasting | null) ?? null
    };
  }

  /* ----- Campfire ----- */

  async list(viewer: string | null, query: { kind?: string; tavern?: string; sort?: string }) {
    const kind = KINDS.includes(query.kind as CampfireKind) ? (query.kind as CampfireKind) : undefined;
    const tavern = TAVERNS.includes(query.tavern ?? "") ? query.tavern : undefined;
    const posts = await this.prisma.campfirePost.findMany({
      where: { kind, tavern },
      include: postInclude,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 100
    });
    const mapped = posts.map((p) => toPost(p, viewer));
    // "Hot" weighs Embers, replies and votes against age, so new posts still get a turn at the fire.
    if (query.sort === "hot") {
      const heat = (p: CampfirePostContract) =>
        (p.embers * 2 + p.replyCount * 3 + p.votesA + p.votesB + 1) / Math.pow((Date.now() - Date.parse(p.createdAt)) / 3_600_000 + 2, 1.2);
      mapped.sort((a, b) => Number(b.pinned) - Number(a.pinned) || heat(b) - heat(a));
    }
    return mapped;
  }

  async thread(viewer: string | null, id: string): Promise<CampfireThreadContract> {
    const post = await this.prisma.campfirePost.findUnique({ where: { id }, include: postInclude });
    if (!post) throw new NotFoundException("That post has gone out");
    const replies = await this.prisma.campfireReply.findMany({
      where: { postId: id },
      include: { author: authorSelect, reactions: { select: { kind: true, userId: true } } },
      orderBy: { createdAt: "asc" }
    });
    return { ...toPost(post, viewer), replies: replies.map((r) => toReply(r, viewer)) };
  }

  async create(userId: string, body: Record<string, unknown>) {
    const kind = oneOf(body.kind, "Kind", KINDS) ?? "spark";
    const isDuel = kind === "duel";
    const post = await this.prisma.campfirePost.create({
      data: {
        authorId: userId,
        kind,
        title: text(body.title, "Title", { min: 3, max: 140 })!,
        body: text(body.body, isDuel ? "The question" : "Your idea", { min: isDuel ? 0 : 3, max: 4000, optional: isDuel }) ?? "",
        sideA: isDuel ? text(body.sideA, "Side A", { min: 1, max: 80 }) : null,
        sideB: isDuel ? text(body.sideB, "Side B", { min: 1, max: 80 }) : null,
        tags: names(body.tags, "Tag", 5) ?? [],
        tavern: oneOf(body.tavern, "Tavern", TAVERNS) ?? "general"
      }
    });
    return this.thread(userId, post.id);
  }

  async reply(userId: string, postId: string, body: Record<string, unknown>) {
    const post = await this.prisma.campfirePost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("That post has gone out");
    let side: string | null = null;
    if (post.kind === "duel") {
      side = oneOf(body.side, "Side", ["a", "b"] as const) ?? null;
      if (!side) throw new BadRequestException("Pick a side before you argue");
    }
    if (post.kind === "tale") {
      // Round Robin: everyone takes turns, so nobody adds two passages in a row.
      const last = await this.prisma.campfireReply.findFirst({ where: { postId }, orderBy: { createdAt: "desc" } });
      const lastAuthor = last?.authorId ?? post.authorId;
      if (lastAuthor === userId) throw new BadRequestException("Let someone else add the next passage first.");
    }
    await this.prisma.campfireReply.create({
      data: { postId, authorId: userId, side, body: text(body.body, "Your reply", { min: 2, max: post.kind === "tale" ? 2500 : 2000 })! }
    });
    return this.thread(userId, postId);
  }

  async react(userId: string, postId: string, body: Record<string, unknown>) {
    const post = await this.prisma.campfirePost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("That post has gone out");
    const kind = oneOf(body.kind, "Reaction", ["ember", "vote_a", "vote_b"] as const)!;
    if (kind !== "ember" && post.kind !== "duel") throw new BadRequestException("Only Duels take votes");
    const existing = await this.prisma.campfireReaction.findFirst({ where: { userId, postId, kind } });
    if (existing) {
      await this.prisma.campfireReaction.delete({ where: { id: existing.id } });
    } else {
      // One vote per Duel: switching sides moves the vote.
      if (kind !== "ember") await this.prisma.campfireReaction.deleteMany({ where: { userId, postId, kind: { in: ["vote_a", "vote_b"] } } });
      await this.prisma.campfireReaction.create({ data: { userId, postId, kind } });
    }
    return this.thread(userId, postId);
  }

  async reactReply(userId: string, replyId: string) {
    const reply = await this.prisma.campfireReply.findUnique({ where: { id: replyId } });
    if (!reply) throw new NotFoundException("That reply is gone");
    const existing = await this.prisma.campfireReaction.findFirst({ where: { userId, replyId, kind: "ember" } });
    if (existing) await this.prisma.campfireReaction.delete({ where: { id: existing.id } });
    else await this.prisma.campfireReaction.create({ data: { userId, replyId, kind: "ember" } });
    return this.thread(userId, reply.postId);
  }

  /** Turns someone's Spark into a new Saga for the viewer, crediting the original poster. */
  async adopt(userId: string, postId: string) {
    const post = await this.prisma.campfirePost.findUnique({ where: { id: postId }, include: { author: authorSelect } });
    if (!post || post.kind === "duel") throw new BadRequestException("Only Sparks, Prompts and Tales can be adopted");
    const credit = post.authorId === userId ? "" : ` (adopted from a Spark by ${toAuthor(post.author).name})`;
    const saga = await this.prisma.saga.create({
      data: {
        ownerId: userId,
        title: post.title.slice(0, 120),
        logline: `${post.body.slice(0, 380 - credit.length)}${credit}`,
        folios: { create: { title: "Chapter 1", sortOrder: 0 } }
      },
      include: { folios: { select: { id: true } } }
    });
    await this.prisma.campfirePost.update({ where: { id: postId }, data: { adoptedCount: { increment: 1 } } });
    return { sagaId: saga.id, folioId: saga.folios[0].id };
  }

  async remove(userId: string, postId: string) {
    const post = await this.prisma.campfirePost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("That post has gone out");
    if (post.authorId !== userId) throw new ForbiddenException("Only the author can remove this post");
    await this.prisma.campfirePost.delete({ where: { id: postId } });
    return { ok: true };
  }

  /* ----- Creator pages ----- */

  async creator(viewer: string | null, quillName: string): Promise<CreatorPageContract> {
    const profile = await this.prisma.creatorProfile.findFirst({
      where: { quillName: { equals: quillName, mode: "insensitive" } },
      include: { user: { select: { displayName: true } } }
    });
    if (!profile) throw new NotFoundException("No creator by that Quill Name");
    const [ranks, books, posts] = await Promise.all([
      computeRanks(this.prisma, profile.userId),
      this.prisma.saga.findMany({ where: { ownerId: profile.userId, publishedAt: { not: null } }, include: shelfInclude, orderBy: { publishedAt: "desc" } }),
      this.prisma.campfirePost.findMany({ where: { authorId: profile.userId }, include: postInclude, orderBy: { createdAt: "desc" }, take: 20 })
    ]);
    return {
      quillName: profile.quillName,
      displayName: profile.user.displayName,
      bio: profile.bio,
      genres: profile.genres,
      ranks,
      books: books.map(toShelf),
      posts: posts.map((p) => toPost(p, viewer))
    };
  }
}

@Controller()
class CampfireController {
  constructor(@Inject(CampfireService) private readonly campfire: CampfireService) {}

  @Get("library")
  shelf() {
    return this.campfire.shelf();
  }

  @Get("library/:slug")
  book(@Param("slug") slug: string) {
    return this.campfire.book(slug);
  }

  @Get("creators/:quillName")
  creator(@Req() req: Request, @Param("quillName") quillName: string) {
    return this.campfire.creator(viewerId(req), quillName);
  }

  @Get("campfire/posts")
  list(@Req() req: Request, @Query() query: { kind?: string; tavern?: string; sort?: string }) {
    return this.campfire.list(viewerId(req), query ?? {});
  }

  @Get("campfire/posts/:id")
  thread(@Req() req: Request, @Param("id") id: string) {
    return this.campfire.thread(viewerId(req), id);
  }

  @Post("campfire/posts")
  @UseGuards(AuthGuard)
  create(@Req() req: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.campfire.create(req.user!.id, body ?? {});
  }

  @Post("campfire/posts/:id/replies")
  @UseGuards(AuthGuard)
  reply(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.campfire.reply(req.user!.id, id, body ?? {});
  }

  @Post("campfire/posts/:id/react")
  @UseGuards(AuthGuard)
  react(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.campfire.react(req.user!.id, id, body ?? {});
  }

  @Post("campfire/replies/:id/react")
  @UseGuards(AuthGuard)
  reactReply(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.campfire.reactReply(req.user!.id, id);
  }

  @Post("campfire/posts/:id/adopt")
  @UseGuards(AuthGuard)
  adopt(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.campfire.adopt(req.user!.id, id);
  }

  @Delete("campfire/posts/:id")
  @UseGuards(AuthGuard)
  remove(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.campfire.remove(req.user!.id, id);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [CampfireController],
  providers: [CampfireService]
})
export class CampfireModule {}
