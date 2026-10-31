"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { FolioContract, FolioSnapshotContract, FolioStatus, SagaDetailContract, SagaWorldContract } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertIcon, ArrowLeftIcon, ClockIcon, FocusIcon, PlusIcon, SparkleIcon, TrashIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { folioStatuses, formatWords, type InkverseClient } from "@/lib/inkverse-client";
import { useToast } from "@/providers/toast-provider";
import { InkverseSkeleton } from "./creator-gate";
import { timeAgo } from "./inkwell";
import { CastPanel, useMentionMenu } from "./mentions";
import { cleanProse, MusePanel, type EditorContext, type LiveWrite, type QueuedWrite } from "./muse-panel";

type SaveState = "saved" | "unsaved" | "saving" | "error";
const AUTOSAVE_MS = 1200;

const saveLabels: Record<SaveState, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Not saved. Retrying on your next edit"
};

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function SnapshotsModal({
  api,
  folio,
  open,
  onClose,
  beforeRestore,
  onRestored
}: {
  api: InkverseClient;
  folio: FolioContract;
  open: boolean;
  onClose: () => void;
  beforeRestore: () => Promise<boolean>;
  onRestored: (folio: FolioContract) => void;
}) {
  const toast = useToast();
  const [snapshots, setSnapshots] = useState<FolioSnapshotContract[] | null>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  // Bumped by every list update, so a slow initial load can't overwrite a newer list.
  const versionRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    const version = ++versionRef.current;
    const apply = (list: FolioSnapshotContract[]) => version === versionRef.current && setSnapshots(list);
    api.snapshots(folio.id).then(apply, () => apply([]));
  }, [api, folio.id, open]);

  async function take() {
    setBusy("take");
    try {
      if (!(await beforeRestore())) throw new Error("Your latest words haven't saved yet.");
      const list = await api.createSnapshot(folio.id, label.trim() || undefined);
      versionRef.current++;
      setSnapshots(list);
      setLabel("");
      toast({ title: "Snapshot taken" });
    } catch (err) {
      toast({ title: "Couldn't take a snapshot", description: (err as Error).message, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function restore(snapshot: FolioSnapshotContract) {
    setBusy(snapshot.id);
    try {
      if (!(await beforeRestore())) throw new Error("Your latest words haven't saved yet.");
      onRestored(await api.restoreSnapshot(folio.id, snapshot.id));
      toast({ title: "Snapshot restored", description: "The text you replaced was kept as a new snapshot." });
      onClose();
    } catch (err) {
      toast({ title: "Couldn't restore", description: (err as Error).message, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      icon={<ClockIcon size={24} />}
      title="Snapshots"
      description="Freeze this chapter as it is now, or travel back to an earlier version. Restoring never loses work."
    >
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          void take();
        }}
      >
        <input className="input" value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional), e.g. Before the big rewrite" aria-label="Snapshot label" />
        <Button type="submit" variant="primary" loading={busy === "take"}>
          Take snapshot
        </Button>
      </form>
      <ul className="ink-snapshots">
        {snapshots === null ? (
          <li className="muted">Loading…</li>
        ) : !snapshots.length ? (
          <li className="muted">No snapshots yet.</li>
        ) : (
          snapshots.map((snapshot) => (
            <li key={snapshot.id} className="ink-snapshot">
              <div>
                <strong>{snapshot.label || "Untitled snapshot"}</strong>
                <p className="muted">
                  {timeAgo(snapshot.createdAt)} · {formatWords(snapshot.wordCount)}
                </p>
              </div>
              <Button variant="glass" size="sm" loading={busy === snapshot.id} disabled={Boolean(busy)} onClick={() => restore(snapshot)}>
                Restore
              </Button>
            </li>
          ))
        )}
      </ul>
    </Modal>
  );
}

/** The writing studio: chapter list, a distraction-free page, autosave and Lis the Muse beside it. */
export function QuillRoom({ api, sagaId, folioId }: { api: InkverseClient; sagaId: string; folioId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [saga, setSaga] = useState<SagaDetailContract | null>(null);
  const [folio, setFolio] = useState<FolioContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [focus, setFocus] = useState(false);
  const [museOpen, setMuseOpen] = useState(true);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectionWords, setSelectionWords] = useState(0);
  const [museBusy, setMuseBusy] = useState(false);
  const [liveWriting, setLiveWriting] = useState(false);
  const [loadingFolio, setLoadingFolio] = useState(true);
  const [queuedWrite, setQueuedWrite] = useState<QueuedWrite | null>(null);
  const pendingIdeaRef = useRef<{ folioId: string; prompt: string } | null>(null);
  const [world, setWorld] = useState<SagaWorldContract | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const folioRef = useRef<FolioContract | null>(null);
  const contentRef = useRef("");
  const savedRef = useRef("");
  const timerRef = useRef<number | undefined>(undefined);
  const pendingRef = useRef<Promise<boolean> | null>(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  /** Saves whatever is on the page now; resolves true once the server has the latest words. */
  const flush = useCallback(async (): Promise<boolean> => {
    window.clearTimeout(timerRef.current);
    if (pendingRef.current) await pendingRef.current;
    const target = folioRef.current;
    const value = contentRef.current;
    if (!target || value === savedRef.current) return true;

    setSaveState("saving");
    const request = api.updateFolio(target.id, { content: value }).then(
      (updated) => {
        if (folioRef.current?.id === target.id) savedRef.current = value;
        setSaga((s) => s && { ...s, folios: s.folios.map((f) => (f.id === target.id ? { ...f, wordCount: updated.wordCount, updatedAt: updated.updatedAt } : f)) });
        setSaveState(contentRef.current === value ? "saved" : "unsaved");
        return true;
      },
      () => {
        setSaveState("error");
        return false;
      }
    );
    pendingRef.current = request;
    const ok = await request;
    pendingRef.current = null;
    return ok && contentRef.current === savedRef.current;
  }, [api]);

  const schedule = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void flush(), AUTOSAVE_MS);
  }, [flush]);

  // Load the Saga once; reload just the chapter when the writer switches chapters.
  useEffect(() => {
    api.saga(sagaId).then(setSaga, (err: Error) => setError(err.message));
  }, [api, sagaId]);

  // Souls and places power @/# mentions and the cast panel; refresh when the writer comes back from the Soulforge tab.
  useEffect(() => {
    const load = () => api.world(sagaId).then(setWorld, () => undefined);
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [api, sagaId]);

  useEffect(() => {
    let cancelled = false;
    // Keep the previous chapter on screen (read-only) until the next one arrives, so the Muse stays put.
    setLoadingFolio(true);
    api.folio(folioId).then(
      (loaded) => {
        if (cancelled) return;
        folioRef.current = loaded;
        contentRef.current = savedRef.current = loaded.content;
        selectionRef.current = { start: loaded.content.length, end: loaded.content.length };
        setFolio(loaded);
        setContent(loaded.content);
        setTitle(loaded.title);
        setSaveState("saved");
        setSelectionWords(0);
        setLoadingFolio(false);
        const idea = pendingIdeaRef.current;
        if (idea?.folioId === loaded.id) {
          pendingIdeaRef.current = null;
          setQueuedWrite({ key: `${loaded.id}-${Date.now()}`, prompt: idea.prompt });
        }
        // A Shard sent from the Loom arrives as ?lis=<prompt>: write it once, then tidy the URL.
        const fromLoom = new URLSearchParams(window.location.search).get("lis");
        if (fromLoom) {
          window.history.replaceState(null, "", window.location.pathname);
          setQueuedWrite({ key: `${loaded.id}-loom`, prompt: fromLoom });
        }
      },
      (err: Error) => !cancelled && setError(err.message)
    );
    return () => {
      cancelled = true;
    };
  }, [api, folioId]);

  // Never lose words: save on the way out, and warn if the tab closes mid-save.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (contentRef.current !== savedRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      void flush();
    };
  }, [flush]);

  function updateContent(next: string) {
    contentRef.current = next;
    setContent(next);
    setSaveState("unsaved");
    schedule();
  }

  function trackSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    selectionRef.current = { start: editor.selectionStart, end: editor.selectionEnd };
    setSelectionWords(countWords(editor.value.slice(editor.selectionStart, editor.selectionEnd)));
  }

  function placeCaret(position: number, end = position) {
    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      editor.setSelectionRange(position, end);
      selectionRef.current = { start: position, end };
    });
  }

  function getContext(): EditorContext {
    const text = contentRef.current;
    const { start, end } = selectionRef.current;
    return { before: text.slice(0, start), cursor: start, selection: { start, end, text: text.slice(start, end) }, full: text };
  }

  const mentions = useMentionMenu({
    editorRef,
    world,
    insert: (start, end, name) => {
      const text = contentRef.current;
      updateContent(text.slice(0, start) + name + text.slice(end));
      placeCaret(start + name.length);
    }
  });

  /** Streams Lis's prose into the page at the cursor, and remembers how to take it back out. */
  function startWrite(context: EditorContext): LiveWrite {
    const text = contentRef.current;
    const targetId = folioRef.current?.id;
    // If the writer kept typing, continue from the same words rather than a stale offset.
    const at = text.slice(0, context.cursor) === context.before ? context.cursor : text.length;
    const head = text.slice(0, at);
    const tail = text.slice(at);
    const glue = !head.trim() ? "" : /\n\s*$/.test(head) ? "" : "\n\n";
    const atEnd = !tail.trim();
    let raw = "";
    let written = "";
    let lastSave = Date.now();
    setLiveWriting(true);

    const show = (prose: string) => {
      written = prose;
      updateContent(head + glue + prose + tail);
      if (!atEnd) return;
      // Keep the newest line in view while the page grows.
      requestAnimationFrame(() => {
        const editor = editorRef.current;
        // The empty editor already reaches past the fold (min-height), so only follow real text.
        if (!editor || editor.offsetHeight <= parseFloat(getComputedStyle(editor).minHeight) + 4) return;
        const bottom = editor.getBoundingClientRect().bottom;
        if (bottom > window.innerHeight - 80) window.scrollBy({ top: bottom - window.innerHeight + 120 });
      });
    };

    return {
      append(chunk) {
        raw += chunk;
        show(raw.replace(/^\s*("""|")\s*/, ""));
        // Each token resets the autosave timer, so save on a steady beat while Lis writes.
        if (Date.now() - lastSave > 5000) {
          lastSave = Date.now();
          void flush();
        }
      },
      finish() {
        const prose = cleanProse(raw);
        show(prose);
        setLiveWriting(false);
        placeCaret(at + glue.length + prose.length);
        return prose ? prose.split(/\s+/).length : 0;
      },
      undo() {
        const now = contentRef.current;
        const expected = head + glue + written + tail;
        if (folioRef.current?.id !== targetId || !written) return false;
        if (now === expected) {
          updateContent(head + tail);
          placeCaret(at);
          return true;
        }
        const found = now.indexOf(glue + written);
        if (found < 0) return false;
        updateContent(now.slice(0, found) + now.slice(found + glue.length + written.length));
        placeCaret(found);
        return true;
      }
    };
  }

  async function newChapterFromIdea(ideaTitle: string, prompt: string) {
    try {
      if (!(await flush())) throw new Error("Your latest words haven't saved yet.");
      const created = await api.createFolio(sagaId, ideaTitle.slice(0, 120));
      setSaga((s) => s && { ...s, folios: [...s.folios, created], folioCount: s.folioCount + 1 });
      pendingIdeaRef.current = { folioId: created.id, prompt };
      toast({ title: `"${created.title}" added to your Saga`, description: "Lis is writing it now." });
      router.push(`/inkverse/sagas/${sagaId}/quill/${created.id}`);
    } catch (err) {
      toast({ title: "Couldn't add the chapter", description: (err as Error).message, tone: "error" });
    }
  }

  function replaceSuggestion(prose: string, context: EditorContext) {
    const text = contentRef.current;
    const { start, end, text: original } = context.selection;
    const at = text.slice(start, end) === original ? start : text.indexOf(original);
    if (at < 0) {
      toast({ title: "That passage has changed", description: "Copy Lis's version and paste it where you want it.", tone: "info" });
      return false;
    }
    updateContent(text.slice(0, at) + prose + text.slice(at + original.length));
    placeCaret(at, at + prose.length);
    return true;
  }

  async function saveMeta(change: { title?: string; status?: FolioStatus }) {
    if (!folio) return;
    try {
      const updated = await api.updateFolio(folio.id, change);
      const merged = { ...updated, content: contentRef.current };
      folioRef.current = merged;
      setFolio(merged);
      setTitle(updated.title);
      setSaga((s) => s && { ...s, folios: s.folios.map((f) => (f.id === updated.id ? { ...f, title: updated.title, status: updated.status } : f)) });
    } catch (err) {
      setTitle(folio.title);
      toast({ title: "Couldn't save that change", description: (err as Error).message, tone: "error" });
    }
  }

  async function goTo(id: string) {
    if (id === folioId) return;
    if (!(await flush())) {
      toast({ title: "Your latest words haven't saved yet", description: "Check your connection, then try again.", tone: "error" });
      return;
    }
    router.push(`/inkverse/sagas/${sagaId}/quill/${id}`);
  }

  async function addChapter() {
    try {
      await flush();
      const created = await api.createFolio(sagaId);
      setSaga((s) => s && { ...s, folios: [...s.folios, created], folioCount: s.folioCount + 1 });
      router.push(`/inkverse/sagas/${sagaId}/quill/${created.id}`);
    } catch (err) {
      toast({ title: "Couldn't add a chapter", description: (err as Error).message, tone: "error" });
    }
  }

  async function deleteChapter() {
    if (!saga || !folio) return;
    try {
      window.clearTimeout(timerRef.current);
      await api.deleteFolio(folio.id);
      // Nothing left to save for a deleted chapter.
      savedRef.current = contentRef.current;
      const remaining = saga.folios.filter((f) => f.id !== folio.id);
      setSaga({ ...saga, folios: remaining, folioCount: remaining.length });
      setConfirmDelete(false);
      toast({ title: `"${folio.title}" was deleted` });
      router.push(`/inkverse/sagas/${sagaId}/quill/${remaining[0].id}`);
    } catch (err) {
      toast({ title: "Couldn't delete the chapter", description: (err as Error).message, tone: "error" });
    }
  }

  function onEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (mentions.onKeyDown(event)) {
      event.preventDefault();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void flush();
    }
  }

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="This chapter slipped out of reach"
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
  if (!saga || !folio) return <InkverseSkeleton />;

  const index = saga.folios.findIndex((f) => f.id === folio.id);
  const words = countWords(content);

  return (
    <div className={`quill${focus ? " quill--focus" : ""}${museOpen && !focus ? " quill--muse" : ""}`}>
      <aside className="quill__chapters glass" aria-label="Chapters">
        <Link href={`/inkverse/sagas/${saga.id}`} className="quill__saga">
          <ArrowLeftIcon size={14} />
          <span>{saga.title}</span>
        </Link>
        <ol>
          {saga.folios.map((f, i) => (
            <li key={f.id}>
              <button
                type="button"
                className="quill__chapter"
                aria-current={f.id === folio.id ? "page" : undefined}
                onClick={() => goTo(f.id)}
                disabled={museBusy && f.id !== folio.id}
                title={museBusy ? "Lis is working. Switch chapters when she's done." : undefined}
              >
                <span className="quill__chapter-num">{i + 1}</span>
                <span className="quill__chapter-title">{f.title}</span>
                <span className={`ink-dot ink-dot--${f.status}`} aria-label={f.status} />
              </button>
            </li>
          ))}
        </ol>
        <Button variant="ghost" size="sm" block onClick={addChapter} disabled={museBusy}>
          <PlusIcon size={16} /> Add chapter
        </Button>
        <CastPanel sagaId={saga.id} world={world} content={content} />
      </aside>

      <main className="quill__page">
        <div className="quill__toolbar glass">
          <span className="muted quill__crumb">Chapter {index + 1}</span>
          <select
            className="input quill__status"
            value={folio.status}
            onChange={(e) => saveMeta({ status: e.target.value as FolioStatus })}
            aria-label="Chapter status"
          >
            {folioStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <span className={`quill__save quill__save--${saveState}`} role="status">
            {saveLabels[saveState]}
          </span>
          <span className="muted quill__words">{formatWords(words)}</span>
          <span className="quill__tools">
            <Button variant="ghost" icon size="sm" onClick={() => setSnapshotsOpen(true)} aria-label="Snapshots" title="Snapshots">
              <ClockIcon size={18} />
            </Button>
            <Button variant="ghost" icon size="sm" onClick={() => setFocus((v) => !v)} aria-label={focus ? "Leave focus mode" : "Focus mode"} title="Focus mode" active={focus}>
              <FocusIcon size={18} />
            </Button>
            <Button
              variant="ghost"
              icon
              size="sm"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete chapter"
              title={saga.folios.length > 1 ? "Delete chapter" : "A Saga needs at least one chapter"}
              disabled={saga.folios.length <= 1}
            >
              <TrashIcon size={18} />
            </Button>
            {!museOpen || focus ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setFocus(false);
                  setMuseOpen(true);
                }}
              >
                <SparkleIcon size={16} /> Muse
              </Button>
            ) : null}
          </span>
        </div>

        <article className="quill__sheet">
          <input
            className="quill__title"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title.trim() !== folio.title ? saveMeta({ title: title.trim() }) : setTitle(folio.title)}
            onKeyDown={(e) => e.key === "Enter" && editorRef.current?.focus()}
            aria-label="Chapter title"
          />
          <textarea
            ref={editorRef}
            className="quill__editor"
            value={content}
            onChange={(e) => {
              updateContent(e.target.value);
              trackSelection();
              mentions.refresh();
            }}
            onSelect={() => {
              trackSelection();
              mentions.refresh();
            }}
            onBlur={mentions.close}
            onKeyDown={onEditorKeyDown}
            readOnly={liveWriting || loadingFolio}
            aria-busy={liveWriting || undefined}
            placeholder="Once upon a time… or begin anywhere. Lis is beside you if the page feels too quiet."
            aria-label={`Text of ${folio.title}`}
            spellCheck
          />
          {mentions.element}
        </article>
      </main>

      {museOpen && !focus ? (
        <MusePanel
          api={api}
          sagaId={saga.id}
          folioId={folio.id}
          chapterTitle={folio.title}
          selectionWords={selectionWords}
          queuedWrite={queuedWrite}
          onQueuedWriteTaken={() => setQueuedWrite(null)}
          getContext={getContext}
          startWrite={startWrite}
          onReplace={replaceSuggestion}
          onNewChapter={newChapterFromIdea}
          onBusyChange={setMuseBusy}
          onClose={() => setMuseOpen(false)}
        />
      ) : null}

      <SnapshotsModal
        api={api}
        folio={folio}
        open={snapshotsOpen}
        onClose={() => setSnapshotsOpen(false)}
        beforeRestore={flush}
        onRestored={(restored) => {
          folioRef.current = restored;
          contentRef.current = savedRef.current = restored.content;
          setFolio(restored);
          setContent(restored.content);
          setSaveState("saved");
        }}
      />

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        icon={<TrashIcon size={24} />}
        title={`Delete "${folio.title}"?`}
        description={`${formatWords(words)} and this chapter's snapshots will be permanently removed.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} data-autofocus>
              Keep it
            </Button>
            <Button variant="danger" onClick={deleteChapter}>
              Delete chapter
            </Button>
          </>
        }
      />
    </div>
  );
}
