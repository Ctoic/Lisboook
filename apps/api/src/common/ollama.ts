import { BadGatewayException, ServiceUnavailableException, type Logger } from "@nestjs/common";
import type { Response } from "express";

export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
export const ASSISTANT_MODEL = process.env.ASSISTANT_MODEL ?? "gemma4:e4b-it-qat";
// Keep the model resident between questions so listeners never wait for a cold load.
export const KEEP_ALIVE = process.env.ASSISTANT_KEEP_ALIVE ?? "30m";

export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Keeps the last `maxTurns` well-formed messages; the final one must come from the user. */
export function cleanMessages(raw: unknown, maxTurns: number, maxChars: number): ChatMessage[] | null {
  const messages = Array.isArray(raw) ? raw : [];
  const clean = messages
    .filter(
      (m): m is ChatMessage =>
        (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0
    )
    .slice(-maxTurns)
    .map((m) => ({ role: m.role, content: m.content.slice(0, maxChars) }));

  return clean.length && clean[clean.length - 1].role === "user" ? clean : null;
}

interface StreamOptions {
  system: string;
  messages: ChatMessage[];
  temperature: number;
  numCtx: number;
  logger: Logger;
}

/** Streams an Ollama chat answer to the client as NDJSON token/done/error events. */
export async function streamOllamaChat(res: Response, { system, messages, temperature, numCtx, logger }: StreamOptions) {
  const controller = new AbortController();
  // Stop generating as soon as the client closes the panel or asks something new.
  res.on("close", () => controller.abort());

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: ASSISTANT_MODEL,
        stream: true,
        think: false,
        keep_alive: KEEP_ALIVE,
        options: { temperature, num_ctx: numCtx },
        messages: [{ role: "system", content: system }, ...messages]
      })
    });
  } catch {
    res.status(503).json({ error: { code: "ASSISTANT_UNAVAILABLE", message: "The assistant is offline. Is Ollama running?" } });
    return;
  }

  if (!upstream.ok || !upstream.body) {
    res.status(502).json({ error: { code: "ASSISTANT_ERROR", message: `The model could not answer (${upstream.status}).` } });
    return;
  }

  res.status(200);
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: Record<string, unknown>) => res.write(`${JSON.stringify(event)}\n`);
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        const chunk = JSON.parse(line) as { message?: { content?: string }; done?: boolean; error?: string };
        if (chunk.error) send({ type: "error", message: chunk.error });
        if (chunk.message?.content) send({ type: "token", text: chunk.message.content });
        if (chunk.done) send({ type: "done", model: ASSISTANT_MODEL });
      }
    }
  } catch (error) {
    if (!controller.signal.aborted) {
      logger.error(error);
      send({ type: "error", message: "The answer was interrupted. Please try again." });
    }
  } finally {
    res.end();
  }
}

/** One non-streamed answer constrained to a JSON schema (Ollama structured outputs). */
export async function chatJson<T>(system: string, prompt: string, schema: Record<string, unknown>, temperature = 0.7): Promise<T> {
  let response: globalThis.Response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ASSISTANT_MODEL,
        stream: false,
        think: false,
        keep_alive: KEEP_ALIVE,
        format: schema,
        options: { temperature, num_ctx: 4096 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ]
      })
    });
  } catch {
    throw new ServiceUnavailableException("The assistant is offline. Is Ollama running?");
  }
  if (!response.ok) throw new BadGatewayException(`The model could not answer (${response.status}).`);
  const payload = (await response.json()) as { message?: { content?: string } };
  try {
    return JSON.parse(payload.message?.content ?? "") as T;
  } catch {
    throw new BadGatewayException("Lis got tangled up. Please try again.");
  }
}
