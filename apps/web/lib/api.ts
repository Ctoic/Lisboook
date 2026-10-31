// Server components only: reads API_BASE_URL, which is not exposed to the browser.
import type {
  AudiobookDetailContract,
  AudiobookListItemContract,
  FaqContract,
  PageContract,
  PaginatedResponse
} from "@lisbook/types";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:3002/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export type Loaded<T> = { data: T; error: null } | { data: null; error: string };

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 30 } });
  } catch {
    throw new ApiError("The Lisbook library is unreachable right now.", 503);
  }

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed`, response.status);
  }

  return (await response.json()) as T;
}

async function load<T>(fn: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { data: await fn(), error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Something went wrong."
    };
  }
}

// The public list endpoint does not filter drafts yet, so the storefront does.
function isListed(book: AudiobookListItemContract) {
  return book.status === "published" && book.visibility === "public";
}

export function getCatalog() {
  return load(async () => {
    const response = await request<PaginatedResponse<AudiobookListItemContract>>(
      "/audiobooks?page=1&pageSize=100"
    );
    return response.data.filter(isListed);
  });
}

export async function getAudiobook(slug: string): Promise<Loaded<AudiobookDetailContract | null>> {
  return load(async () => {
    try {
      const book = await request<AudiobookDetailContract>(`/audiobooks/${encodeURIComponent(slug)}`);
      return book.status === "published" && book.visibility !== "private" ? book : null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  });
}

export function getFaqs() {
  return load(async () => {
    const faqs = await request<FaqContract[]>("/faqs");
    return faqs.filter((faq) => faq.status === "published");
  });
}

export async function getPage(slug: string): Promise<PageContract | null> {
  try {
    const page = await request<PageContract>(`/pages/${encodeURIComponent(slug)}`);
    return page.status === "published" ? page : null;
  } catch {
    return null;
  }
}
