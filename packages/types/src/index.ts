export type ThemeMode = "dark" | "light";

export interface LegacyReferencePage {
  slug: string;
  sourcePath: string;
  label: string;
}

export interface BrandPalette {
  background: string;
  surface: string;
  accent: string;
  text: string;
  muted: string;
}

export type EntityStatus = "draft" | "published" | "archived";
export type Visibility = "public" | "private" | "unlisted";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ChapterContract {
  id: string;
  audiobookId: string;
  title: string;
  chapterNumber: number;
  durationSeconds: number;
  audioAssetId?: string | null;
  audioUrl?: string | null;
  isPreview: boolean;
}

export interface AudiobookListItemContract {
  id: string;
  slug: string;
  title: string;
  authorName: string;
  narratorName?: string | null;
  categoryName?: string | null;
  status: EntityStatus;
  visibility: Visibility;
  coverUrl?: string | null;
  totalDurationSeconds: number;
  isFeatured: boolean;
}

export interface AudiobookDetailContract extends AudiobookListItemContract {
  description: string;
  language: string;
  chapters: ChapterContract[];
}

export interface PageContract {
  id: string;
  slug: string;
  title: string;
  status: EntityStatus;
  locale: string;
  content: string;
}

export interface FaqContract {
  id: string;
  question: string;
  answer: string;
  status: EntityStatus;
  locale: string;
  sortOrder: number;
}

export interface LoginResponseContract {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: string[];
  };
}

export interface NewsletterSubscribeResponseContract {
  email: string;
  subscribedAt: string;
}

// ---------- Inkverse (creator side) ----------

export type SagaForm = "novel" | "novella" | "short_story" | "serial";
export type FolioStatus = "draft" | "revising" | "done";
export type MuseMode = "write" | "spark" | "polish" | "echo";

export interface CreatorProfileContract {
  userId: string;
  quillName: string;
  bio: string | null;
  genres: string[];
  goal: string | null;
}

export interface FolioSummaryContract {
  id: string;
  sagaId: string;
  title: string;
  sortOrder: number;
  status: FolioStatus;
  wordCount: number;
  updatedAt: string;
}

export interface FolioContract extends FolioSummaryContract {
  content: string;
}

export interface FolioSnapshotContract {
  id: string;
  folioId: string;
  label: string | null;
  wordCount: number;
  createdAt: string;
}

export interface SagaSummaryContract {
  id: string;
  title: string;
  logline: string | null;
  genre: string | null;
  form: SagaForm;
  visibility: Visibility;
  folioCount: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SagaDetailContract extends SagaSummaryContract {
  folios: FolioSummaryContract[];
}

// ---------- Inkverse Phase 2: Souls & Realms ----------

export * from "./mentions";

export type SoulRole = "protagonist" | "antagonist" | "supporting" | "mentor" | "love_interest" | "minor";
export type BondKind = "family" | "friend" | "ally" | "rival" | "enemy" | "lover" | "mentor" | "other";
export type AtlasKind = "place" | "lore" | "faction" | "event";

/** A chapter an entity is named in, and how often. */
export interface AppearanceContract {
  folioId: string;
  title: string;
  sortOrder: number;
  count: number;
}

export interface SoulFields {
  name: string;
  aliases: string[];
  role: SoulRole;
  summary: string | null;
  appearance: string | null;
  personality: string | null;
  desires: string | null;
  fears: string | null;
  secrets: string | null;
  voice: string | null;
  arcStart: string | null;
  arcEnd: string | null;
}

export interface SoulContract extends SoulFields {
  id: string;
  sagaId: string;
  appearances: AppearanceContract[];
}

export interface SoulBondContract {
  id: string;
  fromSoulId: string;
  toSoulId: string;
  kind: BondKind;
  note: string | null;
}

export interface AtlasFields {
  kind: AtlasKind;
  name: string;
  aliases: string[];
  summary: string | null;
  details: string | null;
  parentId: string | null;
  era: string | null;
  chronoOrder: number | null;
}

export interface AtlasEntryContract extends AtlasFields {
  id: string;
  sagaId: string;
  appearances: AppearanceContract[];
}

export interface SagaWorldContract {
  sagaId: string;
  sagaTitle: string;
  souls: SoulContract[];
  bonds: SoulBondContract[];
  atlas: AtlasEntryContract[];
}

// ---------- Inkverse Phase 3: The Loom ----------

export type ShardKind = "scene" | "beat" | "idea" | "note" | "quote";
export type ThreadKind = "leads_to" | "foreshadows" | "conflicts" | "flashback" | "reveals";

export interface LoomShard {
  id: string;
  kind: ShardKind;
  title: string;
  body: string;
  x: number;
  y: number;
  /** Story order for the Timeline view; lower comes first. */
  order: number;
  soulIds: string[];
  folioId: string | null;
}

export interface LoomThread {
  id: string;
  from: string;
  to: string;
  kind: ThreadKind;
}

export interface LoomBoard {
  shards: LoomShard[];
  threads: LoomThread[];
}

// ---------- Inkverse Phases 4-5: Lantern Press, Debut Shelf, Hearth ----------

/** How the Hearth reads a published book aloud: a narrator voice plus one per Soul. */
export interface HearthVoice {
  voiceName: string | null;
  pitch: number;
  rate: number;
}

export interface HearthCasting {
  narrator: HearthVoice;
  souls: Record<string, HearthVoice>;
}

export interface PressContract {
  sagaId: string;
  title: string;
  logline: string | null;
  genre: string | null;
  slug: string | null;
  tagline: string | null;
  blurb: string | null;
  coverStyle: number;
  publishedAt: string | null;
  hearth: HearthCasting | null;
  chapters: Array<{ id: string; title: string; status: FolioStatus; wordCount: number }>;
  souls: Array<{ id: string; name: string; role: SoulRole }>;
}

export interface ShelfBookContract {
  slug: string;
  title: string;
  tagline: string | null;
  blurb: string | null;
  genre: string | null;
  coverStyle: number;
  author: { quillName: string; displayName: string };
  chapterCount: number;
  wordCount: number;
  publishedAt: string;
}

export interface ShelfBookDetailContract extends ShelfBookContract {
  logline: string | null;
  chapters: Array<{ id: string; title: string; content: string; wordCount: number }>;
  souls: Array<{ id: string; name: string; aliases: string[]; role: SoulRole; summary: string | null }>;
  hearth: HearthCasting | null;
}

// ---------- Inkverse Phases 6-7: The Campfire, Ink Ranks ----------

export type CampfireKind = "spark" | "duel" | "tale" | "prompt";

export interface CampfireAuthor {
  id: string;
  name: string;
  quillName: string | null;
}

export interface CampfirePostContract {
  id: string;
  kind: CampfireKind;
  title: string;
  body: string;
  sideA: string | null;
  sideB: string | null;
  tags: string[];
  tavern: string;
  pinned: boolean;
  adoptedCount: number;
  author: CampfireAuthor;
  embers: number;
  replyCount: number;
  votesA: number;
  votesB: number;
  /** The viewer's own Ember and Duel vote, when signed in. */
  mine: { ember: boolean; vote: "a" | "b" | null; isAuthor: boolean };
  createdAt: string;
}

export interface CampfireReplyContract {
  id: string;
  body: string;
  side: "a" | "b" | null;
  author: CampfireAuthor;
  embers: number;
  mine: { ember: boolean; isAuthor: boolean };
  createdAt: string;
}

export interface CampfireThreadContract extends CampfirePostContract {
  replies: CampfireReplyContract[];
}

export interface InkBadge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
}

export interface InkRankContract {
  rank: string;
  nextRank: string | null;
  points: number;
  nextAt: number | null;
  streakDays: number;
  longestStreak: number;
  stats: { words: number; sagas: number; published: number; souls: number; sparks: number; embersReceived: number };
  badges: InkBadge[];
}

export interface CreatorPageContract {
  quillName: string;
  displayName: string;
  bio: string | null;
  genres: string[];
  ranks: InkRankContract;
  books: ShelfBookContract[];
  posts: CampfirePostContract[];
}
