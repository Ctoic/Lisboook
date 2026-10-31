"use client";

import { useEffect, useState } from "react";
import { countMentions, type HearthCasting, type HearthVoice, type Nameable } from "@lisbook/types";

// The Hearth: Lis reads a book aloud with the browser's own voices, a narrator plus one voice per Soul.

export interface Segment {
  paragraph: number;
  text: string;
  /** The Soul speaking this line of dialogue, or null for narration. */
  soulId: string | null;
}

type Speaker = Nameable & { id: string };

const QUOTE = /(“[^”]+”|"[^"]+")/g;

/** Splits a chapter into narration and dialogue, guessing each line's speaker from the names around it. */
export function segmentChapter(content: string, souls: Speaker[]): { paragraphs: string[]; segments: Segment[] } {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const segments: Segment[] = [];
  paragraphs.forEach((paragraph, index) => {
    // Speaker for the paragraph: the Soul named most often in it (dialogue tags like "Kaela said").
    const ranked = souls.map((s) => ({ id: s.id, count: countMentions(paragraph, s) })).filter((r) => r.count).sort((a, b) => b.count - a.count);
    const speaker = ranked[0]?.id ?? null;
    for (const piece of paragraph.split(QUOTE)) {
      const text = piece.trim();
      if (!text) continue;
      const isQuote = /^[“"]/.test(text);
      segments.push({ paragraph: index, text: isQuote ? text.replace(/^[“"]|[”"]$/g, "") : text, soulId: isQuote ? speaker : null });
    }
  });
  return { paragraphs, segments };
}

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** A Soul's voice: its casting if the author set one, otherwise a stable pitch so every character still sounds distinct. */
export function voiceFor(casting: HearthCasting | null, soulId: string | null): HearthVoice {
  const narrator = casting?.narrator ?? { voiceName: null, pitch: 1, rate: 1 };
  if (!soulId) return narrator;
  return casting?.souls[soulId] ?? { voiceName: narrator.voiceName, pitch: [0.75, 0.88, 1.15, 1.3, 1.45][hash(soulId) % 5], rate: narrator.rate };
}

export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en")));
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return voices;
}

export function speakSample(text: string, voice: HearthVoice, voices: SpeechSynthesisVoice[]) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance(text, voice, voices, 1));
}

export function utterance(text: string, voice: HearthVoice, voices: SpeechSynthesisVoice[], speed: number) {
  const u = new SpeechSynthesisUtterance(text);
  const match = voice.voiceName ? voices.find((v) => v.name === voice.voiceName) : undefined;
  if (match) u.voice = match;
  u.pitch = voice.pitch;
  u.rate = Math.min(2, voice.rate * speed);
  return u;
}
