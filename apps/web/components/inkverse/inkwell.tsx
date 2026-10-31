"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CreatorProfileContract, SagaSummaryContract } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { AlertIcon, BookIcon, LayersIcon, PlusIcon, QuillIcon, RefreshIcon, SparkleIcon, UserIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { formatWords, sagaForms, type InkverseClient } from "@/lib/inkverse-client";
import { SagaFields, type SagaDraft } from "./saga-fields";

const comingSoon = [
  { name: "The Loom", hint: "Weave scenes and plot threads on a visual board", icon: <LayersIcon size={20} /> },
  { name: "The Soulforge", hint: "Forge characters and interview them in their own voice", icon: <UserIcon size={20} /> },
  { name: "The Lantern Press", hint: "Publish your Saga as a Lisbook book", icon: <BookIcon size={20} /> },
  { name: "The Campfire", hint: "Share wild ideas, debate and build stories together", icon: <SparkleIcon size={20} /> }
];

export function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units: [number, string][] = [
    [86400 * 30, "month"],
    [86400 * 7, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"]
  ];
  for (const [size, label] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${label}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}

function NewSagaModal({ api, open, onClose }: { api: InkverseClient; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<SagaDraft>({ title: "", logline: "", genre: "", form: "novel" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!draft.title.trim()) {
      setError("Give your Saga a title. A working one is fine.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saga = await api.createSaga({
        title: draft.title.trim(),
        logline: draft.logline.trim() || undefined,
        genre: draft.genre.trim() || undefined,
        form: draft.form
      });
      router.push(`/inkverse/sagas/${saga.id}/quill/${saga.folios[0].id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      icon={<QuillIcon size={24} />}
      title="Begin a new Saga"
      description="Just the essentials. Everything can change as the story grows."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={create}>
            Open the Quill Room
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <SagaFields draft={draft} onChange={setDraft} idPrefix="new-saga" />
        {error ? (
          <p className="field__error" role="alert" style={{ marginTop: 12 }}>
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

/** The writer's home: their Sagas at a glance and a way to begin a new one. */
export function Inkwell({ api, profile }: { api: InkverseClient; profile: CreatorProfileContract }) {
  const [sagas, setSagas] = useState<SagaSummaryContract[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    setError(null);
    api.sagas().then(setSagas, (err: Error) => setError(err.message));
  }

  useEffect(load, [api]);

  const totalWords = sagas?.reduce((sum, s) => sum + s.wordCount, 0) ?? 0;
  const totalChapters = sagas?.reduce((sum, s) => sum + s.folioCount, 0) ?? 0;

  return (
    <div className="shell">
      <header className="page-head ink-head">
        <div>
          <span className="eyebrow">The Inkwell</span>
          <h1>
            Welcome back, <span className="gradient-text">{profile.quillName}</span>
          </h1>
          <p>Pick up a Saga where you left it, or let a new idea out of the bottle.</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setCreating(true)}>
          <PlusIcon size={18} /> New Saga
        </Button>
      </header>

      <div className="stats glass ink-stats" aria-label="Your writing at a glance">
        <div className="stat">
          <p className="stat__value">{sagas ? sagas.length : "–"}</p>
          <p className="stat__label">Sagas</p>
        </div>
        <div className="stat">
          <p className="stat__value">{sagas ? totalChapters : "–"}</p>
          <p className="stat__label">Chapters</p>
        </div>
        <div className="stat">
          <p className="stat__value">{sagas ? totalWords.toLocaleString() : "–"}</p>
          <p className="stat__label">Words written</p>
        </div>
      </div>

      <section className="section section--tight">
        <div className="section-head">
          <h2>Your Sagas</h2>
        </div>
        {error ? (
          <EmptyState
            icon={<AlertIcon size={28} />}
            title="Your Inkwell is out of reach"
            description={error}
            actions={
              <Button variant="primary" onClick={load}>
                <RefreshIcon size={18} /> Try again
              </Button>
            }
          />
        ) : !sagas ? (
          <div className="ink-grid">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: 26 }} />
            ))}
          </div>
        ) : !sagas.length ? (
          <EmptyState
            icon={<SparkleIcon size={28} />}
            title="Every legend starts with a blank page"
            description="Begin your first Saga. Lis will be right beside you in the Quill Room with sparks, continuations and polish."
            actions={
              <Button variant="primary" onClick={() => setCreating(true)}>
                <PlusIcon size={18} /> Begin your first Saga
              </Button>
            }
          />
        ) : (
          <div className="ink-grid">
            {sagas.map((saga) => (
              <Link key={saga.id} href={`/inkverse/sagas/${saga.id}`} className="ink-saga glass glass--interactive">
                <div className="row" style={{ gap: 8 }}>
                  <span className="badge badge--accent">{sagaForms.find((f) => f.value === saga.form)?.label}</span>
                  {saga.genre ? <span className="badge">{saga.genre}</span> : null}
                </div>
                <h3 className="ink-saga__title">{saga.title}</h3>
                <p className="ink-saga__logline muted">{saga.logline || "No logline yet."}</p>
                <p className="ink-saga__meta muted">
                  {saga.folioCount} {saga.folioCount === 1 ? "chapter" : "chapters"} · {formatWords(saga.wordCount)} · {timeAgo(saga.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section section--tight">
        <div className="section-head">
          <h2>Rising in the Inkverse</h2>
        </div>
        <div className="ink-soon">
          {comingSoon.map((item) => (
            <div key={item.name} className="ink-soon__item glass">
              <span className="ink-soon__icon">{item.icon}</span>
              <div>
                <strong>{item.name}</strong>
                <p className="muted">{item.hint}</p>
              </div>
              <span className="badge">Soon</span>
            </div>
          ))}
        </div>
      </section>

      {creating ? <NewSagaModal api={api} open={creating} onClose={() => setCreating(false)} /> : null}
    </div>
  );
}
