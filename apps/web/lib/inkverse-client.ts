"use client";

import { useMemo } from "react";
import type {
  CampfireKind,
  CampfirePostContract,
  CampfireThreadContract,
  CreatorPageContract,
  HearthCasting,
  InkRankContract,
  LoomBoard,
  PressContract,
  ShelfBookContract,
  ShelfBookDetailContract,
  AtlasEntryContract,
  AtlasFields,
  AtlasKind,
  BondKind,
  CreatorProfileContract,
  FolioContract,
  FolioSnapshotContract,
  FolioStatus,
  MuseMode,
  SagaDetailContract,
  SagaForm,
  SagaSummaryContract,
  SagaWorldContract,
  SoulBondContract,
  SoulContract,
  SoulFields,
  SoulRole
} from "@lisbook/types";
import { useAuth } from "@/providers/auth-provider";
import { streamChat, type AssistantRole } from "./assistant-client";

// Proxied to the Nest API by the rewrite in next.config.ts.
const BASE = "/api/v1/inkverse";

export class InkverseError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export interface ProfileInput {
  quillName: string;
  bio?: string;
  genres: string[];
  goal?: string;
}

export interface SagaInput {
  title?: string;
  logline?: string;
  genre?: string;
  form?: SagaForm;
}

export interface FolioInput {
  title?: string;
  status?: FolioStatus;
  content?: string;
}

export interface MuseRequest {
  sagaId: string;
  folioId?: string;
  mode: MuseMode;
  passage?: string;
  messages: Array<{ role: AssistantRole; content: string }>;
}

type Call = <T>(method: string, path: string, body?: unknown) => Promise<T>;

async function request<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new InkverseError("We couldn't reach the Inkverse. Check your connection and try again.", 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message ?? payload?.message;
    throw new InkverseError(Array.isArray(message) ? message[0] : message || "Something went wrong. Please try again.", response.status);
  }
  return payload as T;
}

function client(token: string, onUnauthorized: () => void) {
  const call: Call = <T,>(method: string, path: string, body?: unknown) =>
    request<T>(token, method, path, body).catch((error: unknown) => {
      if (error instanceof InkverseError && error.status === 401) onUnauthorized();
      throw error;
    });

  return {
    profile: () => call<{ profile: CreatorProfileContract | null }>("GET", "/me").then((r) => r.profile),
    saveProfile: (input: ProfileInput) =>
      call<{ profile: CreatorProfileContract }>("PUT", "/me", input).then((r) => r.profile),

    sagas: () => call<SagaSummaryContract[]>("GET", "/sagas"),
    saga: (id: string) => call<SagaDetailContract>("GET", `/sagas/${id}`),
    createSaga: (input: SagaInput) => call<SagaDetailContract>("POST", "/sagas", input),
    updateSaga: (id: string, input: SagaInput) => call<SagaDetailContract>("PATCH", `/sagas/${id}`, input),
    deleteSaga: (id: string) => call<{ ok: true }>("DELETE", `/sagas/${id}`),

    createFolio: (sagaId: string, title?: string) => call<FolioContract>("POST", `/sagas/${sagaId}/folios`, { title }),
    reorderFolios: (sagaId: string, folioIds: string[]) =>
      call<SagaDetailContract>("PUT", `/sagas/${sagaId}/folios/order`, { folioIds }),
    folio: (id: string) => call<FolioContract>("GET", `/folios/${id}`),
    updateFolio: (id: string, input: FolioInput) => call<FolioContract>("PATCH", `/folios/${id}`, input),
    deleteFolio: (id: string) => call<{ ok: true }>("DELETE", `/folios/${id}`),

    snapshots: (folioId: string) => call<FolioSnapshotContract[]>("GET", `/folios/${folioId}/snapshots`),
    createSnapshot: (folioId: string, label?: string) =>
      call<FolioSnapshotContract[]>("POST", `/folios/${folioId}/snapshots`, { label }),
    restoreSnapshot: (folioId: string, snapshotId: string) =>
      call<FolioContract>("POST", `/folios/${folioId}/snapshots/${snapshotId}/restore`),

    muse: (request: MuseRequest, onToken: (text: string) => void, signal: AbortSignal) =>
      streamChat(`${BASE}/muse`, request, onToken, signal, { Authorization: `Bearer ${token}` }),

    world: (sagaId: string) => call<SagaWorldContract>("GET", `/sagas/${sagaId}/world`),
    forgeSoul: (sagaId: string, prompt: string) => call<SoulFields>("POST", `/sagas/${sagaId}/forge`, { target: "soul", prompt }),
    forgeAtlas: (sagaId: string, kind: AtlasKind, prompt: string) =>
      call<Omit<AtlasFields, "parentId" | "chronoOrder">>("POST", `/sagas/${sagaId}/forge`, { target: "atlas", kind, prompt }),

    soul: (id: string) => call<SoulContract>("GET", `/souls/${id}`),
    createSoul: (sagaId: string, input: Partial<SoulFields>) => call<SoulContract>("POST", `/sagas/${sagaId}/souls`, input),
    updateSoul: (id: string, input: Partial<SoulFields>) => call<SoulContract>("PATCH", `/souls/${id}`, input),
    deleteSoul: (id: string) => call<{ ok: true }>("DELETE", `/souls/${id}`),
    interview: (soulId: string, messages: MuseRequest["messages"], onToken: (text: string) => void, signal: AbortSignal) =>
      streamChat(`${BASE}/souls/${soulId}/interview`, { messages }, onToken, signal, { Authorization: `Bearer ${token}` }),

    saveBond: (sagaId: string, input: { fromSoulId: string; toSoulId: string; kind: BondKind; note?: string }) =>
      call<SoulBondContract>("PUT", `/sagas/${sagaId}/bonds`, input),
    deleteBond: (id: string) => call<{ ok: true }>("DELETE", `/bonds/${id}`),

    createAtlas: (sagaId: string, input: Partial<AtlasFields>) => call<AtlasEntryContract>("POST", `/sagas/${sagaId}/atlas`, input),
    updateAtlas: (id: string, input: Partial<AtlasFields>) => call<AtlasEntryContract>("PATCH", `/atlas/${id}`, input),
    deleteAtlas: (id: string) => call<{ ok: true }>("DELETE", `/atlas/${id}`),

    loom: (sagaId: string) => call<LoomBoard>("GET", `/sagas/${sagaId}/loom`),
    saveLoom: (sagaId: string, board: LoomBoard) => call<LoomBoard>("PUT", `/sagas/${sagaId}/loom`, board),
    weave: (sagaId: string, prompt?: string) => call<LoomBoard>("POST", `/sagas/${sagaId}/loom/weave`, { prompt }),

    press: (sagaId: string) => call<PressContract>("GET", `/sagas/${sagaId}/press`),
    savePress: (sagaId: string, input: { tagline?: string; blurb?: string; coverStyle?: number; hearth?: HearthCasting }) =>
      call<PressContract>("PUT", `/sagas/${sagaId}/press`, input),
    draftBlurb: (sagaId: string) => call<{ tagline: string; blurb: string }>("POST", `/sagas/${sagaId}/press/blurb`),
    publish: (sagaId: string) => call<PressContract>("POST", `/sagas/${sagaId}/press/publish`),
    unpublish: (sagaId: string) => call<PressContract>("POST", `/sagas/${sagaId}/press/unpublish`),

    ranks: () => call<InkRankContract>("GET", "/me/ranks")
  };
}

export type InkverseClient = ReturnType<typeof client>;

/** The Inkverse API bound to the signed-in writer, or null while signed out. */
export function useInkverse(): InkverseClient | null {
  const { session, signOut, openSignIn } = useAuth();
  const token = session?.accessToken;
  return useMemo(
    () =>
      token
        ? client(token, () => {
            // The token expired or predates signed sessions: start a fresh sign-in.
            signOut();
            openSignIn("Your session has expired. Sign in again to keep writing.");
          })
        : null,
    [token, signOut, openSignIn]
  );
}

export const sagaForms: { value: SagaForm; label: string }[] = [
  { value: "novel", label: "Novel" },
  { value: "novella", label: "Novella" },
  { value: "short_story", label: "Short story" },
  { value: "serial", label: "Serial" }
];

export const folioStatuses: { value: FolioStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "revising", label: "Revising" },
  { value: "done", label: "Done" }
];

export const creatorGenres = [
  "Fantasy",
  "Sci-Fi",
  "Mystery",
  "Thriller",
  "Romance",
  "Horror",
  "Historical",
  "Literary",
  "Adventure",
  "Young Adult",
  "Poetry",
  "Non-fiction"
];

export const creatorGoals = [
  { value: "finish_novel", label: "Finish a novel", hint: "Long-form, chapter by chapter" },
  { value: "short_fiction", label: "Write short fiction", hint: "Stories you can finish this week" },
  { value: "worldbuild", label: "Build a world", hint: "Lore, places and people first" },
  { value: "play", label: "Just play", hint: "Explore ideas with no pressure" }
];

export function formatWords(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? "word" : "words"}`;
}

export const soulRoles: { value: SoulRole; label: string }[] = [
  { value: "protagonist", label: "Protagonist" },
  { value: "antagonist", label: "Antagonist" },
  { value: "supporting", label: "Supporting" },
  { value: "mentor", label: "Mentor" },
  { value: "love_interest", label: "Love interest" },
  { value: "minor", label: "Minor" }
];

export const bondKinds: { value: BondKind; label: string }[] = [
  { value: "family", label: "Family" },
  { value: "friend", label: "Friend" },
  { value: "ally", label: "Ally" },
  { value: "rival", label: "Rival" },
  { value: "enemy", label: "Enemy" },
  { value: "lover", label: "Lover" },
  { value: "mentor", label: "Mentor" },
  { value: "other", label: "Other" }
];

export const atlasKinds: { value: AtlasKind; label: string; plural: string; hint: string }[] = [
  { value: "place", label: "Place", plural: "Places", hint: "Realms, cities, ruins, a single haunted room" },
  { value: "lore", label: "Lore", plural: "Lore", hint: "Magic systems, beliefs, laws and technology" },
  { value: "faction", label: "Faction", plural: "Factions", hint: "Guilds, houses, cults, crews and armies" },
  { value: "event", label: "Event", plural: "Events", hint: "Wars, births, betrayals: the world's history" }
];

export const emptySoul: SoulFields = {
  name: "",
  aliases: [],
  role: "supporting",
  summary: null,
  appearance: null,
  personality: null,
  desires: null,
  fears: null,
  secrets: null,
  voice: null,
  arcStart: null,
  arcEnd: null
};

/* ---------- Public: Debut Shelf, Campfire, creator pages (work signed out; send the token when there is one) ---------- */

async function publicCall<T>(method: string, path: string, token?: string | null, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new InkverseError("We couldn't reach Lisbook. Check your connection and try again.", 0);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message ?? payload?.message;
    throw new InkverseError(Array.isArray(message) ? message[0] : message || "Something went wrong. Please try again.", response.status);
  }
  return payload as T;
}

export interface NewPostInput {
  kind: CampfireKind;
  title: string;
  body: string;
  sideA?: string;
  sideB?: string;
  tags?: string[];
  tavern?: string;
}

export const publicApi = {
  shelf: () => publicCall<ShelfBookContract[]>("GET", "/library"),
  book: (slug: string) => publicCall<ShelfBookDetailContract>("GET", `/library/${encodeURIComponent(slug)}`),
  creator: (quillName: string, token?: string | null) => publicCall<CreatorPageContract>("GET", `/creators/${encodeURIComponent(quillName)}`, token),
  posts: (query: { kind?: string; tavern?: string; sort?: string }, token?: string | null) => {
    const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v) as [string, string][]);
    return publicCall<CampfirePostContract[]>("GET", `/campfire/posts?${params}`, token);
  },
  thread: (id: string, token?: string | null) => publicCall<CampfireThreadContract>("GET", `/campfire/posts/${id}`, token),
  createPost: (token: string, input: NewPostInput) => publicCall<CampfireThreadContract>("POST", "/campfire/posts", token, input),
  reply: (token: string, id: string, body: string, side?: "a" | "b") => publicCall<CampfireThreadContract>("POST", `/campfire/posts/${id}/replies`, token, { body, side }),
  react: (token: string, id: string, kind: "ember" | "vote_a" | "vote_b") => publicCall<CampfireThreadContract>("POST", `/campfire/posts/${id}/react`, token, { kind }),
  reactReply: (token: string, replyId: string) => publicCall<CampfireThreadContract>("POST", `/campfire/replies/${replyId}/react`, token),
  adopt: (token: string, id: string) => publicCall<{ sagaId: string; folioId: string }>("POST", `/campfire/posts/${id}/adopt`, token),
  removePost: (token: string, id: string) => publicCall<{ ok: true }>("DELETE", `/campfire/posts/${id}`, token)
};

export const taverns = [
  { value: "general", label: "The Common Room" },
  { value: "fantasy", label: "Fantasy" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "horror", label: "Horror" },
  { value: "romance", label: "Romance" },
  { value: "mystery", label: "Mystery" },
  { value: "worldbuilding", label: "Worldbuilding" },
  { value: "craft", label: "Craft" }
];
