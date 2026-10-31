"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SagaDetailContract } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertIcon, ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, QuillIcon, TrashIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { folioStatuses, formatWords, type InkverseClient } from "@/lib/inkverse-client";
import { useToast } from "@/providers/toast-provider";
import { InkverseSkeleton } from "./creator-gate";
import { timeAgo } from "./inkwell";
import { SagaFields, type SagaDraft } from "./saga-fields";
import { SagaNav } from "./saga-nav";

function draftOf(saga: SagaDetailContract): SagaDraft {
  return { title: saga.title, logline: saga.logline ?? "", genre: saga.genre ?? "", form: saga.form };
}

/** A Saga's home: its settings and the running order of its chapters. */
export function SagaOverview({ api, sagaId }: { api: InkverseClient; sagaId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [saga, setSaga] = useState<SagaDetailContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<SagaDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api.saga(sagaId).then(
      (loaded) => {
        setSaga(loaded);
        setDraft(draftOf(loaded));
      },
      (err: Error) => setError(err.message)
    );
  }, [api, sagaId]);

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="This Saga slipped out of reach"
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
  if (!saga || !draft) return <InkverseSkeleton />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(saga));

  async function save() {
    if (!draft!.title.trim()) {
      toast({ title: "Your Saga needs a title", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateSaga(sagaId, {
        title: draft!.title.trim(),
        logline: draft!.logline.trim(),
        genre: draft!.genre.trim(),
        form: draft!.form
      });
      setSaga(updated);
      setDraft(draftOf(updated));
      toast({ title: "Saga saved" });
    } catch (err) {
      toast({ title: "Couldn't save the Saga", description: (err as Error).message, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function move(index: number, delta: number) {
    const ids = saga!.folios.map((f) => f.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved);
    setBusy(true);
    try {
      setSaga(await api.reorderFolios(sagaId, ids));
    } catch (err) {
      toast({ title: "Couldn't reorder chapters", description: (err as Error).message, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function addChapter() {
    setBusy(true);
    try {
      const folio = await api.createFolio(sagaId);
      router.push(`/inkverse/sagas/${sagaId}/quill/${folio.id}`);
    } catch (err) {
      toast({ title: "Couldn't add a chapter", description: (err as Error).message, tone: "error" });
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.deleteSaga(sagaId);
      toast({ title: `"${saga!.title}" was deleted` });
      router.push("/inkverse");
    } catch (err) {
      toast({ title: "Couldn't delete the Saga", description: (err as Error).message, tone: "error" });
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <Link href="/inkverse" className="back-link">
        <ArrowLeftIcon size={16} /> Your Inkwell
      </Link>
      <SagaNav sagaId={saga.id} />
      <header className="page-head ink-head">
        <div>
          <span className="eyebrow">Saga</span>
          <h1>{saga.title}</h1>
          <p>
            {saga.folioCount} {saga.folioCount === 1 ? "chapter" : "chapters"} · {formatWords(saga.wordCount)} · edited {timeAgo(saga.updatedAt)}
          </p>
        </div>
        <ButtonLink href={`/inkverse/sagas/${saga.id}/quill/${saga.folios[0].id}`} variant="primary" size="lg">
          <QuillIcon size={18} /> Open the Quill Room
        </ButtonLink>
      </header>

      <div className="ink-overview">
        <section className="glass glass--pad">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <h2 className="panel-title">Chapters</h2>
            <Button variant="glass" size="sm" onClick={addChapter} disabled={busy}>
              <PlusIcon size={16} /> Add chapter
            </Button>
          </div>
          <ol className="ink-folios">
            {saga.folios.map((folio, index) => (
              <li key={folio.id} className="ink-folio">
                <span className="ink-folio__num">{index + 1}</span>
                <Link href={`/inkverse/sagas/${saga.id}/quill/${folio.id}`} className="ink-folio__title">
                  {folio.title}
                </Link>
                <span className={`badge ink-status ink-status--${folio.status}`}>{folioStatuses.find((s) => s.value === folio.status)?.label}</span>
                <span className="muted ink-folio__words">{formatWords(folio.wordCount)}</span>
                <span className="ink-folio__order">
                  <Button variant="ghost" icon size="sm" aria-label={`Move ${folio.title} up`} disabled={busy || index === 0} onClick={() => move(index, -1)}>
                    <ChevronUpIcon size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    icon
                    size="sm"
                    aria-label={`Move ${folio.title} down`}
                    disabled={busy || index === saga.folios.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDownIcon size={16} />
                  </Button>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <aside className="stack" style={{ gap: 20 }}>
          <form
            className="glass glass--pad"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <h2 className="panel-title" style={{ marginBottom: 16 }}>
              The essentials
            </h2>
            <SagaFields draft={draft} onChange={setDraft} idPrefix="saga" />
            <div className="row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
              <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </form>
          <div className="glass glass--pad ink-danger">
            <div>
              <strong>Delete this Saga</strong>
              <p className="muted">All chapters and snapshots go with it. This can't be undone.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <TrashIcon size={16} /> Delete
            </Button>
          </div>
        </aside>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        icon={<TrashIcon size={24} />}
        title={`Delete "${saga.title}"?`}
        description={`${saga.folioCount} ${saga.folioCount === 1 ? "chapter" : "chapters"} and ${formatWords(saga.wordCount)} will be permanently removed.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} data-autofocus>
              Keep it
            </Button>
            <Button variant="danger" loading={busy} onClick={remove}>
              Delete forever
            </Button>
          </>
        }
      />
    </div>
  );
}
