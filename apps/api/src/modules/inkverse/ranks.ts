import type { InkBadge, InkRankContract } from "@lisbook/types";
import type { PrismaService } from "../../common/prisma/prisma.service";

// Ink Ranks reward making things: words, worlds, books and generosity at the Campfire.
const RANKS = [
  { name: "Scribbler", at: 0 },
  { name: "Wordsmith", at: 30 },
  { name: "Storyweaver", at: 120 },
  { name: "Loremaster", at: 400 },
  { name: "Mythmaker", at: 1000 }
];

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/** Counts today toward the writer's Ink Streak; called whenever chapter text is saved. */
export async function recordWritingDay(prisma: PrismaService, userId: string) {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) return;
  const today = dayKey(new Date());
  if (profile.lastWriteDay === today) return;
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  const streakDays = profile.lastWriteDay === yesterday ? profile.streakDays + 1 : 1;
  await prisma.creatorProfile.update({
    where: { userId },
    data: { lastWriteDay: today, streakDays, longestStreak: Math.max(profile.longestStreak, streakDays) }
  });
}

export async function computeRanks(prisma: PrismaService, userId: string): Promise<InkRankContract> {
  const [profile, sagas, souls, atlas, sparks, duelArgs, postEmbers, replyEmbers] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId } }),
    prisma.saga.findMany({ where: { ownerId: userId }, select: { publishedAt: true, loom: true, folios: { select: { wordCount: true } } } }),
    prisma.soul.count({ where: { saga: { ownerId: userId } } }),
    prisma.atlasEntry.count({ where: { saga: { ownerId: userId } } }),
    prisma.campfirePost.count({ where: { authorId: userId, kind: "spark" } }),
    prisma.campfireReply.count({ where: { authorId: userId, post: { kind: "duel" } } }),
    prisma.campfireReaction.count({ where: { kind: "ember", post: { authorId: userId } } }),
    prisma.campfireReaction.count({ where: { kind: "ember", reply: { authorId: userId } } })
  ]);

  const words = sagas.reduce((sum, s) => sum + s.folios.reduce((n, f) => n + f.wordCount, 0), 0);
  const published = sagas.filter((s) => s.publishedAt).length;
  const shards = Math.max(0, ...sagas.map((s) => ((s.loom as { shards?: unknown[] } | null)?.shards?.length ?? 0)));
  const embersReceived = postEmbers + replyEmbers;
  const streak = profile?.streakDays ?? 0;
  const longest = profile?.longestStreak ?? 0;

  const points =
    Math.floor(words / 100) + published * 50 + souls * 3 + atlas * 2 + Math.min(shards, 30) + sparks * 5 + embersReceived * 2 + duelArgs * 3;
  const index = RANKS.reduce((best, rank, i) => (points >= rank.at ? i : best), 0);
  const next = RANKS[index + 1] ?? null;

  const badge = (id: string, name: string, description: string, earned: boolean): InkBadge => ({ id, name, description, earned });
  const badges = [
    badge("first-ink", "First Ink", "Wrote your first words", words > 0),
    badge("thousand", "A Thousand Words", "Wrote 1,000 words across your Sagas", words >= 1000),
    badge("soulsmith", "Soulsmith", "Forged three Souls", souls >= 3),
    badge("cartographer", "Cartographer", "Mapped five Atlas entries", atlas >= 5),
    badge("weaver", "Weaver", "Wove five Shards on the Loom", shards >= 5),
    badge("lantern", "Lantern Lit", "Published a book to the Debut Shelf", published > 0),
    badge("spark", "Spark Starter", "Shared an idea at the Campfire", sparks > 0),
    badge("duelist", "Duelist", "Argued a side in a Duel", duelArgs > 0),
    badge("ember", "Ember Bearer", "Received ten Embers", embersReceived >= 10),
    badge("streak", "Ink Streak", "Wrote on three days in a row", longest >= 3)
  ];

  return {
    rank: RANKS[index].name,
    nextRank: next?.name ?? null,
    points,
    nextAt: next?.at ?? null,
    streakDays: streak,
    longestStreak: longest,
    stats: { words, sagas: sagas.length, published, souls, sparks, embersReceived },
    badges
  };
}
