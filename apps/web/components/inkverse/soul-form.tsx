"use client";

import type { SoulFields, SoulRole } from "@lisbook/types";
import { soulRoles } from "@/lib/inkverse-client";

type LongField = Exclude<keyof SoulFields, "name" | "aliases" | "role">;

const groups: { title: string; fields: { key: LongField; label: string; placeholder: string }[] }[] = [
  {
    title: "Looks & voice",
    fields: [
      { key: "appearance", label: "Appearance", placeholder: "Grey eyes, a scar across her left cheek, black leather armour." },
      { key: "voice", label: "How they speak", placeholder: "Clipped and dry. “Talk less. Climb more.”" }
    ]
  },
  {
    title: "Inner life",
    fields: [
      { key: "personality", label: "Personality", placeholder: "Patient, cold on the surface, loyal to a fault once won over." },
      { key: "desires", label: "What they want", placeholder: "To finish one last contract and disappear." },
      { key: "fears", label: "What they fear", placeholder: "Being needed by anyone again." },
      { key: "secrets", label: "Secret", placeholder: "She was hired by the dragon she was sent to kill." }
    ]
  },
  {
    title: "Arc",
    fields: [
      { key: "arcStart", label: "At the start", placeholder: "A loner who trusts only her blade." },
      { key: "arcEnd", label: "By the end", placeholder: "Someone who chooses a side, and a person." }
    ]
  }
];

/** Every field of a Soul card. Empty strings are sent as "clear this field". */
export function SoulForm({ draft, onChange, idPrefix }: { draft: SoulFields; onChange: (draft: SoulFields) => void; idPrefix: string }) {
  const set = <K extends keyof SoulFields>(key: K, value: SoulFields[K]) => onChange({ ...draft, [key]: value });

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="ink-soul-head">
        <div className="field">
          <label className="field__label" htmlFor={`${idPrefix}-name`}>
            Name
          </label>
          <input id={`${idPrefix}-name`} className="input" value={draft.name} maxLength={80} onChange={(e) => set("name", e.target.value)} placeholder="Kaela" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${idPrefix}-role`}>
            Role
          </label>
          <select id={`${idPrefix}-role`} className="input" value={draft.role} onChange={(e) => set("role", e.target.value as SoulRole)}>
            {soulRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`${idPrefix}-aliases`}>
          Also known as <span className="muted">(comma-separated; Lis tracks these names in your chapters too)</span>
        </label>
        <input
          id={`${idPrefix}-aliases`}
          className="input"
          value={draft.aliases.join(", ")}
          onChange={(e) => set("aliases", e.target.value.split(",").map((a) => a.trimStart()).slice(0, 8))}
          onBlur={() => set("aliases", draft.aliases.map((a) => a.trim()).filter(Boolean))}
          placeholder="The Grey Knife, Kae"
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`${idPrefix}-summary`}>
          In a sentence
        </label>
        <textarea
          id={`${idPrefix}-summary`}
          className="input"
          rows={2}
          maxLength={1500}
          value={draft.summary ?? ""}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="A frost-hardened assassin who has never failed a contract."
        />
      </div>
      {groups.map((group) => (
        <fieldset key={group.title} className="ink-fieldset ink-soul-group">
          <legend className="ink-soul-group__title">{group.title}</legend>
          {group.fields.map((field) => (
            <div key={field.key} className="field">
              <label className="field__label" htmlFor={`${idPrefix}-${field.key}`}>
                {field.label}
              </label>
              <textarea
                id={`${idPrefix}-${field.key}`}
                className="input"
                rows={2}
                maxLength={1500}
                value={draft[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

/** The card as the API expects it: trimmed, with empty text sent as "" so it clears. */
export function soulPayload(draft: SoulFields): Partial<SoulFields> {
  const out: Record<string, unknown> = { name: draft.name.trim(), role: draft.role, aliases: draft.aliases.map((a) => a.trim()).filter(Boolean) };
  for (const group of groups) for (const field of group.fields) out[field.key] = (draft[field.key] ?? "").trim();
  out.summary = (draft.summary ?? "").trim();
  return out as Partial<SoulFields>;
}
