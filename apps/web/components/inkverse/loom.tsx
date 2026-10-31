"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { LoomBoard, LoomShard, LoomThread, SagaWorldContract, ShardKind, ThreadKind } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertIcon, ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon, LayersIcon, PlusIcon, QuillIcon, SparkleIcon, TrashIcon } from "@/components/ui/icons";
import type { InkverseClient } from "@/lib/inkverse-client";
import { useToast } from "@/providers/toast-provider";
import { InkverseSkeleton } from "./creator-gate";
import { roleColor } from "./kinship-web";
import { SagaNav } from "./saga-nav";

type View = "web" | "timeline" | "lanes";
type SaveState = "saved" | "saving" | "unsaved" | "error";

const CARD_W = 240;
const CARD_H = 132;

export const shardKinds: { value: ShardKind; label: string; color: string }[] = [
  { value: "scene", label: "Scene", color: "#94d769" },
  { value: "beat", label: "Beat", color: "#5ad1c1" },
  { value: "idea", label: "Idea", color: "#a99cf5" },
  { value: "note", label: "Note", color: "#98a29c" },
  { value: "quote", label: "Quote", color: "#f5c46b" }
];

export const threadKinds: { value: ThreadKind; label: string; color: string; dash?: string }[] = [
  { value: "leads_to", label: "leads to", color: "#94d769" },
  { value: "foreshadows", label: "foreshadows", color: "#a99cf5", dash: "6 6" },
  { value: "conflicts", label: "conflicts with", color: "#f2787a" },
  { value: "flashback", label: "flashback to", color: "#f5c46b", dash: "2 6" },
  { value: "reveals", label: "reveals", color: "#5ad1c1" }
];

const kindOf = (kind: ShardKind) => shardKinds.find((k) => k.value === kind)!;
const threadOf = (kind: ThreadKind) => threadKinds.find((k) => k.value === kind)!;
const newId = () => Math.random().toString(36).slice(2, 12);

function ShardCard({
  shard,
  world,
  selected,
  linking,
  onPointerDown
}: {
  shard: LoomShard;
  world: SagaWorldContract | null;
  selected: boolean;
  linking: boolean;
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const kind = kindOf(shard.kind);
  const souls = world?.souls.filter((s) => shard.soulIds.includes(s.id)) ?? [];
  return (
    <div
      className={`shard glass${selected ? " shard--selected" : ""}${linking ? " shard--target" : ""}`}
      style={{ borderTopColor: kind.color }}
      onPointerDown={onPointerDown}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${kind.label}: ${shard.title || "Untitled"}`}
    >
      <div className="shard__head">
        <span className="shard__kind" style={{ color: kind.color }}>
          {kind.label}
        </span>
        {shard.folioId ? (
          <span className="shard__chapter" title="Written as a chapter">
            <QuillIcon size={12} /> Chapter
          </span>
        ) : null}
      </div>
      <p className="shard__title">{shard.title || "Untitled"}</p>
      <p className="shard__body">{shard.body}</p>
      {souls.length ? (
        <div className="shard__souls">
          {souls.map((s) => (
            <span key={s.id} title={s.name} style={{ borderColor: roleColor[s.role] }}>
              {s.name.slice(0, 1)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The Loom: Shards of story on an open board, joined by Threads. */
export function Loom({ api, sagaId }: { api: InkverseClient; sagaId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [board, setBoard] = useState<LoomBoard | null>(null);
  const [world, setWorld] = useState<SagaWorldContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("web");
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [linkKind, setLinkKind] = useState<ThreadKind>("leads_to");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [weavePrompt, setWeavePrompt] = useState("");
  const [weaving, setWeaving] = useState(false);
  const [writing, setWriting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<LoomBoard | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const dragRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => {
    Promise.all([api.loom(sagaId), api.world(sagaId)]).then(
      ([loaded, loadedWorld]) => {
        boardRef.current = loaded;
        setBoard(loaded);
        setWorld(loadedWorld);
      },
      (err: Error) => setError(err.message)
    );
  }, [api, sagaId]);

  const save = useCallback(async () => {
    window.clearTimeout(timerRef.current);
    if (!boardRef.current) return true;
    setSaveState("saving");
    try {
      await api.saveLoom(sagaId, boardRef.current);
      setSaveState("saved");
      return true;
    } catch {
      setSaveState("error");
      return false;
    }
  }, [api, sagaId]);

  /** Applies a change to the board and saves shortly after the writer stops fiddling. */
  const change = useCallback(
    (update: (board: LoomBoard) => LoomBoard, immediate = false) => {
      if (!boardRef.current) return;
      boardRef.current = update(boardRef.current);
      setBoard(boardRef.current);
      setSaveState("unsaved");
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => void save(), immediate ? 0 : 900);
    },
    [save]
  );

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const typing = (event.target as HTMLElement)?.closest("input, textarea, select");
      if (typing) return;
      if (event.key === "Escape") {
        setLinkFrom(null);
        setSelected(null);
        setSelectedThread(null);
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedThread) {
        change((b) => ({ ...b, threads: b.threads.filter((t) => t.id !== selectedThread) }), true);
        setSelectedThread(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [change, selectedThread]);

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="The Loom is tangled"
          description={error}
          actions={
            <ButtonLink href="/inkverse" variant="primary">
              Back to your Inkwell
            </ButtonLink>
          }
        />
      </div>
    );
  }
  if (!board) return <InkverseSkeleton />;

  const shard = board.shards.find((s) => s.id === selected) ?? null;
  const ordered = [...board.shards].sort((a, b) => a.order - b.order);
  const width = Math.max(2400, ...board.shards.map((s) => s.x + CARD_W + 400));
  const height = Math.max(1200, ...board.shards.map((s) => s.y + CARD_H + 300));

  function addShard(kind: ShardKind) {
    const canvas = canvasRef.current;
    const x = (canvas?.scrollLeft ?? 0) + (canvas ? canvas.clientWidth / 2 - CARD_W / 2 : 120) + (Math.random() * 60 - 30);
    const y = (canvas?.scrollTop ?? 0) + (canvas ? canvas.clientHeight / 2 - CARD_H / 2 : 120) + (Math.random() * 60 - 30);
    const order = board!.shards.length ? Math.max(...board!.shards.map((s) => s.order)) + 1 : 0;
    const created: LoomShard = { id: newId(), kind, title: "", body: "", x: Math.round(x), y: Math.round(y), order, soulIds: [], folioId: null };
    change((b) => ({ ...b, shards: [...b.shards, created] }), true);
    setSelected(created.id);
    setView("web");
  }

  function updateShard(id: string, patch: Partial<LoomShard>) {
    change((b) => ({ ...b, shards: b.shards.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  }

  function removeShard(id: string) {
    change((b) => ({ shards: b.shards.filter((s) => s.id !== id), threads: b.threads.filter((t) => t.from !== id && t.to !== id) }), true);
    setSelected(null);
  }

  function pickShard(id: string) {
    if (linkFrom && linkFrom !== id) {
      const exists = board!.threads.some((t) => (t.from === linkFrom && t.to === id) || (t.from === id && t.to === linkFrom));
      if (!exists) {
        const thread: LoomThread = { id: newId(), from: linkFrom, to: id, kind: linkKind };
        change((b) => ({ ...b, threads: [...b.threads, thread] }), true);
      }
      setLinkFrom(null);
      setSelected(id);
      return;
    }
    setSelected(id);
    setSelectedThread(null);
  }

  function onCardPointerDown(event: ReactPointerEvent<HTMLDivElement>, s: LoomShard) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: s.id, startX: event.clientX, startY: event.clientY, x: s.x, y: s.y, moved: false };
    const target = event.currentTarget;
    const move = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      boardRef.current = {
        ...boardRef.current!,
        shards: boardRef.current!.shards.map((sh) => (sh.id === drag.id ? { ...sh, x: Math.max(0, Math.round(drag.x + dx)), y: Math.max(0, Math.round(drag.y + dy)) } : sh))
      };
      setBoard(boardRef.current);
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag) return;
      if (drag.moved) change((b) => b);
      else pickShard(drag.id);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  }

  function move(id: string, delta: number) {
    const index = ordered.findIndex((s) => s.id === id);
    const other = ordered[index + delta];
    if (!other) return;
    const mine = ordered[index];
    change((b) => ({ ...b, shards: b.shards.map((s) => (s.id === mine.id ? { ...s, order: other.order } : s.id === other.id ? { ...s, order: mine.order } : s)) }), true);
  }

  async function weave() {
    setWeaving(true);
    try {
      if (!(await save())) throw new Error("Your board hasn't saved yet.");
      const woven = await api.weave(sagaId, weavePrompt.trim() || undefined);
      if (!woven.shards.length) throw new Error("Lis came back empty-handed. Try a direction.");
      change((b) => ({ shards: [...b.shards, ...woven.shards], threads: [...b.threads, ...woven.threads] }), true);
      setWeavePrompt("");
      toast({ title: `Lis wove ${woven.shards.length} new Shards`, description: "Drag them anywhere, edit them, or turn one into a chapter." });
      // Bring the new beats into view.
      requestAnimationFrame(() => canvasRef.current?.scrollTo({ left: Math.max(0, woven.shards[0].x - 80), top: 0, behavior: "smooth" }));
    } catch (err) {
      toast({ title: "Couldn't weave", description: (err as Error).message, tone: "error" });
    } finally {
      setWeaving(false);
    }
  }

  /** Turns a Shard into a chapter and opens the Quill Room, where Lis writes it from the Shard. */
  async function writeAsChapter(s: LoomShard) {
    setWriting(true);
    try {
      const folio = await api.createFolio(sagaId, (s.title || "Untitled scene").slice(0, 120));
      updateShard(s.id, { folioId: folio.id });
      await save();
      const cast = world?.souls.filter((soul) => s.soulIds.includes(soul.id)).map((soul) => soul.name) ?? [];
      const prompt = `Write this chapter, "${s.title}". ${s.body}${cast.length ? ` Characters in it: ${cast.join(", ")}.` : ""}`;
      router.push(`/inkverse/sagas/${sagaId}/quill/${folio.id}?lis=${encodeURIComponent(prompt.slice(0, 900))}`);
    } catch (err) {
      toast({ title: "Couldn't create the chapter", description: (err as Error).message, tone: "error" });
      setWriting(false);
    }
  }

  const center = (s: LoomShard) => ({ x: s.x + CARD_W / 2, y: s.y + CARD_H / 2 });
  const lanes = world
    ? [
        ...world.souls.map((soul) => ({ id: soul.id, name: soul.name, color: roleColor[soul.role], shards: ordered.filter((s) => s.soulIds.includes(soul.id)) })),
        { id: "none", name: "No one yet", color: "var(--muted)", shards: ordered.filter((s) => !s.soulIds.length) }
      ].filter((lane) => lane.shards.length)
    : [];

  return (
    <div className="loom-page">
      <div className="shell">
        <Link href={`/inkverse/sagas/${sagaId}`} className="back-link">
          <ArrowLeftIcon size={16} /> {world?.sagaTitle ?? "Saga"}
        </Link>
        <SagaNav sagaId={sagaId} />
        <header className="page-head ink-head" style={{ paddingBottom: 18 }}>
          <div>
            <span className="eyebrow">The Loom</span>
            <h1>Weave your plot</h1>
            <p>Drop Shards of story onto the board, join them with Threads, and let Lis weave what comes next. Any Shard can become a chapter.</p>
          </div>
        </header>
      </div>

      <div className="loom">
        <div className="loom__toolbar glass glass--strong">
          <div className="segmented" role="group" aria-label="Loom view">
            {(["web", "timeline", "lanes"] as View[]).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {v === "web" ? "Web" : v === "timeline" ? "Timeline" : "Lanes"}
              </button>
            ))}
          </div>
          <span className="loom__divider" />
          {shardKinds.slice(0, 4).map((k) => (
            <Button key={k.value} variant="ghost" size="sm" onClick={() => addShard(k.value)}>
              <PlusIcon size={14} style={{ color: k.color }} /> {k.label}
            </Button>
          ))}
          <span className="loom__divider" />
          <form
            className="loom__weave"
            onSubmit={(e) => {
              e.preventDefault();
              void weave();
            }}
          >
            <input
              className="input"
              value={weavePrompt}
              onChange={(e) => setWeavePrompt(e.target.value)}
              placeholder="Direction for Lis (optional), e.g. a betrayal at the river"
              aria-label="Direction for Lis"
              disabled={weaving}
            />
            <Button type="submit" variant="primary" size="sm" loading={weaving}>
              <SparkleIcon size={14} /> {weaving ? "Weaving…" : "Weave with Lis"}
            </Button>
          </form>
          <span className={`quill__save quill__save--${saveState} loom__save`}>
            {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Unsaved" : "Not saved"}
          </span>
        </div>

        {linkFrom ? (
          <div className="loom__hint glass glass--strong" role="status">
            Click the Shard this one <strong>{threadOf(linkKind).label}</strong>.{" "}
            <button type="button" className="text-link" onClick={() => setLinkFrom(null)}>
              Cancel
            </button>
          </div>
        ) : null}

        <div className="loom__stage">
          {view === "web" ? (
            board.shards.length ? (
              <div className="loom__canvas" ref={canvasRef} onPointerDown={(e) => e.target === e.currentTarget && (setSelected(null), setSelectedThread(null))}>
                <div className="loom__plane" style={{ width, height }} onPointerDown={(e) => e.target === e.currentTarget && (setSelected(null), setSelectedThread(null))}>
                  <svg className="loom__threads" width={width} height={height}>
                    <defs>
                      {threadKinds.map((k) => (
                        <marker key={k.value} id={`arrow-${k.value}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                          <path d="M0 0 10 5 0 10z" fill={k.color} />
                        </marker>
                      ))}
                    </defs>
                    {board.threads.map((t) => {
                      const a = board.shards.find((s) => s.id === t.from);
                      const b = board.shards.find((s) => s.id === t.to);
                      if (!a || !b) return null;
                      const p = center(a);
                      const q = center(b);
                      const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
                      const k = threadOf(t.kind);
                      const active = selectedThread === t.id;
                      return (
                        <g key={t.id} className="loom__thread" onPointerDown={() => (setSelectedThread(t.id), setSelected(null))}>
                          <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="transparent" strokeWidth={16} />
                          <line x1={p.x} y1={p.y} x2={mid.x} y2={mid.y} stroke={k.color} strokeWidth={active ? 4 : 2.5} strokeDasharray={k.dash} markerEnd={`url(#arrow-${t.kind})`} />
                          <line x1={mid.x} y1={mid.y} x2={q.x} y2={q.y} stroke={k.color} strokeWidth={active ? 4 : 2.5} strokeDasharray={k.dash} />
                          <text x={mid.x} y={mid.y - 10} textAnchor="middle" className="loom__thread-label">
                            {k.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  {board.shards.map((s) => (
                    <div key={s.id} className="loom__card" style={{ left: s.x, top: s.y, width: CARD_W, height: CARD_H }}>
                      <ShardCard shard={s} world={world} selected={selected === s.id} linking={Boolean(linkFrom) && linkFrom !== s.id} onPointerDown={(e) => onCardPointerDown(e, s)} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="shell">
                <EmptyState
                  icon={<LayersIcon size={28} />}
                  title="An empty Loom"
                  description="Add your first Scene, or ask Lis to weave the whole arc of your story from its logline and characters."
                  actions={
                    <>
                      <Button variant="primary" onClick={weave} loading={weaving}>
                        <SparkleIcon size={16} /> Weave my story
                      </Button>
                      <Button variant="glass" onClick={() => addShard("scene")}>
                        <PlusIcon size={16} /> Add a Scene
                      </Button>
                    </>
                  }
                />
              </div>
            )
          ) : view === "timeline" ? (
            <div className="shell">
              <ol className="loom__timeline">
                {ordered.map((s, i) => (
                  <li key={s.id}>
                    <span className="loom__step">{i + 1}</span>
                    <div className="loom__timeline-card" onClick={() => pickShard(s.id)}>
                      <ShardCard shard={s} world={world} selected={selected === s.id} linking={false} />
                    </div>
                    <span className="loom__order">
                      <Button variant="ghost" icon size="sm" onClick={() => move(s.id, -1)} disabled={i === 0} aria-label="Move earlier">
                        <ChevronUpIcon size={16} />
                      </Button>
                      <Button variant="ghost" icon size="sm" onClick={() => move(s.id, 1)} disabled={i === ordered.length - 1} aria-label="Move later">
                        <ChevronDownIcon size={16} />
                      </Button>
                    </span>
                  </li>
                ))}
              </ol>
              {!ordered.length ? <p className="muted">No Shards yet.</p> : null}
            </div>
          ) : (
            <div className="shell loom__lanes">
              {lanes.length ? (
                lanes.map((lane) => (
                  <section key={lane.id} className="loom__lane">
                    <h3>
                      <span className="quill__cast-dot" style={{ background: lane.color }} /> {lane.name}
                    </h3>
                    <div className="loom__lane-row">
                      {lane.shards.map((s) => (
                        <div key={s.id} className="loom__lane-card" onClick={() => pickShard(s.id)}>
                          <ShardCard shard={s} world={world} selected={selected === s.id} linking={false} />
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <p className="muted">Tag characters on your Shards to see each one&apos;s path through the story.</p>
              )}
            </div>
          )}

          {shard ? (
            <aside className="loom__inspector glass glass--strong" aria-label="Edit Shard">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="segmented loom__kinds" role="group" aria-label="Shard kind">
                  {shardKinds.map((k) => (
                    <button key={k.value} type="button" aria-pressed={shard.kind === k.value} onClick={() => updateShard(shard.id, { kind: k.value })}>
                      {k.label}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" icon size="sm" onClick={() => setSelected(null)} aria-label="Close">
                  <CloseIcon size={16} />
                </Button>
              </div>
              <input
                className="input loom__title-input"
                value={shard.title}
                maxLength={120}
                onChange={(e) => updateShard(shard.id, { title: e.target.value })}
                placeholder="What happens?"
                aria-label="Shard title"
                autoFocus={!shard.title}
              />
              <textarea
                className="input"
                rows={4}
                maxLength={1500}
                value={shard.body}
                onChange={(e) => updateShard(shard.id, { body: e.target.value })}
                placeholder="A sentence or two about this moment."
                aria-label="Shard description"
              />
              {world?.souls.length ? (
                <div>
                  <p className="quill__cast-title" style={{ marginBottom: 6 }}>
                    Who&apos;s in it
                  </p>
                  <div className="ink-chip-wrap">
                    {world.souls.map((soul) => (
                      <button
                        key={soul.id}
                        type="button"
                        className="chip"
                        aria-pressed={shard.soulIds.includes(soul.id)}
                        onClick={() =>
                          updateShard(shard.id, {
                            soulIds: shard.soulIds.includes(soul.id) ? shard.soulIds.filter((id) => id !== soul.id) : [...shard.soulIds, soul.id]
                          })
                        }
                      >
                        {soul.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="loom__link">
                <select className="input" value={linkKind} onChange={(e) => setLinkKind(e.target.value as ThreadKind)} aria-label="Thread kind">
                  {threadKinds.map((k) => (
                    <option key={k.value} value={k.value}>
                      This {k.label}…
                    </option>
                  ))}
                </select>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => {
                    setLinkFrom(shard.id);
                    setView("web");
                  }}
                >
                  Pick a Shard
                </Button>
              </div>
              <div className="stack" style={{ gap: 8 }}>
                {shard.folioId ? (
                  <ButtonLink href={`/inkverse/sagas/${sagaId}/quill/${shard.folioId}`} variant="glass" block>
                    <QuillIcon size={16} /> Open its chapter
                  </ButtonLink>
                ) : (
                  <Button variant="primary" block onClick={() => writeAsChapter(shard)} loading={writing} disabled={!shard.title.trim()}>
                    <QuillIcon size={16} /> Write as a chapter with Lis
                  </Button>
                )}
                <Button variant="ghost" block onClick={() => removeShard(shard.id)}>
                  <TrashIcon size={16} /> Remove Shard
                </Button>
              </div>
            </aside>
          ) : selectedThread ? (
            <aside className="loom__inspector glass glass--strong" aria-label="Edit Thread">
              <p className="quill__cast-title">Thread</p>
              <select
                className="input"
                value={board.threads.find((t) => t.id === selectedThread)?.kind}
                onChange={(e) => change((b) => ({ ...b, threads: b.threads.map((t) => (t.id === selectedThread ? { ...t, kind: e.target.value as ThreadKind } : t)) }), true)}
                aria-label="Thread kind"
              >
                {threadKinds.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                block
                onClick={() => {
                  change((b) => ({ ...b, threads: b.threads.filter((t) => t.id !== selectedThread) }), true);
                  setSelectedThread(null);
                }}
              >
                <TrashIcon size={16} /> Cut this Thread
              </Button>
            </aside>
          ) : null}
        </div>

        <div className="loom__legend">
          {threadKinds.map((k) => (
            <span key={k.value}>
              <svg width="26" height="8" aria-hidden>
                <line x1="0" y1="4" x2="26" y2="4" stroke={k.color} strokeWidth="2.5" strokeDasharray={k.dash} />
              </svg>
              {k.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
