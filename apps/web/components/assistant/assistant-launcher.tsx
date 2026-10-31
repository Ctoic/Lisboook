"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { useAssistant } from "@/providers/assistant-provider";
import { Mascot, type MascotMood } from "./mascot";

const GREETED_KEY = "lisbook.mascotGreeted";

// sessionStorage can throw (private mode, blocked storage); the greeting just shows again.
function greetedThisSession() {
  try {
    return window.sessionStorage.getItem(GREETED_KEY) === "1";
  } catch {
    return false;
  }
}

function markGreeted() {
  try {
    window.sessionStorage.setItem(GREETED_KEY, "1");
  } catch {
    // ignore
  }
}

export function AssistantLauncher() {
  const { open, busy, speakingId, openAssistant } = useAssistant();
  const [greeting, setGreeting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Say hello once per visit, then get out of the way.
  useEffect(() => {
    if (greetedThisSession()) return;
    const show = window.setTimeout(() => setGreeting(true), 2200);
    const hide = window.setTimeout(() => {
      setGreeting(false);
      markGreeted();
    }, 11000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  // Eyes and head follow the pointer. Writes CSS variables directly to avoid re-rendering.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        el.style.setProperty("--look-x", clamp(dx / 420).toFixed(3));
        el.style.setProperty("--look-y", clamp(dy / 320).toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  if (open) return null;

  const mood: MascotMood = speakingId ? "talking" : busy ? "thinking" : "idle";

  function launch() {
    setGreeting(false);
    markGreeted();
    openAssistant();
  }

  function dismiss() {
    setGreeting(false);
    markGreeted();
  }

  return (
    <div ref={rootRef} className="launcher">
      {greeting ? (
        <div className="launcher__bubble glass glass--strong" role="status">
          <button type="button" className="launcher__bubble-text" onClick={launch}>
            <strong>Hi, I&rsquo;m Lis!</strong> Ask me about any book, or just talk to me.
          </button>
          <button type="button" className="launcher__bubble-close" onClick={dismiss} aria-label="Dismiss greeting">
            <CloseIcon size={12} />
          </button>
        </div>
      ) : null}
      <button type="button" className="launcher__btn" onClick={launch} aria-label="Open Lis, the book assistant" title="Ask Lis">
        <span className="launcher__halo" aria-hidden />
        <span className="launcher__body">
          <Mascot mood={mood} />
        </span>
        <span className="launcher__shadow" aria-hidden />
      </button>
    </div>
  );
}
