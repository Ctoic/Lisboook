"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { BondKind, SagaWorldContract, SoulFields } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertIcon, ArrowLeftIcon, PlusIcon, SparkleIcon, UserIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { bondKinds, emptySoul, soulRoles, type InkverseClient } from "@/lib/inkverse-client";
import { useToast } from "@/providers/toast-provider";
import { InkverseSkeleton } from "./creator-gate";
import { KinshipWeb, roleColor } from "./kinship-web";
import { SagaNav } from "./saga-nav";
import { SoulForm, soulPayload } from "./soul-form";

/** Describe a character in a sentence and Lis drafts the card; the writer reviews it before anything is saved. */
function NewSoulModal({ api, sagaId, open, onClose }: { api: InkverseClient; sagaId: string; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<SoulFields | null>(null);
  const [forging, setForging] = useState(false);
  const [saving, setSaving] = useState(false);

  async function forge() {
    if (prompt.trim().length < 3) {
      toast({ title: "Describe your character first", description: "A sentence is enough: who they are and what they want.", tone: "info" });
      return;
    }
    setForging(true);
    try {
      setDraft(await api.forgeSoul(sagaId, prompt.trim()));
    } catch (err) {
      toast({ title: "Lis couldn't forge that Soul", description: (err as Error).message, tone: "error" });
    } finally {
      setForging(false);
    }
  }

  async function save() {
    if (!draft?.name.trim()) {
      toast({ title: "Give your Soul a name", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const soul = await api.createSoul(sagaId, soulPayload(draft));
      router.push(`/inkverse/sagas/${sagaId}/souls/${soul.id}`);
    } catch (err) {
      toast({ title: "Couldn't save the Soul", description: (err as Error).message, tone: "error" });
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      icon={<UserIcon size={24} />}
      title={draft ? "Review your Soul" : "Forge a new Soul"}
      description={draft ? "Change anything you like. Nothing is saved until you say so." : "Describe a character and Lis drafts the whole card, or start from a blank one."}
      footer={
        draft ? (
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Back
            </Button>
            <Button variant="primary" loading={saving} onClick={save}>
              Save Soul
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setDraft({ ...emptySoul })} disabled={forging}>
              Start blank
            </Button>
            <Button variant="primary" loading={forging} onClick={forge}>
              <SparkleIcon size={16} /> {forging ? "Lis is forging…" : "Forge with Lis"}
            </Button>
          </>
        )
      }
    >
      {draft ? (
        <div className="ink-modal-scroll">
          <SoulForm draft={draft} onChange={setDraft} idPrefix="new-soul" />
        </div>
      ) : (
        <div className="field">
          <label className="field__label" htmlFor="soul-prompt">
            Who are they?
          </label>
          <textarea
            id="soul-prompt"
            className="input"
            rows={4}
            maxLength={600}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Veyra, the violet twin dragon who hides in the shadows and wants to be free of her brother."
            data-autofocus
            disabled={forging}
          />
          <span className="field__hint">{forging ? "This takes Lis about half a minute." : "Lis keeps the names and facts you give, and invents the rest."}</span>
        </div>
      )}
    </Modal>
  );
}

function BondForm({ api, world, onSaved }: { api: InkverseClient; world: SagaWorldContract; onSaved: () => void }) {
  const toast = useToast();
  const [from, setFrom] = useState(world.souls[0]?.id ?? "");
  const [to, setTo] = useState(world.souls[1]?.id ?? "");
  const [kind, setKind] = useState<BondKind>("ally");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!from || !to || from === to) {
      toast({ title: "Pick two different Souls", tone: "info" });
      return;
    }
    setSaving(true);
    try {
      await api.saveBond(world.sagaId, { fromSoulId: from, toSoulId: to, kind, note: note.trim() || undefined });
      setNote("");
      onSaved();
    } catch (err) {
      toast({ title: "Couldn't save the bond", description: (err as Error).message, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="ink-bond-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <select className="input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="First Soul">
        {world.souls.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <select className="input" value={kind} onChange={(e) => setKind(e.target.value as BondKind)} aria-label="Bond">
        {bondKinds.map((k) => (
          <option key={k.value} value={k.value}>
            {k.label} of
          </option>
        ))}
      </select>
      <select className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Second Soul">
        {world.souls.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input className="input" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Bond note" />
      <Button type="submit" variant="glass" loading={saving}>
        Bind
      </Button>
    </form>
  );
}

/** The Soulforge: every character in the Saga, and the web of bonds between them. */
export function Soulforge({ api, sagaId }: { api: InkverseClient; sagaId: string }) {
  const [world, setWorld] = useState<SagaWorldContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    api.world(sagaId).then(setWorld, (err: Error) => setError(err.message));
  }

  useEffect(load, [api, sagaId]);

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="The Soulforge is cold"
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

  return (
    <div className="shell">
      <Link href={`/inkverse/sagas/${sagaId}`} className="back-link">
        <ArrowLeftIcon size={16} /> {world.sagaTitle}
      </Link>
      <SagaNav sagaId={sagaId} />
      <header className="page-head ink-head">
        <div>
          <span className="eyebrow">The Soulforge</span>
          <h1>
            The souls of <span className="gradient-text">{world.sagaTitle}</span>
          </h1>
          <p>Give your characters faces, wants and secrets. Lis reads these cards every time she writes, and keeps everyone true to themselves.</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setCreating(true)}>
          <PlusIcon size={18} /> New Soul
        </Button>
      </header>

      {!world.souls.length ? (
        <EmptyState
          icon={<UserIcon size={28} />}
          title="No Souls forged yet"
          description="Describe your hero in a sentence and Lis will draft their whole card: looks, voice, fears, secrets and arc."
          actions={
            <Button variant="primary" onClick={() => setCreating(true)}>
              <SparkleIcon size={18} /> Forge your first Soul
            </Button>
          }
        />
      ) : (
        <div className="stack" style={{ gap: 28, marginBottom: 64 }}>
          {world.souls.length > 1 ? (
            <section className="glass glass--pad ink-panel">
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <h2 className="panel-title" style={{ margin: 0 }}>
                  Kinship Web
                </h2>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {world.bonds.length} {world.bonds.length === 1 ? "bond" : "bonds"}
                </span>
              </div>
              <KinshipWeb sagaId={sagaId} souls={world.souls} bonds={world.bonds} />
              <BondForm api={api} world={world} onSaved={load} />
            </section>
          ) : null}

          <section>
            <div className="ink-grid">
              {world.souls.map((soul) => {
                const chapters = soul.appearances.length;
                return (
                  <Link key={soul.id} href={`/inkverse/sagas/${sagaId}/souls/${soul.id}`} className="ink-saga glass glass--interactive">
                    <div className="row" style={{ gap: 12 }}>
                      <span className="ink-avatar" style={{ borderColor: roleColor[soul.role] }}>
                        {soul.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ink-saga__title">{soul.name}</h3>
                        <span className="muted" style={{ fontSize: "0.82rem" }}>
                          {soulRoles.find((r) => r.value === soul.role)?.label}
                          {soul.aliases.length ? ` · ${soul.aliases.join(", ")}` : ""}
                        </span>
                      </div>
                    </div>
                    <p className="ink-saga__logline muted">{soul.summary || "No description yet."}</p>
                    <p className="ink-saga__meta muted">
                      {chapters ? `Appears in ${chapters} ${chapters === 1 ? "chapter" : "chapters"}` : "Not in any chapter yet"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {creating ? <NewSoulModal api={api} sagaId={sagaId} open={creating} onClose={() => setCreating(false)} /> : null}
    </div>
  );
}
