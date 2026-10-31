"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ---------- Speech recognition (voice questions) ---------- */

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionCtor = new () => Recognition;

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(onFinal: (transcript: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => setSupported(Boolean(getRecognition())), []);

  const start = useCallback(() => {
    const Ctor = getRecognition();
    if (!Ctor) return;
    recognitionRef.current?.abort();
    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    finalRef.current = "";
    setInterim("");
    setError(null);

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        text += result[0].transcript;
        if (result.isFinal) finalRef.current = text;
      }
      setInterim(text);
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(event.error === "not-allowed" ? "Microphone access was blocked. Allow it in your browser to ask by voice." : "Voice input stopped unexpectedly.");
    };
    recognition.onend = () => {
      setListening(false);
      const transcript = finalRef.current.trim();
      setInterim("");
      if (transcript) onFinalRef.current(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => recognitionRef.current?.stop(), []);
  const cancel = useCallback(() => {
    finalRef.current = "";
    recognitionRef.current?.abort();
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, interim, error, start, stop, cancel };
}

/* ---------- Speech synthesis (spoken answers) ---------- */

export function toSpeakable(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_`#>]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  const lang = (navigator.language || "en-US").slice(0, 2);
  const preferred = ["Samantha", "Ava", "Google US English", "Microsoft Aria", "Karen", "Daniel"];
  return (
    preferred.map((name) => voices.find((v) => v.name.includes(name))).find(Boolean) ??
    voices.find((v) => v.lang.startsWith(lang) && v.localService) ??
    voices.find((v) => v.lang.startsWith(lang)) ??
    null
  );
}

/**
 * Speaks a streamed answer sentence by sentence, so the listener hears the reply while
 * the model is still writing it.
 */
export class StreamingSpeaker {
  private buffer = "";
  private pending = 0;
  private finished = false;
  private cancelled = false;

  constructor(private readonly onIdle: () => void) {}

  static get supported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  feed(text: string) {
    if (this.cancelled) return;
    this.buffer += text;
    const match = this.buffer.match(/^([\s\S]*?[.!?…](?:["')\]]?))(\s+)([\s\S]*)$/);
    if (match) {
      this.say(match[1]);
      this.buffer = match[3];
      this.feed("");
    }
  }

  finish() {
    if (this.cancelled) return;
    if (this.buffer.trim()) this.say(this.buffer);
    this.buffer = "";
    this.finished = true;
    if (this.pending === 0) this.onIdle();
  }

  cancel() {
    this.cancelled = true;
    this.buffer = "";
    if (StreamingSpeaker.supported) window.speechSynthesis.cancel();
  }

  private say(raw: string) {
    const text = toSpeakable(raw);
    if (!text || !StreamingSpeaker.supported) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 1.02;
    this.pending++;
    let settled = false;
    // Some browsers never fire onend (no voices installed, tab backgrounded), so a watchdog
    // based on a generous reading speed guarantees the conversation can move on.
    const watchdog = window.setTimeout(() => done(), 4000 + text.split(/\s+/).length * 600);
    const done = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(watchdog);
      this.pending--;
      if (this.finished && this.pending === 0 && !this.cancelled) this.onIdle();
    };
    utterance.onend = done;
    utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  }
}
