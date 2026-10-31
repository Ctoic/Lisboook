import type { LoginResponseContract, NewsletterSubscribeResponseContract } from "@lisbook/types";

// Proxied to the Nest API by the rewrite in next.config.ts.
const BASE = "/api/v1";

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error("We couldn't reach Lisbook. Check your connection and try again.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message ?? payload?.message;
    throw new Error(
      Array.isArray(message) ? message[0] : message || "Something went wrong. Please try again."
    );
  }

  return payload as T;
}

export function login(email: string, password: string) {
  return post<LoginResponseContract>("/auth/login", { email, password });
}

export function register(displayName: string, email: string, password: string) {
  return post<LoginResponseContract>("/auth/register", { displayName, email, password });
}

export function subscribeToNewsletter(email: string, source: string) {
  return post<NewsletterSubscribeResponseContract>("/newsletter", { email, source });
}
