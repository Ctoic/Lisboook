"use client";

import type { AudiobookDetailContract, AudiobookListItemContract } from "@lisbook/types";
import { useEffect, useState } from "react";
import { AudiobookFormModal } from "../../../components/audiobooks/audiobook-form-modal";
import { Button } from "../../../components/ui/button";
import {
  createAdminAudiobook,
  getAudiobookDetail,
  getAdminAudiobooks,
  updateAdminAudiobook,
  type AudiobookPayload
} from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

export default function AudiobooksPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<AudiobookListItemContract[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AudiobookDetailContract | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  async function loadData(nextPage = page) {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAdminAudiobooks(session.accessToken, nextPage);
      setItems(response.data);
      setTotalPages(response.pagination.totalPages);
      setPage(response.pagination.page);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load audiobooks");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData(1);
    // The auth session is the only state that should trigger a fresh bootstrap fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  async function handleCreate(payload: AudiobookPayload) {
    if (!session) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createAdminAudiobook(session.accessToken, payload);
      await loadData(1);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(payload: AudiobookPayload) {
    if (!session || !editingItem) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateAdminAudiobook(session.accessToken, editingItem.id, payload);
      await loadData(page);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit(item: AudiobookListItemContract) {
    setLoadingEditId(item.id);
    setError(null);

    try {
      const detail = await getAudiobookDetail(item.slug);
      setEditingItem(detail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load audiobook details");
    } finally {
      setLoadingEditId(null);
    }
  }

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Catalog workspace</p>
          <h1>Audiobooks</h1>
        </div>
        <p>
          Manage the legacy book catalog as live platform records with explicit publish states,
          search-ready metadata, and future-ready chapter/media relationships.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar__summary">
          <strong>{items.length}</strong>
          <span>records on this page</span>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Add audiobook</Button>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}

      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Visibility</th>
                <th>Featured</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="table__empty" colSpan={6}>
                    Loading audiobook records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="table__empty" colSpan={6}>
                    No audiobooks available yet. Create the first one from this workspace.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table__title">
                        <strong>{item.title}</strong>
                        <span>{item.slug}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table__title">
                        <strong>{item.authorName}</strong>
                        <span>{item.narratorName ?? "Narrator TBD"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`pill pill--${item.status}`}>{item.status}</span>
                    </td>
                    <td>{item.visibility}</td>
                    <td>{item.isFeatured ? "Yes" : "No"}</td>
                    <td className="table__actions">
                      <Button
                        disabled={loadingEditId === item.id}
                        onClick={() => void handleEdit(item)}
                        size="sm"
                        variant="secondary"
                      >
                        {loadingEditId === item.id ? "Loading..." : "Quick edit"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <Button
            disabled={page <= 1 || isLoading}
            onClick={() => void loadData(page - 1)}
            size="sm"
            variant="ghost"
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            disabled={page >= totalPages || isLoading}
            onClick={() => void loadData(page + 1)}
            size="sm"
            variant="ghost"
          >
            Next
          </Button>
        </div>
      </div>

      <AudiobookFormModal
        isOpen={isCreateOpen}
        isSubmitting={isSubmitting}
        mode="create"
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <AudiobookFormModal
        initialValue={editingItem}
        isOpen={Boolean(editingItem)}
        isSubmitting={isSubmitting}
        mode="edit"
        onClose={() => setEditingItem(null)}
        onSubmit={handleUpdate}
      />
    </section>
  );
}
