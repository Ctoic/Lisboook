"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, type KeyboardEvent, type RefObject } from "react";
import { countMentions, type AtlasEntryContract, type SagaWorldContract, type SoulContract } from "@lisbook/types";
import { caretPosition } from "@/lib/caret";
import { atlasKinds, soulRoles } from "@/lib/inkverse-client";
import { roleColor } from "./kinship-web";

type Candidate = { id: string; name: string; hint: string; color: string };

interface MenuState {
  trigger: "@" | "#";
  start: number;
  query: string;
  index: number;
  top: number;
  left: number;
}

// "@Ka" or "#Spine of" right before the caret, at the start of a word.
const TRIGGER = /(?:^|[\s("'“‘—–-])([@#])([\p{L}\p{N}'’ -]{0,40})$/u;

function candidatesFor(world: SagaWorldContract | null, trigger: "@" | "#", query: string): Candidate[] {
  if (!world) return [];
  const q = query.trim().toLowerCase();
  const matches = (name: string, aliases: string[]) => !q || [name, ...aliases].some((n) => n.toLowerCase().includes(q));
  const list: Candidate[] =
    trigger === "@"
      ? world.souls
          .filter((s) => matches(s.name, s.aliases))
          .map((s) => ({ id: s.id, name: s.name, hint: soulRoles.find((r) => r.value === s.role)?.label ?? "", color: roleColor[s.role] }))
      : world.atlas
          .filter((a) => matches(a.name, a.aliases))
          .map((a) => ({ id: a.id, name: a.name, hint: atlasKinds.find((k) => k.value === a.kind)?.label ?? "", color: "var(--accent)" }));
  // Names that start with the query first.
  return list.sort((a, b) => Number(!a.name.toLowerCase().startsWith(q)) - Number(!b.name.toLowerCase().startsWith(q))).slice(0, 6);
}

/**
 * Type @ for a Soul or # for an Atlas entry, and pick from the menu to write their name.
 * The name itself is all that lands in the text; Lis recognises it from the Soul or Atlas card.
 */
export function useMentionMenu({
  editorRef,
  world,
  insert
}: {
  editorRef: RefObject<HTMLTextAreaElement | null>;
  world: SagaWorldContract | null;
  insert: (start: number, end: number, text: string) => void;
}) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const candidates = menu ? candidatesFor(world, menu.trigger, menu.query) : [];

  /** Re-reads the text before the caret; call after every change or caret move. */
  function refresh() {
    const editor = editorRef.current;
    if (!editor || editor.selectionStart !== editor.selectionEnd) return setMenu(null);
    const caret = editor.selectionStart;
    const found = editor.value.slice(Math.max(0, caret - 48), caret).match(TRIGGER);
    if (!found) return setMenu(null);
    const trigger = found[1] as "@" | "#";
    const query = found[2];
    // A space with nothing matching means they were just typing a sentence, not a name.
    if (query.includes(" ") && !candidatesFor(world, trigger, query).length) return setMenu(null);
    const start = caret - query.length - 1;
    const at = caretPosition(editor, start);
    setMenu((current) => ({
      trigger,
      start,
      query,
      index: current && current.start === start ? Math.min(current.index, 5) : 0,
      top: editor.offsetTop + at.top + at.lineHeight + 4,
      left: editor.offsetLeft + Math.min(at.left, editor.clientWidth - 240)
    }));
  }

  function pick(candidate: Candidate) {
    const editor = editorRef.current;
    if (!menu || !editor) return;
    insert(menu.start, editor.selectionStart, `${candidate.name} `);
    setMenu(null);
  }

  /** Returns true when the key was used by the menu. */
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!menu) return false;
    if (event.key === "Escape") {
      setMenu(null);
      return true;
    }
    if (!candidates.length) return false;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const step = event.key === "ArrowDown" ? 1 : -1;
      setMenu({ ...menu, index: (menu.index + step + candidates.length) % candidates.length });
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      pick(candidates[Math.min(menu.index, candidates.length - 1)]);
      return true;
    }
    return false;
  }

  const element = menu ? (
    <ul className="mention-menu glass glass--strong" role="listbox" style={{ top: menu.top, left: menu.left }} aria-label={menu.trigger === "@" ? "Souls" : "Atlas entries"}>
      {candidates.length ? (
        candidates.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              role="option"
              aria-selected={i === menu.index}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
            >
              <span className="quill__cast-dot" style={{ background: c.color }} />
              {c.name}
              <small>{c.hint}</small>
            </button>
          </li>
        ))
      ) : (
        <li className="muted" style={{ padding: "8px 10px", fontSize: "0.86rem" }}>
          {menu.trigger === "@" ? "No Soul by that name yet. Forge one in the Soulforge." : "No Atlas entry by that name yet."}
        </li>
      )}
    </ul>
  ) : null;

  return { element, refresh, onKeyDown, close: () => setMenu(null) };
}

/** Who and where this chapter mentions, counted live as the writer types. */
export function CastPanel({ sagaId, world, content }: { sagaId: string; world: SagaWorldContract | null; content: string }) {
  const text = useDeferredValue(content);
  const cast = useMemo(() => {
    if (!world) return { souls: [] as Array<{ soul: SoulContract; count: number }>, places: [] as Array<{ entry: AtlasEntryContract; count: number }> };
    return {
      souls: world.souls.map((soul) => ({ soul, count: countMentions(text, soul) })).filter((r) => r.count).sort((a, b) => b.count - a.count),
      places: world.atlas.map((entry) => ({ entry, count: countMentions(text, entry) })).filter((r) => r.count).sort((a, b) => b.count - a.count)
    };
  }, [world, text]);

  return (
    <div className="quill__cast">
      <p className="quill__cast-title">In this chapter</p>
      {cast.souls.length || cast.places.length ? (
        <ul>
          {cast.souls.map(({ soul, count }) => (
            <li key={soul.id}>
              <Link href={`/inkverse/sagas/${sagaId}/souls/${soul.id}`} target="_blank">
                <span className="quill__cast-dot" style={{ background: roleColor[soul.role] }} />
                {soul.name}
                <span className="quill__cast-count">{count}</span>
              </Link>
            </li>
          ))}
          {cast.places.map(({ entry, count }) => (
            <li key={entry.id}>
              <Link href={`/inkverse/sagas/${sagaId}/atlas`} target="_blank">
                <span className="quill__cast-dot" style={{ background: "var(--muted)" }} />
                {entry.name}
                <span className="quill__cast-count">{count}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ fontSize: "0.82rem" }}>
          {world && (world.souls.length || world.atlas.length) ? (
            <>
              Type <kbd>@</kbd> for a Soul or <kbd>#</kbd> for a place.
            </>
          ) : (
            "Add characters and places so Lis keeps them consistent."
          )}
        </p>
      )}
      <div className="quill__cast-links">
        <Link href={`/inkverse/sagas/${sagaId}/souls`} target="_blank">
          Soulforge
        </Link>
        <Link href={`/inkverse/sagas/${sagaId}/atlas`} target="_blank">
          Atlas
        </Link>
      </div>
    </div>
  );
}
