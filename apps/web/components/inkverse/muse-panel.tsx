"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { MuseMode } from "@lisbook/types";
import { Markdown } from "@/components/assistant/assistant-panel";
import { Mascot } from "@/components/assistant/mascot";
import { Button } from "@/components/ui/button";
import { CheckIcon, CloseIcon, CopyIcon, PlusIcon, QuillIcon, RefreshIcon, SendIcon, SparkleIcon, StopIcon } from "@/components/ui/icons";
import type { InkverseClient } from "@/lib/inkverse-client";
import { useToast } from "@/providers/toast-provider";

/** Where the writer's cursor and selection were when they asked, so a suggestion lands where it was meant to. */
export interface EditorContext {
  before: string;
  cursor: number;
  selection: { start: number; end: number; text: string };
  /** The whole chapter, for Echo. */
  full: string;
}

/** A live insertion into the manuscript while Lis writes. */
export interface LiveWrite {
  append: (text: string) => void;
  /** Settles the final prose and returns how many words were written. */
  finish: () => number;
  /** Takes the written words back out; false if the writer has since changed them. */
  undo: () => boolean;
}

/** A Write request queued by the editor, e.g. after creating a chapter from a Spark idea. */
export interface QueuedWrite {
  key: string;
  prompt: string;
}

interface MuseMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "streaming" | "done" | "error";
  context?: EditorContext;
  applied?: boolean;
  words?: number;
  chapter?: string;
  undone?: boolean;
}

interface Idea {
  name: string;
  body: string;
}

const modes: { id: MuseMode; label: string; blurb: string; fallback: string; prompts: string[] }[] = [
  {
    id: "write",
    label: "Write",
    blurb: "Describe the scene and Lis writes it straight into your chapter.",
    fallback: "Write the next scene.",
    prompts: ["Write the opening scene", "Write the next scene", "Write a tense dialogue scene", "Write a full chapter from my logline"]
  },
  {
    id: "spark",
    label: "Spark",
    blurb: "Brainstorm ideas, then turn any of them into a chapter.",
    fallback: "What could happen next?",
    prompts: ["What could happen next?", "Give me a twist I won't see coming", "Ideas for the next three chapters", "Name ideas for my main character"]
  },
  {
    id: "polish",
    label: "Polish",
    blurb: "Select a passage and Lis refines its clarity and rhythm.",
    fallback: "Polish this passage.",
    prompts: ["Polish this passage", "Make it more vivid", "Tighten the prose", "Explain what you'd change and why"]
  },
  {
    id: "echo",
    label: "Echo",
    blurb: "Lis checks the chapter against your Souls and Atlas for continuity slips.",
    fallback: "Check this chapter for continuity slips.",
    prompts: ["Check this chapter for continuity slips", "Does everyone sound like themselves?", "Does this break any rule of my world?"]
  }
];

let counter = 0;
const nextId = () => `muse${Date.now().toString(36)}${counter++}`;

// Small models sometimes wrap prose in the quote fences we used in the prompt.
export function cleanProse(text: string) {
  return text
    .trim()
    .replace(/^"""\s*|\s*"""$/g, "")
    .replace(/^"([\s\S]*)"$/, "$1")
    .trim();
}

/**
 * Pulls the bullet ideas out of a Spark answer. The model writes either "- **Name:** what it is" on one line,
 * or the name on the bullet and the description on the lines below it.
 */
function parseIdeas(text: string): Idea[] {
  const items: string[] = [];
  for (const raw of text.split("\n")) {
    const bullet = raw.trim().match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bullet) {
      items.push(bullet[1]);
    } else if (items.length && raw.trim()) {
      // Indented lines belong to the bullet; so does the first paragraph under a bare name,
      // but not a closing line ("Which path beckons?") after an idea that already has a description.
      const last = items[items.length - 1];
      const bareName = /^\*\*[^*]+\*\*[:.]?$/.test(last.trim());
      if (/^\s{2,}/.test(raw) || bareName) items[items.length - 1] = `${last} ${raw.trim()}`;
    }
  }
  return items
    .map((item) => {
      const named = item.match(/^\*\*(.+?)\*\*\s*[:.\-–—]?\s*(.*)$/);
      const name = (named ? named[1] : item.split(/[.:]/)[0]).replace(/[:.]$/, "").trim();
      return { name: name.slice(0, 80), body: (named ? named[2] : item).replace(/\*\*/g, "").trim() };
    })
    .filter((idea) => idea.name);
}

interface MusePanelProps {
  api: InkverseClient;
  sagaId: string;
  folioId: string;
  chapterTitle: string;
  selectionWords: number;
  queuedWrite: QueuedWrite | null;
  onQueuedWriteTaken: () => void;
  getContext: () => EditorContext;
  startWrite: (context: EditorContext) => LiveWrite;
  onReplace: (text: string, context: EditorContext) => boolean;
  onNewChapter: (title: string, prompt: string) => void;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
}

/** Lis the Muse: writes into the chapter on request, and everything it writes can be undone. */
export function MusePanel({
  api,
  sagaId,
  folioId,
  chapterTitle,
  selectionWords,
  queuedWrite,
  onQueuedWriteTaken,
  getContext,
  startWrite,
  onReplace,
  onNewChapter,
  onBusyChange,
  onClose
}: MusePanelProps) {
  const toast = useToast();
  const [mode, setMode] = useState<MuseMode>("write");
  const [threads, setThreads] = useState<Record<MuseMode, MuseMessage[]>>({ write: [], spark: [], polish: [], echo: [] });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const writesRef = useRef(new Map<string, LiveWrite>());
  const bodyRef = useRef<HTMLDivElement>(null);
  const current = modes.find((m) => m.id === mode)!;
  const thread = threads[mode];

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [thread]);

  // A chapter made from a Spark idea arrives here once it is open, ready to be written.
  useEffect(() => {
    if (!queuedWrite || busy) return;
    onQueuedWriteTaken();
    setMode("write");
    void ask(queuedWrite.prompt, "write");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedWrite]);

  function patch(target: MuseMode, id: string, change: Partial<MuseMessage>) {
    setThreads((all) => ({ ...all, [target]: all[target].map((m) => (m.id === id ? { ...m, ...change } : m)) }));
  }

  async function ask(question: string, target: MuseMode = mode) {
    if (busy) return;
    const config = modes.find((m) => m.id === target)!;
    const text = question.trim() || config.fallback;
    const targetThread = threads[target];
    let context = getContext();
    if (target === "polish" && !context.selection.text.trim()) {
      // A follow-up ("make it shorter") keeps working on the passage the thread started with.
      const earlier = [...targetThread].reverse().find((m) => m.context?.selection.text.trim())?.context;
      if (!earlier) {
        toast({ title: "Select a passage first", description: "Highlight the lines you want Lis to polish.", tone: "info" });
        return;
      }
      context = earlier;
    }

    const user: MuseMessage = { id: nextId(), role: "user", content: text, status: "done" };
    const reply: MuseMessage = { id: nextId(), role: "assistant", content: "", status: "streaming", context, chapter: chapterTitle, words: 0 };
    const history = targetThread.filter((m) => m.status === "done").map((m) => ({ role: m.role, content: m.content }));
    setThreads((all) => ({ ...all, [target]: [...all[target], user, reply] }));
    setInput("");
    setBusy(true);

    const live = target === "write" ? startWrite(context) : null;
    if (live) writesRef.current.set(reply.id, live);
    const controller = new AbortController();
    abortRef.current = controller;
    let answer = "";
    const settle = () => (live ? { words: live.finish() } : {});
    try {
      await api.muse(
        {
          sagaId,
          folioId,
          mode: target,
          // Echo checks the selection if there is one, otherwise the whole chapter.
          passage: target === "polish" ? context.selection.text : target === "echo" ? context.selection.text.trim() || context.full : context.before,
          messages: [...history, { role: "user", content: text }]
        },
        (token) => {
          answer += token;
          live?.append(token);
          patch(target, reply.id, { content: answer, words: answer.trim() ? answer.trim().split(/\s+/).length : 0 });
        },
        controller.signal
      );
      patch(target, reply.id, { status: "done", content: answer.trim() || "Lis came up empty that time. Try asking another way.", ...settle() });
    } catch (error) {
      const result = settle();
      if (controller.signal.aborted) {
        patch(target, reply.id, { status: answer ? "done" : "error", content: answer || "Stopped.", ...result });
      } else {
        patch(target, reply.id, { status: "error", content: (error as Error).message, ...result });
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    void ask(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Couldn't copy", tone: "error" });
    }
  }

  function undoWrite(message: MuseMessage) {
    const live = writesRef.current.get(message.id);
    if (live?.undo()) {
      patch("write", message.id, { undone: true });
      writesRef.current.delete(message.id);
    } else {
      toast({ title: "Can't undo that one", description: "The words were edited since Lis wrote them, or you're in a different chapter.", tone: "info" });
    }
  }

  function writeIdea(idea: Idea) {
    setMode("write");
    void ask(`Write this into the chapter, based on the idea "${idea.name}": ${idea.body}`, "write");
  }

  function replacePolish(message: MuseMessage) {
    if (message.context && onReplace(cleanProse(message.content), message.context)) patch("polish", message.id, { applied: true });
  }

  function renderReply(message: MuseMessage) {
    if (message.status === "streaming" && !message.content) {
      return (
        <span className="typing" aria-label="Lis is writing">
          <span />
          <span />
          <span />
        </span>
      );
    }
    if (message.status === "error") return <Markdown text={message.content} />;

    if (mode === "write") {
      return (
        <>
          <p className="muse__wrote">
            <QuillIcon size={15} />
            {message.status === "streaming"
              ? `Writing into "${message.chapter}"… ${message.words} words`
              : message.undone
                ? `Took ${message.words} words back out of "${message.chapter}".`
                : `Wrote ${message.words} words into "${message.chapter}".`}
          </p>
          {message.status === "done" && !message.undone ? (
            <div className="chat-actions">
              <Button variant="ghost" size="sm" onClick={() => undoWrite(message)}>
                <RefreshIcon size={14} /> Undo
              </Button>
              <Button variant="ghost" size="sm" onClick={() => ask("Keep going from where you stopped.", "write")} disabled={busy}>
                <SendIcon size={14} /> Keep going
              </Button>
            </div>
          ) : null}
        </>
      );
    }

    if (mode === "echo") {
      return (
        <>
          <Markdown text={message.content} />
          {message.status === "done" ? (
            <div className="chat-actions">
              <Button variant="ghost" size="sm" onClick={() => copy(message.content)}>
                <CopyIcon size={14} /> Copy
              </Button>
            </div>
          ) : null}
        </>
      );
    }

    if (mode === "spark") {
      const ideas = message.status === "done" ? parseIdeas(message.content) : [];
      return (
        <>
          <Markdown text={message.content} />
          {ideas.length ? (
            <div className="muse__ideas">
              <p className="muse__ideas-title">Use an idea</p>
              {ideas.map((idea, i) => (
                <div key={i} className="muse__idea">
                  <span className="muse__idea-name">{idea.name}</span>
                  <span className="muse__idea-actions">
                    <Button variant="glass" size="sm" onClick={() => writeIdea(idea)} disabled={busy} title={`Write "${idea.name}" into this chapter`}>
                      <QuillIcon size={14} /> Write here
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNewChapter(idea.name, `Write this chapter, based on the idea "${idea.name}": ${idea.body}`)}
                      disabled={busy}
                      title={`Add "${idea.name}" to the Saga as a new chapter`}
                    >
                      <PlusIcon size={14} /> New chapter
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {message.status === "done" ? (
            <div className="chat-actions">
              <Button variant="ghost" size="sm" onClick={() => copy(message.content)}>
                <CopyIcon size={14} /> Copy
              </Button>
            </div>
          ) : null}
        </>
      );
    }

    return (
      <>
        <div className="muse__prose">
          {cleanProse(message.content)
            .split(/\n{2,}/)
            .map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
        </div>
        {message.status === "done" ? (
          <div className="chat-actions">
            <Button variant={message.applied ? "ghost" : "primary"} size="sm" onClick={() => replacePolish(message)} disabled={message.applied}>
              {message.applied ? (
                <>
                  <CheckIcon size={14} /> Replaced
                </>
              ) : (
                <>
                  <QuillIcon size={14} /> Replace selection
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => copy(cleanProse(message.content))}>
              <CopyIcon size={14} /> Copy
            </Button>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <aside className="muse glass glass--strong" aria-label="Lis the Muse">
      <header className="muse__head">
        <span className="assistant__orb" aria-hidden>
          <Mascot mood={busy ? "thinking" : "idle"} />
        </span>
        <div style={{ minWidth: 0 }}>
          <p className="muse__title">Lis the Muse</p>
          <p className="muted muse__blurb">{current.blurb}</p>
        </div>
        <Button variant="ghost" icon size="sm" onClick={onClose} aria-label="Close the Muse" disabled={busy}>
          <CloseIcon size={18} />
        </Button>
      </header>

      <div className="segmented muse__modes" role="group" aria-label="Muse mode">
        {modes.map((m) => (
          <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)} disabled={busy}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="muse__body" ref={bodyRef} aria-live="polite">
        {!thread.length ? (
          <div className="muse__intro">
            <p className="muted">
              {mode === "polish"
                ? selectionWords
                  ? `${selectionWords} selected ${selectionWords === 1 ? "word" : "words"} ready to polish.`
                  : "Highlight a passage in your chapter, then pick a prompt."
                : mode === "echo"
                  ? selectionWords
                    ? `Lis will check the ${selectionWords} selected words against your Souls and Atlas.`
                    : "Lis reads the whole chapter and compares it with your Soul cards and Atlas: looks, names, voices, relationships and world rules."
                  : mode === "write"
                  ? "Tell Lis what happens and the words appear in your chapter at the cursor. You can undo any of it."
                  : "Ask for anything: a twist, a name, a reason, a world. Any idea can become a chapter."}
            </p>
            <div className="ink-chip-wrap">
              {current.prompts.map((prompt) => (
                <button key={prompt} type="button" className="chip" onClick={() => ask(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          thread.map((message) =>
            message.role === "user" ? (
              <p key={message.id} className="muse__ask">
                {message.content}
              </p>
            ) : (
              <article key={message.id} className={`muse__reply${message.status === "error" ? " muse__reply--error" : ""}`}>
                {renderReply(message)}
              </article>
            )
          )
        )}
      </div>

      <form className="composer muse__composer" onSubmit={submit}>
        <textarea
          className="composer__input"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={mode === "write" ? "Describe what happens next, and Lis writes it into your chapter" : `${current.label}: ${current.fallback}`}
          aria-label={`Ask Lis in ${current.label} mode`}
        />
        <div className="row" style={{ justifyContent: "space-between" }}>
          <Button variant="ghost" size="sm" onClick={() => setThreads((all) => ({ ...all, [mode]: [] }))} disabled={busy || !thread.length}>
            <RefreshIcon size={14} /> New thread
          </Button>
          {busy ? (
            <Button variant="glass" size="sm" onClick={() => abortRef.current?.abort()}>
              <StopIcon size={14} /> Stop
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="sm">
              {mode === "spark" ? <SparkleIcon size={14} /> : mode === "write" ? <QuillIcon size={14} /> : <SendIcon size={14} />}
              {mode === "write" ? "Write it" : "Ask Lis"}
            </Button>
          )}
        </div>
      </form>
    </aside>
  );
}
