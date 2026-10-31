"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HearthCasting, HearthVoice, PressContract } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertIcon, ArrowLeftIcon, BookIcon, CheckIcon, HeadphonesIcon, InfoIcon, SparkleIcon, VolumeIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { formatWords, type InkverseClient } from "@/lib/inkverse-client";
import { speakSample, useVoices, voiceFor } from "@/lib/hearth";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { BookCover, coverStyles } from "./book-cover";
import { InkverseSkeleton } from "./creator-gate";
import { SagaNav } from "./saga-nav";

function VoicePicker({
  label,
  voice,
  voices,
  sample,
  onChange
}: {
  label: string;
  voice: HearthVoice;
  voices: SpeechSynthesisVoice[];
  sample: string;
  onChange: (voice: HearthVoice) => void;
}) {
  return (
    <div className="hearth-voice">
      <span className="hearth-voice__label">{label}</span>
      <select className="input" value={voice.voiceName ?? ""} onChange={(e) => onChange({ ...voice, voiceName: e.target.value || null })} aria-label={`Voice for ${label}`}>
        <option value="">Device default</option>
        {voices.map((v) => (
          <option key={v.name} value={v.name}>
            {v.name}
          </option>
        ))}
      </select>
      <label className="hearth-voice__range">
        Pitch
        <input type="range" className="range" min={0.5} max={2} step={0.05} value={voice.pitch} onChange={(e) => onChange({ ...voice, pitch: Number(e.target.value) })} />
      </label>
      <Button variant="ghost" icon size="sm" onClick={() => speakSample(sample, voice, voices)} aria-label={`Hear ${label}`} title="Hear this voice">
        <VolumeIcon size={16} />
      </Button>
    </div>
  );
}

/** The Lantern Press: dress the Saga for readers, cast the Hearth's voices, and publish to the Debut Shelf. */
export function LanternPress({ api, sagaId }: { api: InkverseClient; sagaId: string }) {
  const toast = useToast();
  const { session } = useAuth();
  const voices = useVoices();
  const [press, setPress] = useState<PressContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tagline, setTagline] = useState("");
  const [blurb, setBlurb] = useState("");
  const [coverStyle, setCoverStyle] = useState(0);
  const [hearth, setHearth] = useState<HearthCasting>({ narrator: { voiceName: null, pitch: 1, rate: 1 }, souls: {} });
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  function adopt(loaded: PressContract) {
    setPress(loaded);
    setTagline(loaded.tagline ?? "");
    setBlurb(loaded.blurb ?? "");
    setCoverStyle(loaded.coverStyle);
    setHearth(loaded.hearth ?? { narrator: { voiceName: null, pitch: 1, rate: 1 }, souls: {} });
  }

  useEffect(() => {
    api.press(sagaId).then(adopt, (err: Error) => setError(err.message));
  }, [api, sagaId]);

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="The press is jammed"
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
  if (!press) return <InkverseSkeleton />;

  const author = session?.user.displayName ?? "You";
  const written = press.chapters.filter((c) => c.wordCount > 0);
  const words = written.reduce((sum, c) => sum + c.wordCount, 0);
  const notDone = written.filter((c) => c.status !== "done").length;
  const dirty =
    tagline !== (press.tagline ?? "") ||
    blurb !== (press.blurb ?? "") ||
    coverStyle !== press.coverStyle ||
    JSON.stringify(hearth) !== JSON.stringify(press.hearth ?? { narrator: { voiceName: null, pitch: 1, rate: 1 }, souls: {} });
  const checklist = [
    { ok: Boolean(press.title.trim()), label: "A title", hint: press.title },
    { ok: written.length > 0, label: "At least one written chapter", hint: `${written.length} written · ${formatWords(words)}` },
    { ok: Boolean(blurb.trim()), label: "A blurb for the back cover", hint: blurb.trim() ? "Ready" : "Write one, or let Lis draft it" },
    { ok: notDone === 0 && written.length > 0, label: "Every chapter marked Done", hint: notDone ? `${notDone} still in draft (optional)` : "All done", optional: true },
    { ok: press.souls.length > 0, label: "Characters in the Soulforge", hint: press.souls.length ? `${press.souls.length} Souls get their own voices` : "Optional, but gives the Hearth its voices", optional: true }
  ];
  const ready = checklist.filter((c) => !c.optional).every((c) => c.ok);

  async function save(silent = false) {
    setSaving(true);
    try {
      adopt(await api.savePress(sagaId, { tagline: tagline.trim(), blurb: blurb.trim(), coverStyle, hearth }));
      if (!silent) toast({ title: "Press settings saved" });
      return true;
    } catch (err) {
      toast({ title: "Couldn't save", description: (err as Error).message, tone: "error" });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function draft() {
    setDrafting(true);
    try {
      const copy = await api.draftBlurb(sagaId);
      setTagline(copy.tagline);
      setBlurb(copy.blurb);
      toast({ title: "Lis drafted your cover copy", description: "Edit it until it sounds like you, then save." });
    } catch (err) {
      toast({ title: "Lis couldn't draft it", description: (err as Error).message, tone: "error" });
    } finally {
      setDrafting(false);
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      if (dirty && !(await save(true))) return;
      adopt(await api.publish(sagaId));
      toast({ title: "The lantern is lit", description: "Your book is on the Debut Shelf, and Lis can read it aloud." });
    } catch (err) {
      toast({ title: "Not quite ready", description: (err as Error).message, tone: "error" });
    } finally {
      setPublishing(false);
    }
  }

  async function unpublish() {
    try {
      adopt(await api.unpublish(sagaId));
      setConfirmUnpublish(false);
      toast({ title: "Taken off the Debut Shelf", description: "It's private again. You can republish any time." });
    } catch (err) {
      toast({ title: "Couldn't unpublish", description: (err as Error).message, tone: "error" });
    }
  }

  const setVoice = (soulId: string | null, voice: HearthVoice) =>
    setHearth((h) => (soulId ? { ...h, souls: { ...h.souls, [soulId]: voice } } : { ...h, narrator: voice }));

  return (
    <div className="shell">
      <Link href={`/inkverse/sagas/${sagaId}`} className="back-link">
        <ArrowLeftIcon size={16} /> {press.title}
      </Link>
      <SagaNav sagaId={sagaId} />
      <header className="page-head ink-head">
        <div>
          <span className="eyebrow">The Lantern Press</span>
          <h1>{press.publishedAt ? "Your lantern is lit" : "Light the lantern"}</h1>
          <p>
            {press.publishedAt
              ? "Your book is on the Debut Shelf. Anyone can open it, and Lis reads it aloud in the voices you cast."
              : "Dress your Saga for readers, cast the voices Lis reads it in, and publish it to the Debut Shelf."}
          </p>
        </div>
        {press.publishedAt && press.slug ? (
          <ButtonLink href={`/inkverse/library/${press.slug}`} variant="primary" size="lg">
            <BookIcon size={18} /> Open on the Debut Shelf
          </ButtonLink>
        ) : null}
      </header>

      <div className="press">
        <section className="press__cover">
          <BookCover title={press.title} author={author} styleIndex={coverStyle} tagline={tagline} size="lg" />
          <div className="press__swatches" role="radiogroup" aria-label="Cover design">
            {coverStyles.map((style, i) => (
              <button
                key={style.name}
                type="button"
                role="radio"
                aria-checked={coverStyle === i}
                aria-label={style.name}
                title={style.name}
                className="press__swatch"
                style={{ background: `linear-gradient(150deg, ${style.to}, ${style.from})` }}
                onClick={() => setCoverStyle(i)}
              />
            ))}
          </div>
        </section>

        <div className="stack" style={{ gap: 20 }}>
          <section className="glass glass--pad ink-panel">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <h2 className="panel-title" style={{ margin: 0 }}>
                Cover copy
              </h2>
              <Button variant="glass" size="sm" onClick={draft} loading={drafting}>
                <SparkleIcon size={14} /> {drafting ? "Lis is writing…" : "Draft with Lis"}
              </Button>
            </div>
            <div className="stack" style={{ gap: 14 }}>
              <div className="field">
                <label className="field__label" htmlFor="press-tagline">
                  Tagline
                </label>
                <input id="press-tagline" className="input" value={tagline} maxLength={160} onChange={(e) => setTagline(e.target.value)} placeholder="Two dragons. One contract. No way down." />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="press-blurb">
                  Blurb
                </label>
                <textarea id="press-blurb" className="input" rows={6} maxLength={1200} value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="What readers see on the back cover." />
              </div>
            </div>
          </section>

          <section className="glass glass--pad ink-panel">
            <h2 className="panel-title">
              <span className="row" style={{ gap: 8 }}>
                <HeadphonesIcon size={18} /> The Hearth: voice casting
              </span>
            </h2>
            <p className="muted" style={{ fontSize: "0.88rem", marginBottom: 12 }}>
              Lis reads narration in the narrator&apos;s voice and each character&apos;s dialogue in theirs. Voices come from the reader&apos;s device; where a named voice is missing, the pitch still sets characters apart.
            </p>
            <div className="stack" style={{ gap: 8 }}>
              <VoicePicker label="Narrator" voice={hearth.narrator} voices={voices} sample={`This is ${press.title}.`} onChange={(v) => setVoice(null, v)} />
              {press.souls.map((soul) => (
                <VoicePicker
                  key={soul.id}
                  label={soul.name}
                  voice={hearth.souls[soul.id] ?? voiceFor(hearth, soul.id)}
                  voices={voices}
                  sample={`I am ${soul.name}.`}
                  onChange={(v) => setVoice(soul.id, v)}
                />
              ))}
            </div>
          </section>

          <section className="glass glass--pad ink-panel">
            <h2 className="panel-title">Ready to publish?</h2>
            <ul className="press__checklist">
              {checklist.map((item) => (
                <li key={item.label} data-ok={item.ok || undefined}>
                  <span className="press__check">{item.ok ? <CheckIcon size={14} /> : item.optional ? <InfoIcon size={14} /> : <AlertIcon size={14} />}</span>
                  <span>
                    <strong>{item.label}</strong>
                    <span className="muted"> · {item.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="row" style={{ justifyContent: "space-between", marginTop: 18, gap: 10, flexWrap: "wrap" }}>
              <Button variant="glass" onClick={() => save()} loading={saving} disabled={!dirty}>
                Save changes
              </Button>
              {press.publishedAt ? (
                <div className="row" style={{ gap: 8 }}>
                  <Button variant="ghost" onClick={() => setConfirmUnpublish(true)}>
                    Unpublish
                  </Button>
                  <Button variant="primary" onClick={publish} loading={publishing}>
                    Update the published book
                  </Button>
                </div>
              ) : (
                <Button variant="primary" size="lg" onClick={publish} loading={publishing} disabled={!ready}>
                  <SparkleIcon size={18} /> Light the Lantern
                </Button>
              )}
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={confirmUnpublish}
        onClose={() => setConfirmUnpublish(false)}
        icon={<InfoIcon size={24} />}
        title="Take it off the Debut Shelf?"
        description="Readers won't be able to open it until you publish again. Nothing you've written is deleted."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmUnpublish(false)} data-autofocus>
              Keep it published
            </Button>
            <Button variant="danger" onClick={unpublish}>
              Unpublish
            </Button>
          </>
        }
      />
    </div>
  );
}
