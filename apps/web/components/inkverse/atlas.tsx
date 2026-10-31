"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AtlasEntryContract, AtlasFields, AtlasKind, SagaWorldContract } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertIcon, ArrowLeftIcon, ClockIcon, GlobeIcon, PlusIcon, SparkleIcon, TrashIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { atlasKinds, type InkverseClient } from "@/lib/inkverse-client";
import { useToast } from "@/providers/toast-provider";
import { InkverseSkeleton } from "./creator-gate";
import { SagaNav } from "./saga-nav";

type View = "all" | AtlasKind | "chronicle";

interface Draft {
  kind: AtlasKind;
  name: string;
  aliases: string;
  summary: string;
  details: string;
  parentId: string;
  era: string;
  chronoOrder: string;
}

const blank = (kind: AtlasKind): Draft => ({ kind, name: "", aliases: "", summary: "", details: "", parentId: "", era: "", chronoOrder: "" });

function draftOf(entry: AtlasEntryContract): Draft {
  return {
    kind: entry.kind,
    name: entry.name,
    aliases: entry.aliases.join(", "),
    summary: entry.summary ?? "",
    details: entry.details ?? "",
    parentId: entry.parentId ?? "",
    era: entry.era ?? "",
    chronoOrder: entry.chronoOrder === null ? "" : String(entry.chronoOrder)
  };
}

function payload(draft: Draft): Partial<AtlasFields> {
  return {
    kind: draft.kind,
    name: draft.name.trim(),
    aliases: draft.aliases.split(",").map((a) => a.trim()).filter(Boolean),
    summary: draft.summary.trim(),
    details: draft.details.trim(),
    parentId: draft.parentId || null,
    era: draft.era.trim(),
    chronoOrder: draft.chronoOrder.trim() === "" ? null : Number(draft.chronoOrder)
  } as Partial<AtlasFields>;
}

/** Entries an entry may sit inside: anything but itself and its own descendants. */
function parentOptions(atlas: AtlasEntryContract[], selfId: string | null) {
  const blocked = new Set<string>();
  if (selfId) {
    blocked.add(selfId);
    let grew = true;
    while (grew) {
      grew = false;
      for (const e of atlas) if (e.parentId && blocked.has(e.parentId) && !blocked.has(e.id)) (blocked.add(e.id), (grew = true));
    }
  }
  return atlas.filter((e) => !blocked.has(e.id));
}

function AtlasEditor({
  api,
  world,
  entry,
  initialKind,
  onClose,
  onSaved
}: {
  api: InkverseClient;
  world: SagaWorldContract;
  entry: AtlasEntryContract | null;
  initialKind: AtlasKind;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(entry ? draftOf(entry) : null);
  const [kind, setKind] = useState<AtlasKind>(initialKind);
  const [prompt, setPrompt] = useState("");
  const [forging, setForging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => d && { ...d, [key]: value });

  async function forge() {
    if (prompt.trim().length < 3) {
      toast({ title: "Describe it first", description: "One sentence is enough.", tone: "info" });
      return;
    }
    setForging(true);
    try {
      const forged = await api.forgeAtlas(world.sagaId, kind, prompt.trim());
      setDraft({ ...blank(kind), name: forged.name, aliases: forged.aliases.join(", "), summary: forged.summary ?? "", details: forged.details ?? "", era: forged.era ?? "" });
    } catch (err) {
      toast({ title: "Lis couldn't map that", description: (err as Error).message, tone: "error" });
    } finally {
      setForging(false);
    }
  }

  async function save() {
    if (!draft?.name.trim()) {
      toast({ title: "Give it a name", tone: "error" });
      return;
    }
    if (draft.chronoOrder.trim() && !Number.isInteger(Number(draft.chronoOrder))) {
      toast({ title: "Timeline position must be a whole number", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      if (entry) await api.updateAtlas(entry.id, payload(draft));
      else await api.createAtlas(world.sagaId, payload(draft));
      toast({ title: `${draft.name.trim()} ${entry ? "saved" : "added to the Atlas"}` });
      onSaved();
    } catch (err) {
      toast({ title: "Couldn't save", description: (err as Error).message, tone: "error" });
      setSaving(false);
    }
  }

  async function remove() {
    if (!entry) return;
    try {
      await api.deleteAtlas(entry.id);
      toast({ title: `${entry.name} was removed from the Atlas` });
      onSaved();
    } catch (err) {
      toast({ title: "Couldn't delete", description: (err as Error).message, tone: "error" });
    }
  }

  const kindLabel = atlasKinds.find((k) => k.value === (draft?.kind ?? kind))!;

  return (
    <Modal
      open
      onClose={onClose}
      wide
      icon={<GlobeIcon size={24} />}
      title={entry ? entry.name : draft ? `Review this ${kindLabel.label.toLowerCase()}` : "Add to the Atlas"}
      description={draft ? undefined : "Describe a place, a rule of your world, a faction or a moment in its history. Lis drafts the entry for you to review."}
      footer={
        draft ? (
          <>
            {entry ? (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)} style={{ marginRight: "auto" }}>
                <TrashIcon size={16} /> Delete
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Back
              </Button>
            )}
            <Button variant="primary" loading={saving} onClick={save}>
              {entry ? "Save" : "Add to Atlas"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setDraft(blank(kind))} disabled={forging}>
              Start blank
            </Button>
            <Button variant="primary" loading={forging} onClick={forge}>
              <SparkleIcon size={16} /> {forging ? "Lis is mapping…" : "Forge with Lis"}
            </Button>
          </>
        )
      }
    >
      {confirmDelete ? (
        <div className="notice glass" role="alert">
          <span>
            Delete <strong>{entry?.name}</strong>? Entries inside it stay, but lose their parent.
          </span>
          <Button variant="danger" size="sm" onClick={remove}>
            Delete
          </Button>
        </div>
      ) : null}
      {!draft ? (
        <div className="stack" style={{ gap: 14 }}>
          <div className="segmented ink-kind-picker" role="group" aria-label="Kind of entry">
            {atlasKinds.map((k) => (
              <button key={k.value} type="button" aria-pressed={kind === k.value} onClick={() => setKind(k.value)} disabled={forging}>
                {k.label}
              </button>
            ))}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="atlas-prompt">
              {kindLabel.hint}
            </label>
            <textarea
              id="atlas-prompt"
              className="input"
              rows={3}
              maxLength={600}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                kind === "place"
                  ? "The Spine of the Wyrm, a frozen mountain where the last dragon sleeps."
                  : kind === "lore"
                    ? "Dragon contracts: a dragon bound by a spoken contract cannot break it."
                    : kind === "faction"
                      ? "The Ashen Guild, assassins who only take contracts on immortals."
                      : "The Sundering, when the twin dragons split the kingdom in two."
              }
              data-autofocus
              disabled={forging}
            />
            <span className="field__hint">{forging ? "This takes Lis about half a minute." : "Lis keeps your names and facts, and fills in the rest."}</span>
          </div>
        </div>
      ) : (
        <div className="stack ink-modal-scroll" style={{ gap: 14 }}>
          <div className="segmented ink-kind-picker" role="group" aria-label="Kind of entry">
            {atlasKinds.map((k) => (
              <button key={k.value} type="button" aria-pressed={draft.kind === k.value} onClick={() => set("kind", k.value)}>
                {k.label}
              </button>
            ))}
          </div>
          <div className="ink-soul-head">
            <div className="field">
              <label className="field__label" htmlFor="atlas-name">
                Name
              </label>
              <input id="atlas-name" className="input" value={draft.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="atlas-parent">
                Inside
              </label>
              <select id="atlas-parent" className="input" value={draft.parentId} onChange={(e) => set("parentId", e.target.value)}>
                <option value="">Nowhere (top level)</option>
                {parentOptions(world.atlas, entry?.id ?? null).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="atlas-aliases">
              Other names <span className="muted">(comma-separated; tracked in your chapters too)</span>
            </label>
            <input id="atlas-aliases" className="input" value={draft.aliases} onChange={(e) => set("aliases", e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="atlas-summary">
              In a sentence
            </label>
            <textarea id="atlas-summary" className="input" rows={2} maxLength={600} value={draft.summary} onChange={(e) => set("summary", e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="atlas-details">
              Details
            </label>
            <textarea id="atlas-details" className="input" rows={5} maxLength={3000} value={draft.details} onChange={(e) => set("details", e.target.value)} />
          </div>
          <div className="ink-soul-head">
            <div className="field">
              <label className="field__label" htmlFor="atlas-era">
                When <span className="muted">(for the Chronicle)</span>
              </label>
              <input id="atlas-era" className="input" value={draft.era} maxLength={60} onChange={(e) => set("era", e.target.value)} placeholder="Year 412 of the Ember Age" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="atlas-order">
                Timeline position
              </label>
              <input
                id="atlas-order"
                className="input"
                inputMode="numeric"
                value={draft.chronoOrder}
                onChange={(e) => set("chronoOrder", e.target.value)}
                placeholder="1, 2, 3… (earlier is smaller)"
              />
            </div>
          </div>
          {entry?.appearances.length ? (
            <p className="field__hint">
              Named in{" "}
              {entry.appearances.map((a, i) => (
                <span key={a.folioId}>
                  {i ? ", " : ""}
                  <Link href={`/inkverse/sagas/${world.sagaId}/quill/${a.folioId}`}>{a.title}</Link>
                </span>
              ))}
              .
            </p>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

function EntryRow({ entry, depth, atlas, onOpen }: { entry: AtlasEntryContract; depth: number; atlas: AtlasEntryContract[]; onOpen: (e: AtlasEntryContract) => void }) {
  const children = atlas.filter((e) => e.parentId === entry.id);
  return (
    <>
      <button type="button" className="ink-entry glass glass--interactive" style={{ marginLeft: depth * 28 }} onClick={() => onOpen(entry)}>
        <span className={`badge ink-kind ink-kind--${entry.kind}`}>{atlasKinds.find((k) => k.value === entry.kind)?.label}</span>
        <span className="ink-entry__body">
          <strong>{entry.name}</strong>
          {entry.summary ? <span className="muted">{entry.summary}</span> : null}
        </span>
        <span className="muted ink-entry__meta">
          {entry.era ? `${entry.era} · ` : ""}
          {entry.appearances.length ? `in ${entry.appearances.length} ${entry.appearances.length === 1 ? "chapter" : "chapters"}` : "not in chapters yet"}
        </span>
      </button>
      {children.map((child) => (
        <EntryRow key={child.id} entry={child} depth={depth + 1} atlas={atlas} onOpen={onOpen} />
      ))}
    </>
  );
}

/** The Atlas of Elsewhere: places, lore, factions and the Chronicle of events. */
export function Atlas({ api, sagaId }: { api: InkverseClient; sagaId: string }) {
  const [world, setWorld] = useState<SagaWorldContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("all");
  const [editing, setEditing] = useState<{ entry: AtlasEntryContract | null } | null>(null);

  function load() {
    api.world(sagaId).then(setWorld, (err: Error) => setError(err.message));
  }

  useEffect(load, [api, sagaId]);

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="The Atlas is out of reach"
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
  if (!world) return <InkverseSkeleton />;

  const { atlas } = world;
  const shown = view === "all" || view === "chronicle" ? atlas : atlas.filter((e) => e.kind === view);
  const ids = new Set(shown.map((e) => e.id));
  // Show trees from their highest visible ancestor, so filters never hide a child behind a missing parent.
  const roots = shown.filter((e) => !e.parentId || !ids.has(e.parentId));
  const chronicle = atlas
    .filter((e) => e.kind === "event" || e.chronoOrder !== null || e.era)
    .sort((a, b) => (a.chronoOrder ?? Number.MAX_SAFE_INTEGER) - (b.chronoOrder ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name));
  const tabs: { id: View; label: string; count: number }[] = [
    { id: "all", label: "All", count: atlas.length },
    ...atlasKinds.map((k) => ({ id: k.value as View, label: k.plural, count: atlas.filter((e) => e.kind === k.value).length })),
    { id: "chronicle", label: "Chronicle", count: chronicle.length }
  ];

  return (
    <div className="shell">
      <Link href={`/inkverse/sagas/${sagaId}`} className="back-link">
        <ArrowLeftIcon size={16} /> {world.sagaTitle}
      </Link>
      <SagaNav sagaId={sagaId} />
      <header className="page-head ink-head">
        <div>
          <span className="eyebrow">The Atlas of Elsewhere</span>
          <h1>
            The world of <span className="gradient-text">{world.sagaTitle}</span>
          </h1>
          <p>Places, lore, factions and history. Lis keeps your chapters faithful to every rule you write here.</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setEditing({ entry: null })}>
          <PlusIcon size={18} /> New entry
        </Button>
      </header>

      {!atlas.length ? (
        <EmptyState
          icon={<GlobeIcon size={28} />}
          title="An unmapped world"
          description="Start with the place your story opens in, or the one rule of your world that must never break."
          actions={
            <Button variant="primary" onClick={() => setEditing({ entry: null })}>
              <SparkleIcon size={18} /> Map your first entry
            </Button>
          }
        />
      ) : (
        <div style={{ marginBottom: 64 }}>
          <div className="chips" role="group" aria-label="Filter the Atlas">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" className="chip" aria-pressed={view === tab.id} onClick={() => setView(tab.id)}>
                {tab.id === "chronicle" ? <ClockIcon size={14} /> : null} {tab.label} <span className="chip__count">{tab.count}</span>
              </button>
            ))}
          </div>

          {view === "chronicle" ? (
            chronicle.length ? (
              <ol className="chronicle">
                {chronicle.map((entry) => (
                  <li key={entry.id}>
                    <span className="chronicle__dot" />
                    <button type="button" className="chronicle__card glass glass--interactive" onClick={() => setEditing({ entry })}>
                      <span className="chronicle__era">{entry.era || (entry.chronoOrder !== null ? `#${entry.chronoOrder}` : "Undated")}</span>
                      <strong>{entry.name}</strong>
                      {entry.summary ? <span className="muted">{entry.summary}</span> : null}
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">No dated entries yet. Give events a “When” and a timeline position to see them here.</p>
            )
          ) : (
            <div className="ink-entries">
              {roots.length ? (
                roots.map((entry) => <EntryRow key={entry.id} entry={entry} depth={0} atlas={shown} onOpen={(e) => setEditing({ entry: e })} />)
              ) : (
                <p className="muted">Nothing here yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {editing ? (
        <AtlasEditor
          api={api}
          world={world}
          entry={editing.entry}
          initialKind={view === "all" || view === "chronicle" ? (view === "chronicle" ? "event" : "place") : view}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      ) : null}
    </div>
  );
}
