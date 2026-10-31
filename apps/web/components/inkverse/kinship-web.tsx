"use client";

import Link from "next/link";
import type { BondKind, SoulBondContract, SoulContract, SoulRole } from "@lisbook/types";
import { initials } from "@/lib/format";
import { bondKinds } from "@/lib/inkverse-client";

export const roleColor: Record<SoulRole, string> = {
  protagonist: "var(--accent)",
  antagonist: "#f2787a",
  mentor: "#5ad1c1",
  love_interest: "#f29bd0",
  supporting: "#a99cf5",
  minor: "var(--muted)"
};

export const bondColor: Record<BondKind, string> = {
  family: "#f5c46b",
  friend: "#94d769",
  ally: "#5ad1c1",
  rival: "#f59e5b",
  enemy: "#f2787a",
  lover: "#f29bd0",
  mentor: "#8fb8ff",
  other: "#98a29c"
};

const W = 640;
const H = 420;

/** Everyone in the Saga on a ring, joined by their bonds. Each name links to its Soul. */
export function KinshipWeb({ sagaId, souls, bonds }: { sagaId: string; souls: SoulContract[]; bonds: SoulBondContract[] }) {
  const cx = W / 2;
  const cy = H / 2;
  const radius = souls.length > 1 ? Math.min(W, H) / 2 - 64 : 0;
  const position = new Map(
    souls.map((soul, i) => {
      const angle = (i / souls.length) * Math.PI * 2 - Math.PI / 2;
      return [soul.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }];
    })
  );
  const usedKinds = bondKinds.filter((k) => bonds.some((b) => b.kind === k.value));

  return (
    <figure className="kinship">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Kinship Web: ${souls.length} Souls and ${bonds.length} bonds`}>
        {bonds.map((bond) => {
          const a = position.get(bond.fromSoulId);
          const b = position.get(bond.toSoulId);
          if (!a || !b) return null;
          return (
            <g key={bond.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={bondColor[bond.kind]} strokeWidth={2.5} strokeOpacity={0.8} />
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 6} className="kinship__bond" textAnchor="middle">
                {bondKinds.find((k) => k.value === bond.kind)?.label}
              </text>
            </g>
          );
        })}
        {souls.map((soul) => {
          const p = position.get(soul.id)!;
          return (
            <Link key={soul.id} href={`/inkverse/sagas/${sagaId}/souls/${soul.id}`} aria-label={`Open ${soul.name}`}>
              <g className="kinship__node">
                <circle cx={p.x} cy={p.y} r={26} fill="var(--bg-soft)" stroke={roleColor[soul.role]} strokeWidth={3} />
                <text x={p.x} y={p.y + 5} textAnchor="middle" className="kinship__initials">
                  {initials(soul.name)}
                </text>
                <text x={p.x} y={p.y + 46} textAnchor="middle" className="kinship__name">
                  {soul.name}
                </text>
              </g>
            </Link>
          );
        })}
      </svg>
      {usedKinds.length ? (
        <figcaption className="kinship__legend">
          {usedKinds.map((kind) => (
            <span key={kind.value}>
              <i style={{ background: bondColor[kind.value] }} /> {kind.label}
            </span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  );
}
