"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { CloseIcon, MicIcon, PlayIcon, RefreshIcon, SendIcon, SparkleIcon, StopIcon, VolumeIcon } from "@/components/ui/icons";
import { formatClock } from "@/lib/format";
import { useSpeechRecognition } from "@/lib/speech";
import { useAssistant, type AssistantMessage } from "@/providers/assistant-provider";
import { Mascot } from "./mascot";

// Minimal, safe markdown: paragraphs, bullet lists and **bold**. No HTML is ever injected.
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
  );
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={`l${blocks.length}`}>{list.map((item, i) => <li key={i}>{inline(item)}</li>)}</ul>);
    list = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }
    flush();
    if (line) blocks.push(<p key={`p${blocks.length}`}>{inline(line.replace(/^#+\s*/, ""))}</p>);
  }
  flush();
  return <>{blocks}</>;
}

function suggestionsFor(title?: string, author?: string) {
  if (!title) {
    return ["Recommend a book that will change how I see the world", "How do audiobooks help with learning?", "Explain a big idea in under a minute"];
  }
  return [
    "Explain what I'm hearing in simple terms",
    `What was ${author ?? "the author"} really arguing here?`,
    "Give me a real-world analogy",
    `What's the big idea of ${title}?`
  ];
}

function Message({ message }: { message: AssistantMessage }) {
  const { speak, stopSpeaking, speakingId } = useAssistant();
  const speaking = speakingId === message.id;

  if (message.role === "user") {
    return (
      <div className="chat-msg chat-msg--user">
        <div className="chat-bubble">
          {message.mode === "voice" ? <MicIcon size={13} className="chat-bubble__mode" aria-label="Asked by voice" /> : null}
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-msg chat-msg--assistant${message.status === "error" ? " chat-msg--error" : ""}`}>
      <span className="chat-avatar" aria-hidden>
        <SparkleIcon size={15} />
      </span>
      <div className="chat-bubble">
        {message.content ? <Markdown text={message.content} /> : <span className="typing" aria-label="Thinking"><span /><span /><span /></span>}
        {message.status === "streaming" && message.content ? <span className="caret" aria-hidden /> : null}
        {message.status === "done" && message.content ? (
          <div className="chat-actions">
            <button type="button" className="chat-action" onClick={() => (speaking ? stopSpeaking() : speak(message))} aria-pressed={speaking}>
              {speaking ? <StopIcon size={13} /> : <VolumeIcon size={14} />}
              {speaking ? "Stop" : "Listen"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AssistantPanel() {
  const { open, context, messages, busy, speakingId, pausedBook, closeAssistant, ask, stop, stopSpeaking, resumeBook, clear } = useAssistant();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voice = useSpeechRecognition((transcript) => ask(transcript, "voice"));

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (event: globalThis.KeyboardEvent) => event.key === "Escape" && closeAssistant();
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [closeAssistant, open]);

  // Follow the answer as it streams in.
  const last = messages[messages.length - 1];
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, last?.content]);

  // voice.cancel is stable, so this only reacts to the panel closing.
  const cancelVoice = voice.cancel;
  useEffect(() => {
    if (!open) cancelVoice();
  }, [cancelVoice, open]);

  if (!open || typeof document === "undefined") return null;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!draft.trim() || busy) return;
    ask(draft, "text");
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function toggleMic() {
    if (voice.listening) return voice.stop();
    stopSpeaking();
    voice.start();
  }

  const { book, chapter, positionSeconds, live } = context;
  const suggestions = suggestionsFor(book?.title, book?.authorName);

  return createPortal(
    <aside className="assistant glass glass--strong" role="dialog" aria-modal="false" aria-label="Book assistant">
      <header className="assistant__head">
        <span className="assistant__orb" aria-hidden>
          <Mascot mood={speakingId ? "talking" : busy ? "thinking" : "idle"} />
        </span>
        <div className="assistant__title">
          <h2>{book ? `Ask Lis about ${book.title}` : "Lis · your book assistant"}</h2>
          <p>
            {live && chapter ? (
              <>
                <span className="live-dot" aria-hidden /> Ch {chapter.chapterNumber} · {chapter.title}
                {positionSeconds !== null ? ` · ${formatClock(positionSeconds)}` : ""}
              </>
            ) : book ? (
              `by ${book.authorName}`
            ) : (
              "Ask anything about books and ideas"
            )}
          </p>
        </div>
        {messages.length ? (
          <Button variant="ghost" icon size="sm" onClick={clear} aria-label="Start a new conversation" title="New conversation">
            <RefreshIcon size={16} />
          </Button>
        ) : null}
        <Button variant="ghost" icon size="sm" onClick={closeAssistant} aria-label="Close assistant">
          <CloseIcon size={16} />
        </Button>
      </header>

      <div ref={scrollRef} className="assistant__body" aria-live="polite">
        {messages.length ? (
          messages.map((message) => <Message key={message.id} message={message} />)
        ) : (
          <div className="assistant__intro">
            <p className="assistant__hello">
              {book
                ? `Heard something puzzling? Ask me about any idea in ${book.title} — by typing, or just tap the mic and talk.`
                : "Ask me anything — by typing, or tap the mic and talk."}
            </p>
            <div className="assistant__suggestions">
              {suggestions.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => ask(s, "text")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="assistant__foot">
        {pausedBook && !busy && !speakingId ? (
          <button type="button" className="resume-pill" onClick={resumeBook}>
            <PlayIcon size={12} /> Resume listening
          </button>
        ) : null}
        {voice.listening ? (
          <div className="listening" role="status">
            <span className="listening__bars" aria-hidden>
              <span /><span /><span /><span /><span />
            </span>
            <span>{voice.interim || "Listening… ask your question"}</span>
          </div>
        ) : null}
        {voice.error ? <p className="field__error">{voice.error}</p> : null}

        <form className="composer" onSubmit={submit}>
          <label htmlFor="assistant-input" className="sr-only">
            Ask a question
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            className="composer__input"
            rows={1}
            placeholder={book ? "e.g. What is imaginary time?" : "Ask a question…"}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <Button
            variant={voice.listening ? "primary" : "glass"}
            icon
            className={voice.listening ? "mic mic--live" : "mic"}
            onClick={toggleMic}
            disabled={!voice.supported}
            aria-pressed={voice.listening}
            aria-label={voice.supported ? (voice.listening ? "Stop listening" : "Ask by voice") : "Voice input isn't supported in this browser"}
            title={voice.supported ? "Ask by voice" : "Voice input needs Chrome, Edge or Safari"}
          >
            <MicIcon size={18} />
          </Button>
          {busy ? (
            <Button variant="glass" icon onClick={stop} aria-label="Stop answering">
              <StopIcon size={14} />
            </Button>
          ) : (
            <Button type="submit" variant="primary" icon disabled={!draft.trim()} aria-label="Send question">
              <SendIcon size={17} />
            </Button>
          )}
        </form>
        <p className="assistant__credit">Gemma 4 · running privately on this device via Ollama</p>
      </footer>
    </aside>,
    document.body
  );
}
