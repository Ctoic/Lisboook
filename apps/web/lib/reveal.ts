import type { CSSProperties } from "react";

/** Stagger helper: `style={revealDelay(i)}` on a `[data-reveal]` element. */
export function revealDelay(index: number, step = 90): CSSProperties {
  return { "--reveal-delay": `${index * step}ms` } as CSSProperties;
}
