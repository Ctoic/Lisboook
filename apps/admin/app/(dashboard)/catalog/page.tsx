"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Field, Input, Textarea } from "../../../components/ui/field";
import {
  createAdminAuthor,
  createAdminCategory,
  createAdminNarrator,
  getAdminAuthors,
  getAdminCategories,
  getAdminNarrators,
  type ManagedEntityContract,
  type ManagedEntityPayload,
  updateAdminAuthor,
  updateAdminCategory,
  updateAdminNarrator
} from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

type DetailField = "bio" | "description";

interface SectionConfig {
  key: "authors" | "narrators" | "categories";
  title: string;
  description: string;
  detailField: DetailField;
  detailLabel: string;
  items: ManagedEntityContract[];
  onCreate: (payload: ManagedEntityPayload) => Promise<void>;
  onUpdate: (id: string, payload: ManagedEntityPayload) => Promise<void>;
}

function EntityManagerSection({
  title,
  description,
  detailField,
  detailLabel,
  items,
  onCreate,
  onUpdate
}: SectionConfig) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ManagedEntityContract | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        name: String(formData.get("name") ?? ""),
        [detailField]: String(formData.get(detailField) ?? "")
      });
      event.currentTarget.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : `Unable to create ${title.toLowerCase()}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingItem) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdate(editingItem.id, {
        name: String(formData.get("name") ?? ""),
        [detailField]: String(formData.get(detailField) ?? "")
      });
      setEditingItem(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : `Unable to update ${title.toLowerCase()}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="panel stack">
      <div className="table__title">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}

      <form className="stack" onSubmit={(event) => void handleCreate(event)}>
        <div className="form-grid form-grid--two">
          <Field label="Name">
            <Input name="name" placeholder={`Add ${title.toLowerCase()} name`} required />
          </Field>
          <Field label={detailLabel}>
            <Textarea name={detailField} placeholder={`Optional ${detailLabel.toLowerCase()}`} />
          </Field>
        </div>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : `Add ${title.slice(0, -1)}`}
        </Button>
      </form>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="table__empty" colSpan={4}>
                  No {title.toLowerCase()} exist yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="table__title">
                      <strong>{item.name}</strong>
                      <span>{item[detailField] ?? "No details yet"}</span>
                    </div>
                  </td>
                  <td>{item.slug}</td>
                  <td>
                    <span className={`pill pill--${item.status}`}>{item.status}</span>
                  </td>
                  <td className="table__actions">
                    <Button onClick={() => setEditingItem(item)} size="sm" variant="secondary">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        description={`Update ${title.toLowerCase()} metadata without leaving this workspace.`}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title={`Edit ${title}`}
      >
        {editingItem ? (
          <form className="stack" onSubmit={(event) => void handleUpdate(event)}>
            <Field label="Name">
              <Input defaultValue={editingItem.name} name="name" required />
            </Field>
            <Field hint={`Slug: ${editingItem.slug}`} label={detailLabel}>
              <Textarea defaultValue={editingItem[detailField] ?? ""} name={detailField} />
            </Field>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </form>
        ) : null}
      </Modal>
    </article>
  );
}

export default function CatalogPage() {
  const { session } = useAuth();
  const [authors, setAuthors] = useState<ManagedEntityContract[]>([]);
  const [narrators, setNarrators] = useState<ManagedEntityContract[]>([]);
  const [categories, setCategories] = useState<ManagedEntityContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [authorResults, narratorResults, categoryResults] = await Promise.all([
        getAdminAuthors(session.accessToken),
        getAdminNarrators(session.accessToken),
        getAdminCategories(session.accessToken)
      ]);
      setAuthors(authorResults);
      setNarrators(narratorResults);
      setCategories(categoryResults);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load catalog entities"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // Entity data only depends on the authenticated admin token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Catalog operations</p>
          <h1>People and taxonomy</h1>
        </div>
        <p>
          Manage reusable author, narrator, and category records from the admin before chapter
          assignment, media linking, and richer catalog relationships are expanded later.
        </p>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}

      {isLoading ? (
        <div className="notice">Loading catalog management records...</div>
      ) : (
        <div className="feature-grid">
          <EntityManagerSection
            description="Writer profiles that can be reused across many audiobooks."
            detailField="bio"
            detailLabel="Biography"
            items={authors}
            key="authors"
            onCreate={async (payload) => {
              if (!session) {
                return;
              }
              await createAdminAuthor(session.accessToken, payload);
              await loadData();
            }}
            onUpdate={async (id, payload) => {
              if (!session) {
                return;
              }
              await updateAdminAuthor(session.accessToken, id, payload);
              await loadData();
            }}
            title="Authors"
          />
          <EntityManagerSection
            description="Narrator identities that can be linked to current and future releases."
            detailField="bio"
            detailLabel="Biography"
            items={narrators}
            key="narrators"
            onCreate={async (payload) => {
              if (!session) {
                return;
              }
              await createAdminNarrator(session.accessToken, payload);
              await loadData();
            }}
            onUpdate={async (id, payload) => {
              if (!session) {
                return;
              }
              await updateAdminNarrator(session.accessToken, id, payload);
              await loadData();
            }}
            title="Narrators"
          />
          <EntityManagerSection
            description="Shared browsing taxonomies for the public discovery experience."
            detailField="description"
            detailLabel="Description"
            items={categories}
            key="categories"
            onCreate={async (payload) => {
              if (!session) {
                return;
              }
              await createAdminCategory(session.accessToken, payload);
              await loadData();
            }}
            onUpdate={async (id, payload) => {
              if (!session) {
                return;
              }
              await updateAdminCategory(session.accessToken, id, payload);
              await loadData();
            }}
            title="Categories"
          />
        </div>
      )}

      <div className="notice">
        Chapter ordering and chapter-level asset assignment still need additional backend routes for
        listing and updating chapters. This page now covers the live taxonomy modules already
        supported by the API.
      </div>
    </section>
  );
}
