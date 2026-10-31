"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ChapterContract } from "@lisbook/types";
import { AssistantLauncher } from "@/components/assistant/assistant-launcher";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { streamAssistant, type AssistantMode, type AssistantRole } from "@/lib/assistant-client";
import { StreamingSpeaker, toSpeakable } from "@/lib/speech";
import type { BookSnapshot } from "./library-provider";
import { usePlayer } from "./player-provider";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  mode: AssistantMode;
  status: "streaming" | "done" | "error";
}

export interface AssistantContext {
  book: BookSnapshot | null;
  chapter: Pick<ChapterContract, "id" | "title" | "chapterNumber"> | null;
  positionSeconds: number | null;
  /** True when the context comes from what is playing right now. */
  live: boolean;
}

interface AssistantContextValue {
  open: boolean;
  context: AssistantContext;
  messages: AssistantMessage[];
  busy: boolean;
  speakingId: string | null;
  pausedBook: boolean;
  openAssistant: (book?: BookSnapshot) => void;
  closeAssistant: () => void;
  ask: (question: string, mode: AssistantMode) => void;
  stop: () => void;
  speak: (message: AssistantMessage) => void;
  stopSpeaking: () => void;
  resumeBook: () => void;
  clear: () => void;
}

const Ctx = createContext<AssistantContextValue | null>(null);
const GENERAL = "__general__";

let idCounter = 0;
const nextId = () => `m${Date.now().toString(36)}${idCounter++}`;

export function AssistantProvider({ children }: { children: ReactNode }) {
  const player = usePlayer();
  const [open, setOpen] = useState(false);
  const [pinnedBook, setPinnedBook] = useState<BookSnapshot | null>(null);
  const [threads, setThreads] = useState<Record<string, AssistantMessage[]>>({});
  const [busy, setBusy] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [pausedBook, setPausedBook] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const speakerRef = useRef<StreamingSpeaker | null>(null);

  // What's playing wins; otherwise the book the panel was opened from.
  const context = useMemo<AssistantContext>(() => {
    const playingBook = player.current?.book ?? null;
    if (playingBook && (!pinnedBook || pinnedBook.id === playingBook.id)) {
      return {
        book: playingBook,
        chapter: player.chapter ? { id: player.chapter.id, title: player.chapter.title, chapterNumber: player.chapter.chapterNumber } : null,
        positionSeconds: player.position,
        live: true
      };
    }
    return { book: pinnedBook, chapter: null, positionSeconds: null, live: false };
  }, [pinnedBook, player.chapter, player.current?.book, player.position]);

  const threadKey = context.book?.slug ?? GENERAL;
  const messages = threads[threadKey] ?? [];

  const update = useCallback((key: string, id: string, patch: (m: AssistantMessage) => Partial<AssistantMessage>) => {
    setThreads((all) => ({
      ...all,
      [key]: (all[key] ?? []).map((m) => (m.id === id ? { ...m, ...patch(m) } : m))
    }));
  }, []);

  const stopSpeaking = useCallback(() => {
    speakerRef.current?.cancel();
    speakerRef.current = null;
    setSpeakingId(null);
  }, []);

  const resumeBook = useCallback(() => {
    setPausedBook(false);
    player.resume();
  }, [player]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopSpeaking();
    setBusy(false);
  }, [stopSpeaking]);

  const ask = useCallback(
    (question: string, mode: AssistantMode) => {
      const text = question.trim();
      if (!text) return;
      stop();

      // Pause the story so the answer doesn't talk over it.
      if (player.isPlaying) {
        player.pause();
        setPausedBook(true);
      }

      const key = threadKey;
      const history = (threads[key] ?? []).filter((m) => m.status === "done");
      const user: AssistantMessage = { id: nextId(), role: "user", content: text, mode, status: "done" };
      const reply: AssistantMessage = { id: nextId(), role: "assistant", content: "", mode, status: "streaming" };
      setThreads((all) => ({ ...all, [key]: [...(all[key] ?? []), user, reply] }));
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const wasPlaying = player.isPlaying || pausedBook;

      let speaker: StreamingSpeaker | null = null;
      if (mode === "voice" && StreamingSpeaker.supported) {
        speaker = new StreamingSpeaker(() => {
          setSpeakingId(null);
          speakerRef.current = null;
          // Voice conversations flow straight back into the book.
          if (wasPlaying) {
            setPausedBook(false);
            player.resume();
          }
        });
        speakerRef.current = speaker;
        setSpeakingId(reply.id);
      }

      streamAssistant(
        {
          bookSlug: context.book?.slug,
          chapterId: context.chapter?.id,
          positionSeconds: context.positionSeconds ?? undefined,
          mode,
          messages: [...history.map(({ role, content }) => ({ role, content })), { role: "user", content: text }]
        },
        (token) => {
          update(key, reply.id, (m) => ({ content: m.content + token }));
          speaker?.feed(token);
        },
        controller.signal
      )
        .then(() => {
          update(key, reply.id, () => ({ status: "done" }));
          speaker?.finish();
        })
        .catch((error: Error) => {
          if (controller.signal.aborted) {
            update(key, reply.id, (m) => ({ status: m.content ? "done" : "error", content: m.content || "Stopped." }));
            return;
          }
          speaker?.cancel();
          setSpeakingId(null);
          update(key, reply.id, () => ({ status: "error", content: error.message }));
        })
        .finally(() => {
          if (abortRef.current === controller) abortRef.current = null;
          setBusy(false);
        });
    },
    [context, pausedBook, player, stop, threadKey, threads, update]
  );

  const speak = useCallback(
    (message: AssistantMessage) => {
      stopSpeaking();
      if (!StreamingSpeaker.supported) return;
      const speaker = new StreamingSpeaker(() => {
        setSpeakingId(null);
        speakerRef.current = null;
      });
      speakerRef.current = speaker;
      setSpeakingId(message.id);
      speaker.feed(toSpeakable(message.content));
      speaker.finish();
    },
    [stopSpeaking]
  );

  const openAssistant = useCallback((book?: BookSnapshot) => {
    setPinnedBook(book ?? null);
    setOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setOpen(false);
    stop();
  }, [stop]);

  const clear = useCallback(() => {
    stop();
    setThreads((all) => ({ ...all, [threadKey]: [] }));
  }, [stop, threadKey]);

  // If the listener presses play themselves, we're no longer holding the book.
  useEffect(() => {
    if (player.isPlaying) setPausedBook(false);
  }, [player.isPlaying]);

  const value = useMemo(
    () => ({ open, context, messages, busy, speakingId, pausedBook, openAssistant, closeAssistant, ask, stop, speak, stopSpeaking, resumeBook, clear }),
    [open, context, messages, busy, speakingId, pausedBook, openAssistant, closeAssistant, ask, stop, speak, stopSpeaking, resumeBook, clear]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <AssistantLauncher />
      <AssistantPanel />
    </Ctx.Provider>
  );
}

export function useAssistant() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useAssistant must be used inside AssistantProvider");
  return value;
}
