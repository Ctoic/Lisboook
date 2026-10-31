"use client";

import type { AudiobookDetailContract } from "@lisbook/types";
import { FormEvent, useEffect, useState } from "react";
import type { AudiobookPayload } from "../../lib/api";
import { Button } from "../ui/button";
import { Field, Input, Select, Textarea } from "../ui/field";
import { Modal } from "../ui/modal";

interface AudiobookFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialValue?: AudiobookDetailContract | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: AudiobookPayload) => Promise<void>;
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  authorName: string;
  narratorName: string;
  categoryName: string;
  language: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private" | "unlisted";
  isFeatured: boolean;
}

const defaultState: FormState = {
  title: "",
  slug: "",
  description: "",
  authorName: "",
  narratorName: "",
  categoryName: "",
  language: "en",
  status: "draft",
  visibility: "public",
  isFeatured: false
};

function toFormState(initialValue?: AudiobookDetailContract | null): FormState {
  if (!initialValue) {
    return defaultState;
  }

  return {
    title: initialValue.title,
    slug: initialValue.slug,
    description: initialValue.description,
    authorName: initialValue.authorName,
    narratorName: initialValue.narratorName ?? "",
    categoryName: initialValue.categoryName ?? "",
    language: initialValue.language,
    status: initialValue.status,
    visibility: initialValue.visibility,
    isFeatured: initialValue.isFeatured
  };
}

export function AudiobookFormModal({
  isOpen,
  mode,
  initialValue,
  isSubmitting,
  onClose,
  onSubmit
}: AudiobookFormModalProps) {
  const [formState, setFormState] = useState<FormState>(defaultState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormState(toFormState(initialValue));
      setError(null);
    }
  }, [initialValue, isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await onSubmit({
        ...formState,
        narratorName: formState.narratorName || undefined,
        categoryName: formState.categoryName || undefined
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save audiobook");
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  return (
    <Modal
      description="Keep catalog operations dynamic and publish-ready without touching code."
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create audiobook" : "Edit audiobook"}
    >
      <form className="stack" onSubmit={handleSubmit}>
        <div className="form-grid form-grid--two">
          <Field label="Title">
            <Input
              onChange={(event) => update("title", event.target.value)}
              required
              value={formState.title}
            />
          </Field>
          <Field label="Slug" hint="Stable URL key used by the public site.">
            <Input
              onChange={(event) => update("slug", event.target.value)}
              required
              value={formState.slug}
            />
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            minLength={10}
            onChange={(event) => update("description", event.target.value)}
            required
            rows={5}
            value={formState.description}
          />
        </Field>

        <div className="form-grid form-grid--three">
          <Field label="Author">
            <Input
              onChange={(event) => update("authorName", event.target.value)}
              required
              value={formState.authorName}
            />
          </Field>
          <Field label="Narrator">
            <Input
              onChange={(event) => update("narratorName", event.target.value)}
              value={formState.narratorName}
            />
          </Field>
          <Field label="Category">
            <Input
              onChange={(event) => update("categoryName", event.target.value)}
              value={formState.categoryName}
            />
          </Field>
        </div>

        <div className="form-grid form-grid--four">
          <Field label="Language">
            <Input
              onChange={(event) => update("language", event.target.value)}
              value={formState.language}
            />
          </Field>
          <Field label="Status">
            <Select
              onChange={(event) => update("status", event.target.value as FormState["status"])}
              value={formState.status}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <Field label="Visibility">
            <Select
              onChange={(event) =>
                update("visibility", event.target.value as FormState["visibility"])
              }
              value={formState.visibility}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </Select>
          </Field>
          <label className="checkbox">
            <input
              checked={formState.isFeatured}
              onChange={(event) => update("isFeatured", event.target.checked)}
              type="checkbox"
            />
            <span>Feature on home rails</span>
          </label>
        </div>

        {error ? <div className="notice notice--error">{error}</div> : null}

        <div className="modal__footer">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving..." : mode === "create" ? "Create audiobook" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
