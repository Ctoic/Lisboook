import type {
  AudiobookDetailContract,
  AudiobookListItemContract,
  EntityStatus,
  FaqContract,
  LoginResponseContract,
  PageContract,
  PaginatedResponse
} from "@lisbook/types";
import { API_BASE_URL } from "./config";

export interface ApiErrorShape {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
}

export interface AdminSession {
  accessToken: string;
  refreshToken: string;
  user: LoginResponseContract["user"];
}

export interface AudiobookPayload {
  title: string;
  slug: string;
  description: string;
  authorName: string;
  narratorName?: string;
  categoryName?: string;
  language?: string;
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "private" | "unlisted";
  isFeatured?: boolean;
}

export interface AdminUserContract {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

export interface AdminRoleContract {
  id: string;
  name: string;
  description?: string | null;
  permissions: Array<{
    permission: {
      id: string;
      key: string;
      description?: string | null;
    };
  }>;
}

export interface ManagedEntityContract {
  id: string;
  name: string;
  slug: string;
  status: EntityStatus;
  bio?: string | null;
  description?: string | null;
}

export interface AssetsProviderContract {
  strategy: string;
  sampleCover: string;
  sampleAudio: string;
}

export interface ImageAssetContract {
  id: string;
  storageKey: string;
  sourceUrl?: string | null;
  mimeType: string;
  fileSizeBytes?: number | null;
  checksum?: string | null;
  processingStatus: string;
  createdAt: string;
}

export interface AudioAssetContract {
  id: string;
  storageKey: string;
  sourceUrl?: string | null;
  mimeType: string;
  fileSizeBytes?: number | null;
  bitrateKbps?: number | null;
  durationSeconds: number;
  checksum?: string | null;
  processingStatus: string;
  createdAt: string;
}

export interface AssetsListContract {
  images: ImageAssetContract[];
  audio: AudioAssetContract[];
}

export interface UpdatePagePayload {
  title: string;
  content: string;
  status: EntityStatus;
}

export interface UpdateFaqPayload {
  question: string;
  answer: string;
  sortOrder: number;
  status: EntityStatus;
}

export interface ManagedEntityPayload {
  name: string;
  bio?: string;
  description?: string;
}

export interface CreateImageAssetPayload {
  storageKey: string;
  mimeType: string;
  sourceUrl?: string;
}

export interface UpdateImageAssetPayload {
  sourceUrl?: string;
}

async function parseError(response: Response) {
  let payload: ApiErrorShape | undefined;

  try {
    payload = (await response.json()) as ApiErrorShape;
  } catch {
    payload = undefined;
  }

  const message =
    payload?.error?.message ??
    payload?.message ??
    `Request failed with status ${response.status}`;

  throw new Error(message);
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(init?.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as T;
}

export async function login(email: string, password: string) {
  return request<LoginResponseContract>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function getAdminAudiobooks(token: string, page: number) {
  return request<PaginatedResponse<AudiobookListItemContract>>(
    `/admin/audiobooks?page=${page}&pageSize=8`,
    undefined,
    token
  );
}

export async function getAudiobookDetail(slug: string) {
  return request<AudiobookDetailContract>(`/audiobooks/${slug}`);
}

export async function createAdminAudiobook(token: string, payload: AudiobookPayload) {
  return request<AudiobookDetailContract>(
    "/admin/audiobooks",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminAudiobook(
  token: string,
  id: string,
  payload: Partial<AudiobookPayload>
) {
  return request<AudiobookDetailContract>(
    `/admin/audiobooks/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function getPageBySlug(slug: string) {
  return request<PageContract>(`/pages/${slug}`);
}

export async function updateAdminPage(token: string, id: string, payload: UpdatePagePayload) {
  return request<PageContract>(
    `/admin/pages/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function getFaqs() {
  return request<FaqContract[]>("/faqs");
}

export async function updateAdminFaq(token: string, id: string, payload: UpdateFaqPayload) {
  return request<FaqContract>(
    `/admin/faqs/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function getAdminUsers(token: string) {
  return request<AdminUserContract[]>("/admin/users", undefined, token);
}

export async function getAdminRoles(token: string) {
  return request<AdminRoleContract[]>("/admin/roles", undefined, token);
}

export async function getAdminAuthors(token: string) {
  return request<ManagedEntityContract[]>("/admin/authors", undefined, token);
}

export async function createAdminAuthor(token: string, payload: ManagedEntityPayload) {
  return request<ManagedEntityContract>(
    "/admin/authors",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminAuthor(token: string, id: string, payload: ManagedEntityPayload) {
  return request<ManagedEntityContract>(
    `/admin/authors/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function getAdminNarrators(token: string) {
  return request<ManagedEntityContract[]>("/admin/narrators", undefined, token);
}

export async function createAdminNarrator(token: string, payload: ManagedEntityPayload) {
  return request<ManagedEntityContract>(
    "/admin/narrators",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminNarrator(
  token: string,
  id: string,
  payload: ManagedEntityPayload
) {
  return request<ManagedEntityContract>(
    `/admin/narrators/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function getAdminCategories(token: string) {
  return request<ManagedEntityContract[]>("/admin/categories", undefined, token);
}

export async function createAdminCategory(token: string, payload: ManagedEntityPayload) {
  return request<ManagedEntityContract>(
    "/admin/categories",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminCategory(
  token: string,
  id: string,
  payload: ManagedEntityPayload
) {
  return request<ManagedEntityContract>(
    `/admin/categories/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function getAdminAssetsProvider(token: string) {
  return request<AssetsProviderContract>("/admin/assets/provider", undefined, token);
}

export async function getAdminAssets(token: string) {
  return request<AssetsListContract>("/admin/assets", undefined, token);
}

export async function createAdminImageAsset(token: string, payload: CreateImageAssetPayload) {
  return request<ImageAssetContract>(
    "/admin/assets/images",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function updateAdminImageAsset(
  token: string,
  id: string,
  payload: UpdateImageAssetPayload
) {
  return request<ImageAssetContract>(
    `/admin/assets/images/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    },
    token
  );
}
