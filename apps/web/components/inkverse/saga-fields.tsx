"use client";

import type { SagaForm } from "@lisbook/types";
import { creatorGenres, sagaForms } from "@/lib/inkverse-client";

export interface SagaDraft {
  title: string;
  logline: string;
  genre: string;
  form: SagaForm;
}

/** Title, logline, genre and form: shared by "New Saga" and the Saga settings. */
export function SagaFields({ draft, onChange, idPrefix }: { draft: SagaDraft; onChange: (draft: SagaDraft) => void; idPrefix: string }) {
  const set = <K extends keyof SagaDraft>(key: K, value: SagaDraft[K]) => onChange({ ...draft, [key]: value });

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="field">
        <label className="field__label" htmlFor={`${idPrefix}-title`}>
          Title
        </label>
        <input
          id={`${idPrefix}-title`}
          className="input"
          value={draft.title}
          maxLength={120}
          onChange={(e) => set("title", e.target.value)}
          placeholder="The Lighthouse That Listened"
          data-autofocus
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`${idPrefix}-logline`}>
          Logline <span className="muted">(one sentence: who wants what, and what stands in the way)</span>
        </label>
        <textarea
          id={`${idPrefix}-logline`}
          className="input"
          rows={2}
          maxLength={400}
          value={draft.logline}
          onChange={(e) => set("logline", e.target.value)}
          placeholder="A lonely lighthouse keeper discovers the sea can speak, and it is begging her to put the light out."
        />
      </div>
      <div className="ink-saga-grid">
        <div className="field">
          <label className="field__label" htmlFor={`${idPrefix}-genre`}>
            Genre
          </label>
          <input
            id={`${idPrefix}-genre`}
            className="input"
            list={`${idPrefix}-genres`}
            value={draft.genre}
            maxLength={40}
            onChange={(e) => set("genre", e.target.value)}
            placeholder="Fantasy"
          />
          <datalist id={`${idPrefix}-genres`}>
            {creatorGenres.map((genre) => (
              <option key={genre} value={genre} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <span className="field__label" id={`${idPrefix}-form-label`}>
            Form
          </span>
          <div className="segmented" role="group" aria-labelledby={`${idPrefix}-form-label`}>
            {sagaForms.map((option) => (
              <button key={option.value} type="button" aria-pressed={draft.form === option.value} onClick={() => set("form", option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
