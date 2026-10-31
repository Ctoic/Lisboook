"use client";

import { useState, type FormEvent } from "react";
import type { CreatorProfileContract } from "@lisbook/types";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { creatorGenres, creatorGoals, type InkverseClient } from "@/lib/inkverse-client";
import { useAuth } from "@/providers/auth-provider";

/** First visit: the listener picks a pen name and tells Lis what they love to write. */
export function Threshold({ api, onCrossed }: { api: InkverseClient; onCrossed: (profile: CreatorProfileContract) => void }) {
  const { session } = useAuth();
  const [quillName, setQuillName] = useState(session?.user.displayName ?? "");
  const [genres, setGenres] = useState<string[]>([]);
  const [goal, setGoal] = useState("finish_novel");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleGenre(genre: string) {
    setGenres((current) => (current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre].slice(0, 8)));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (quillName.trim().length < 2) {
      setError("Your Quill Name needs at least 2 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onCrossed(await api.saveProfile({ quillName: quillName.trim(), genres, goal, bio: bio.trim() || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <div className="shell">
      <header className="page-head">
        <span className="eyebrow">The Threshold</span>
        <h1>
          Step into the <span className="gradient-text">Inkverse</span>
        </h1>
        <p>Every storyteller starts somewhere. Tell Lis a little about yourself and your Muse will tune itself to you.</p>
      </header>

      <form className="ink-threshold glass glass--pad" onSubmit={submit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="quill-name">
            Your Quill Name
          </label>
          <input
            id="quill-name"
            className="input"
            value={quillName}
            maxLength={40}
            onChange={(e) => setQuillName(e.target.value)}
            placeholder="The name on your book covers"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby="quill-name-hint"
          />
          <span id="quill-name-hint" className="field__hint">
            A pen name readers will see when you publish. You can change it later.
          </span>
        </div>

        <fieldset className="field ink-fieldset">
          <legend className="field__label">What do you love to write?</legend>
          <div className="ink-chip-wrap" role="group" aria-label="Favourite genres">
            {creatorGenres.map((genre) => (
              <button key={genre} type="button" className="chip" aria-pressed={genres.includes(genre)} onClick={() => toggleGenre(genre)}>
                {genre}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="field ink-fieldset">
          <legend className="field__label">What brings you here?</legend>
          <div className="ink-goals">
            {creatorGoals.map((option) => (
              <label key={option.value} className="ink-goal glass glass--interactive" data-checked={goal === option.value || undefined}>
                <input type="radio" name="goal" value={option.value} checked={goal === option.value} onChange={() => setGoal(option.value)} className="sr-only" aria-label={option.label} />
                <strong>{option.label}</strong>
                <span className="muted">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label className="field__label" htmlFor="quill-bio">
            A line about you <span className="muted">(optional)</span>
          </label>
          <textarea id="quill-bio" className="input" rows={2} maxLength={400} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Night-shift nurse who writes ghost stories on the bus." />
        </div>

        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" variant="primary" size="lg" loading={saving}>
            Cross the Threshold <ArrowRightIcon size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
}
