"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { SagaWorldContract, SoulContract, SoulFields } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertIcon, ArrowLeftIcon, CloseIcon, QuillIcon, RefreshIcon, SendIcon, StopIcon, TrashIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { bondKinds, soulRoles, type InkverseClient } from "@/lib/inkverse-client";
import { useToast } from "@/providers/toast-provider";
import { InkverseSkeleton } from "./creator-gate";
import { bondColor, roleColor } from "./kinship-web";
import { SagaNav } from "./saga-nav";
import { SoulForm, soulPayload } from "./soul-form";

interface Line {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "streaming" | "done" | "error";
}

let counter = 0;
const nextId = () => `iv${Date.now().toString(36)}${counter++}`;

function fieldsOf(soul: SoulContract): SoulFields {
  const { id: _id, sagaId: _saga, appearances: _a, ...fields } = soul;
  return fields;
}

/** Talk to a character in their own voice. Lis plays the Soul from its card and guards its secret. */
function SoulInterview({ api, soul, world }: { api: InkverseClient; soul: SoulContract; world: SagaWorldContract }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const bonded = world.bonds
    .filter((b) => b.fromSoulId === soul.id || b.toSoulId === soul.id)
    .map((b) => world.souls.find((s) => s.id === (b.fromSoulId === soul.id ? b.toSoulId : b.fromSoulId))?.name)
    .filter(Boolean);
  const prompts = [
    "What do you want more than anything?",
    "What are you most afraid of?",
    bonded[0] ? `What do you really think of ${bonded[0]}?` : "Who do you trust, and why?",
    "What are you hiding from me?"
  ];

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    const user: Line = { id: nextId(), role: "user", content: text, status: "done" };
    const reply: Line = { id: nextId(), role: "assistant", content: "", status: "streaming" };
    const history = lines.filter((l) => l.status === "done").map((l) => ({ role: l.role, content: l.content }));
    setLines((all) => [...all, user, reply]);
    setInput("");
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let answer = "";
    const patch = (change: Partial<Line>) => setLines((all) => all.map((l) => (l.id === reply.id ? { ...l, ...change } : l)));
    try {
      await api.interview(
        soul.id,
        [...history, { role: "user", content: text }],
        (token) => {
          answer += token;
          patch({ content: answer });
        },
        controller.signal
      );
      patch({ status: "done", content: answer.trim() || "…" });
    } catch (error) {
      patch(controller.signal.aborted ? { status: answer ? "done" : "error", content: answer || "Stopped." } : { status: "error", content: (error as Error).message });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    void ask(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <aside className="muse glass glass--strong interview" aria-label={`Interview ${soul.name}`}>
      <header className="muse__head">
        <span className="ink-avatar" style={{ borderColor: roleColor[soul.role] }} aria-hidden>
          {soul.name.slice(0, 1).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <p className="muse__title">Soul Interview</p>
          <p className="muted muse__blurb">Ask {soul.name} anything. They answer in their own voice, from their card.</p>
        </div>
        <Button variant="ghost" icon size="sm" onClick={() => setLines([])} disabled={busy || !lines.length} aria-label="Start over" title="Start over">
          <RefreshIcon size={16} />
        </Button>
      </header>
      <div className="muse__body" ref={bodyRef} aria-live="polite">
        {!lines.length ? (
          <div className="muse__intro">
            <p className="muted">Interviews help you find a character&apos;s voice before you write them. Try:</p>
            <div className="ink-chip-wrap">
              {prompts.map((p) => (
                <button key={p} type="button" className="chip" onClick={() => ask(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          lines.map((line) =>
            line.role === "user" ? (
              <p key={line.id} className="muse__ask">
                {line.content}
              </p>
            ) : (
              <article key={line.id} className={`muse__reply${line.status === "error" ? " muse__reply--error" : ""}`}>
                {line.status === "streaming" && !line.content ? (
                  <span className="typing" aria-label={`${soul.name} is answering`}>
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <div className="muse__prose">
                    <p className="interview__speaker">{soul.name}</p>
                    {line.content.split(/\n{2,}/).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </article>
            )
          )
        )}
      </div>
      <form className="composer muse__composer" onSubmit={submit}>
        <textarea
          className="composer__input"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Ask ${soul.name} a question`}
          aria-label={`Ask ${soul.name} a question`}
        />
        <div className="row" style={{ justifyContent: "flex-end" }}>
          {busy ? (
            <Button variant="glass" size="sm" onClick={() => abortRef.current?.abort()}>
              <StopIcon size={14} /> Stop
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="sm">
              <SendIcon size={14} /> Ask
            </Button>
          )}
        </div>
      </form>
    </aside>
  );
}

/** One Soul: their card, where they appear, who they are bound to, and an interview. */
export function SoulDetail({ api, sagaId, soulId }: { api: InkverseClient; sagaId: string; soulId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [world, setWorld] = useState<SagaWorldContract | null>(null);
  const [draft, setDraft] = useState<SoulFields | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function load(resetDraft: boolean) {
    api.world(sagaId).then(
      (loaded) => {
        const soul = loaded.souls.find((s) => s.id === soulId);
        if (!soul) {
          setError("This Soul no longer exists.");
          return;
        }
        setWorld(loaded);
        if (resetDraft) setDraft(fieldsOf(soul));
      },
      (err: Error) => setError(err.message)
    );
  }

  useEffect(() => load(true), [api, sagaId, soulId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="This Soul slipped away"
          description={error}
          actions={
            <ButtonLink href={`/inkverse/sagas/${sagaId}/souls`} variant="primary">
              Back to the Soulforge
            </ButtonLink>
          }
        />
      </div>
    );
  }
  const soul = world?.souls.find((s) => s.id === soulId);
  if (!world || !soul || !draft) return <InkverseSkeleton />;

  const dirty = JSON.stringify(soulPayload(draft)) !== JSON.stringify(soulPayload(fieldsOf(soul)));
  const bonds = world.bonds.filter((b) => b.fromSoulId === soul.id || b.toSoulId === soul.id);

  async function save() {
    if (!draft!.name.trim()) {
      toast({ title: "A Soul needs a name", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateSoul(soulId, soulPayload(draft!));
      setDraft(fieldsOf(updated));
      load(false);
      toast({ title: `${updated.name} saved` });
    } catch (err) {
      toast({ title: "Couldn't save", description: (err as Error).message, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api.deleteSoul(soulId);
      toast({ title: `${soul!.name} was released from the Soulforge` });
      router.push(`/inkverse/sagas/${sagaId}/souls`);
    } catch (err) {
      toast({ title: "Couldn't delete", description: (err as Error).message, tone: "error" });
    }
  }

  async function unbind(bondId: string) {
    try {
      await api.deleteBond(bondId);
      load(false);
    } catch (err) {
      toast({ title: "Couldn't remove the bond", description: (err as Error).message, tone: "error" });
    }
  }

  return (
    <div className="shell">
      <Link href={`/inkverse/sagas/${sagaId}/souls`} className="back-link">
        <ArrowLeftIcon size={16} /> The Soulforge
      </Link>
      <SagaNav sagaId={sagaId} />
      <header className="page-head ink-head">
        <div>
          <span className="eyebrow">{soulRoles.find((r) => r.value === soul.role)?.label} · {world.sagaTitle}</span>
          <h1>{soul.name}</h1>
          {soul.summary ? <p>{soul.summary}</p> : null}
        </div>
      </header>

      <div className="ink-soul-layout">
        <div className="stack" style={{ gap: 20 }}>
          <form
            className="glass glass--pad ink-panel"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <SoulForm draft={draft} onChange={setDraft} idPrefix="soul" />
            <div className="row" style={{ justifyContent: "space-between", marginTop: 20 }}>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                <TrashIcon size={16} /> Delete Soul
              </Button>
              <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
                Save card
              </Button>
            </div>
          </form>

          <section className="glass glass--pad ink-panel">
            <h2 className="panel-title">Arc Tracker</h2>
            {soul.appearances.length ? (
              <ol className="ink-appearances">
                {soul.appearances.map((a) => (
                  <li key={a.folioId}>
                    <Link href={`/inkverse/sagas/${sagaId}/quill/${a.folioId}`}>
                      <QuillIcon size={14} /> {a.title}
                    </Link>
                    <span className="muted">
                      named {a.count} {a.count === 1 ? "time" : "times"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">
                {soul.name} hasn&apos;t appeared in a chapter yet. Type <kbd>@</kbd> in the Quill Room to bring them in.
              </p>
            )}
          </section>

          <section className="glass glass--pad ink-panel">
            <h2 className="panel-title">Bonds</h2>
            {bonds.length ? (
              <ul className="ink-bonds">
                {bonds.map((bond) => {
                  const otherId = bond.fromSoulId === soul.id ? bond.toSoulId : bond.fromSoulId;
                  const other = world.souls.find((s) => s.id === otherId);
                  return (
                    <li key={bond.id}>
                      <i style={{ background: bondColor[bond.kind] }} />
                      <span>
                        <strong>{bondKinds.find((k) => k.value === bond.kind)?.label}</strong> of{" "}
                        <Link href={`/inkverse/sagas/${sagaId}/souls/${otherId}`}>{other?.name}</Link>
                        {bond.note ? <span className="muted"> · {bond.note}</span> : null}
                      </span>
                      <Button variant="ghost" icon size="sm" onClick={() => unbind(bond.id)} aria-label={`Remove bond with ${other?.name}`}>
                        <CloseIcon size={14} />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">No bonds yet. Add them from the Kinship Web in the Soulforge.</p>
            )}
          </section>
        </div>

        <SoulInterview key={soul.id} api={api} soul={soul} world={world} />
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        icon={<TrashIcon size={24} />}
        title={`Delete ${soul.name}?`}
        description="Their card and bonds will be removed. Your chapters are not changed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} data-autofocus>
              Keep them
            </Button>
            <Button variant="danger" onClick={remove}>
              Delete Soul
            </Button>
          </>
        }
      />
    </div>
  );
}
