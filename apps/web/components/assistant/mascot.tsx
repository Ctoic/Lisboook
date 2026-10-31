"use client";

import { useId } from "react";

export type MascotMood = "idle" | "thinking" | "talking";

interface MascotProps {
  mood?: MascotMood;
  className?: string;
}

/**
 * Lis, the book assistant: a glossy hardcover with headphones and a bookmark tuft.
 * Pure SVG so it themes, scales and animates without a 3D runtime. Depth comes from
 * layered gradients; the parent can set --look-x / --look-y (-1..1) to steer the eyes.
 */
export function Mascot({ mood = "idle", className }: MascotProps) {
  // Two mascots can be on screen at once (launcher + panel header), so gradient ids must be unique.
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      className={["mascot", `mascot--${mood}`, className].filter(Boolean).join(" ")}
      viewBox="0 0 120 120"
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id={id("cover")} cx="34%" cy="26%" r="85%">
          <stop offset="0" stopColor="#d4f7b6" />
          <stop offset="0.38" stopColor="#94d769" />
          <stop offset="0.8" stopColor="#4f9e2a" />
          <stop offset="1" stopColor="#2f6e14" />
        </radialGradient>
        <linearGradient id={id("spine")} x1="0" x2="1">
          <stop offset="0" stopColor="#2a6311" />
          <stop offset="0.6" stopColor="#4c9a27" />
          <stop offset="1" stopColor="#3a7d1b" />
        </linearGradient>
        <linearGradient id={id("pages")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#d9cfb6" />
        </linearGradient>
        <linearGradient id={id("band")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3b4248" />
          <stop offset="1" stopColor="#14181b" />
        </linearGradient>
        <radialGradient id={id("cup")} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#b5fff0" />
          <stop offset="0.45" stopColor="#5eead4" />
          <stop offset="1" stopColor="#0f8f80" />
        </radialGradient>
        <linearGradient id={id("ribbon")} x1="0" x2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7c5cf0" />
        </linearGradient>
        <radialGradient id={id("eye")} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#2b3a2d" />
          <stop offset="1" stopColor="#0a1405" />
        </radialGradient>
        <radialGradient id={id("gloss")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Bookmark tuft */}
      <g className="mascot__ribbon">
        <path d="M70 26 C70 14 74 7 82 4 L86 12 L91 7 C88 16 80 18 78 28 Z" fill={url("ribbon")} />
        <path d="M73 24 C74 15 77 10 82 7" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </g>

      {/* Head: page block behind, then spine and cover */}
      <rect x="31" y="25" width="64" height="79" rx="15" fill={url("pages")} />
      <path d="M88 32 V96 M84 30 V99" stroke="#c7bb9c" strokeWidth="1" opacity="0.7" />
      <rect x="22" y="20" width="68" height="80" rx="17" fill={url("cover")} />
      <path d="M39 20 H31 C26 20 22 24 22 30 V90 C22 96 26 100 31 100 H39 Z" fill={url("spine")} opacity="0.85" />
      <path d="M39 22 V98" stroke="#d4f7b6" strokeOpacity="0.35" strokeWidth="1.2" />
      <path d="M24 84 H38 M24 88.5 H38" stroke="#f5d77a" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      <rect x="22.6" y="20.6" width="66.8" height="78.8" rx="16.4" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.2" />
      <ellipse cx="44" cy="31" rx="20" ry="8" fill={url("gloss")} transform="rotate(-14 44 31)" />

      {/* Face follows the pointer slightly further than the head for parallax */}
      <g className="mascot__face">
        <ellipse cx="43" cy="74" rx="6" ry="3.6" fill="#ff8fa3" opacity="0.5" />
        <ellipse cx="77" cy="74" rx="6" ry="3.6" fill="#ff8fa3" opacity="0.5" />

        <g className="mascot__eyes">
          <g className="mascot__eye">
            <ellipse cx="50" cy="60" rx="6.2" ry="8" fill={url("eye")} />
            <circle className="mascot__glint" cx="52.2" cy="56.6" r="2.4" fill="#fff" />
            <circle cx="48" cy="63.4" r="1.1" fill="#fff" opacity="0.7" />
          </g>
          <g className="mascot__eye">
            <ellipse cx="70" cy="60" rx="6.2" ry="8" fill={url("eye")} />
            <circle className="mascot__glint" cx="72.2" cy="56.6" r="2.4" fill="#fff" />
            <circle cx="68" cy="63.4" r="1.1" fill="#fff" opacity="0.7" />
          </g>
        </g>
        <g className="mascot__happy-eyes" fill="none" stroke="#0a1405" strokeWidth="3" strokeLinecap="round">
          <path d="M44 62 Q50 54 56 62" />
          <path d="M64 62 Q70 54 76 62" />
        </g>

        <path className="mascot__smile" d="M54 74 Q60 80 66 74" fill="none" stroke="#0a1405" strokeWidth="2.6" strokeLinecap="round" />
        <g className="mascot__mouth">
          <ellipse cx="60" cy="76" rx="5" ry="4.2" fill="#0a1405" />
          <ellipse cx="60" cy="78.4" rx="3" ry="1.6" fill="#ff8fa3" />
        </g>
      </g>

      {/* Headphones: an audiobook buddy */}
      <path d="M17 62 C15 22 105 22 103 62" fill="none" stroke={url("band")} strokeWidth="6.5" strokeLinecap="round" />
      <path d="M22 44 C30 25 90 25 98 44" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="9" y="52" width="16" height="28" rx="8" fill={url("cup")} />
      <rect x="95" y="52" width="16" height="28" rx="8" fill={url("cup")} />
      <rect x="12" y="55" width="5" height="11" rx="2.5" fill="#fff" opacity="0.5" />
      <rect x="98" y="55" width="5" height="11" rx="2.5" fill="#fff" opacity="0.5" />

      {/* Thinking sparkle */}
      <path
        className="mascot__spark"
        d="M101 22 l2 5.2 5.2 2 -5.2 2 -2 5.2 -2 -5.2 -5.2 -2 5.2 -2 Z"
        fill="#fef08a"
        stroke="#facc15"
        strokeWidth="0.8"
      />
    </svg>
  );
}
