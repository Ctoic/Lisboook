export type AssistantRole = "user" | "assistant";
export type AssistantMode = "text" | "voice";

export interface AssistantRequest {
  bookSlug?: string;
  chapterId?: string;
  positionSeconds?: number;
  mode: AssistantMode;
  messages: Array<{ role: AssistantRole; content: string }>;
}

type StreamEvent = { type: "token"; text: string } | { type: "done"; model: string } | { type: "error"; message: string };

// Streams the NDJSON answer from the Nest assistant endpoint (proxied through /api/v1).
export function streamAssistant(request: AssistantRequest, onToken: (text: string) => void, signal: AbortSignal) {
  return streamChat("/api/v1/assistant/chat", request, onToken, signal);
}

// Shared NDJSON reader for every Lis endpoint (listening companion and the Inkverse Muse).
export async function streamChat(
  url: string,
  body: unknown,
  onToken: (text: string) => void,
  signal: AbortSignal,
  headers: Record<string, string> = {}
) {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error("Couldn't reach the assistant. Check your connection.");
  }

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "The assistant is unavailable right now.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      const event = JSON.parse(line) as StreamEvent;
      if (event.type === "token") onToken(event.text);
      if (event.type === "error") throw new Error(event.message);
    }
  }
}
