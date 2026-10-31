"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Field, Input } from "../../../components/ui/field";
import {
  createAdminImageAsset,
  getAdminAssets,
  getAdminAssetsProvider,
  type AssetsListContract,
  type AssetsProviderContract,
  type ImageAssetContract,
  updateAdminImageAsset
} from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

export default function AssetsPage() {
  const { session } = useAuth();
  const [provider, setProvider] = useState<AssetsProviderContract | null>(null);
  const [assets, setAssets] = useState<AssetsListContract>({ images: [], audio: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<ImageAssetContract | null>(null);

  async function loadData() {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [providerResult, assetResults] = await Promise.all([
        getAdminAssetsProvider(session.accessToken),
        getAdminAssets(session.accessToken)
      ]);
      setProvider(providerResult);
      setAssets(assetResults);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load asset registry");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // Asset data only depends on the active operator session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  async function handleCreateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setError(null);

    try {
      await createAdminImageAsset(session.accessToken, {
        storageKey: String(formData.get("storageKey") ?? ""),
        mimeType: String(formData.get("mimeType") ?? ""),
        sourceUrl: String(formData.get("sourceUrl") ?? "")
      });
      event.currentTarget.reset();
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create image asset");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !editingImage) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setError(null);

    try {
      await updateAdminImageAsset(session.accessToken, editingImage.id, {
        sourceUrl: String(formData.get("sourceUrl") ?? "")
      });
      setEditingImage(null);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update image asset");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Media registry</p>
          <h1>Assets</h1>
        </div>
        <p>
          Keep image and audio references centralized before chapter assignment, cover selection,
          and richer website media workflows are layered on top.
        </p>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}

      <div className="feature-grid">
        <article className="panel">
          <p className="metric-label">Storage strategy</p>
          <h2>{provider?.strategy ?? "Loading..."}</h2>
          <p>Current provider returned by the backend storage abstraction.</p>
        </article>
        <article className="panel">
          <p className="metric-label">Sample cover</p>
          <h2>{provider?.sampleCover ?? "Loading..."}</h2>
          <p>Reference output path for image-backed cover assets.</p>
        </article>
        <article className="panel">
          <p className="metric-label">Sample audio</p>
          <h2>{provider?.sampleAudio ?? "Loading..."}</h2>
          <p>Reference output path for chapter audio assets.</p>
        </article>
      </div>

      <form className="panel stack" onSubmit={(event) => void handleCreateImage(event)}>
        <div className="table__title">
          <strong>Register image asset</strong>
          <span>Create image records for covers and future website artwork.</span>
        </div>
        <div className="form-grid form-grid--three">
          <Field label="Storage key">
            <Input name="storageKey" placeholder="covers/about-hero.jpg" required />
          </Field>
          <Field label="Mime type">
            <Input name="mimeType" placeholder="image/jpeg" required />
          </Field>
          <Field label="Source URL">
            <Input name="sourceUrl" placeholder="https://..." />
          </Field>
        </div>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Create image asset"}
        </Button>
      </form>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Image asset</th>
                <th>Mime type</th>
                <th>Source</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="table__empty" colSpan={5}>
                    Loading image assets...
                  </td>
                </tr>
              ) : assets.images.length === 0 ? (
                <tr>
                  <td className="table__empty" colSpan={5}>
                    No image assets have been registered yet.
                  </td>
                </tr>
              ) : (
                assets.images.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <div className="table__title">
                        <strong>{asset.storageKey}</strong>
                        <span>{asset.id}</span>
                      </div>
                    </td>
                    <td>{asset.mimeType}</td>
                    <td>{asset.sourceUrl ?? "Not set"}</td>
                    <td>{asset.processingStatus}</td>
                    <td className="table__actions">
                      <Button onClick={() => setEditingImage(asset)} size="sm" variant="secondary">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Audio asset</th>
                <th>Mime type</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="table__empty" colSpan={4}>
                    Loading audio assets...
                  </td>
                </tr>
              ) : assets.audio.length === 0 ? (
                <tr>
                  <td className="table__empty" colSpan={4}>
                    No audio assets have been registered yet.
                  </td>
                </tr>
              ) : (
                assets.audio.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <div className="table__title">
                        <strong>{asset.storageKey}</strong>
                        <span>{asset.sourceUrl ?? asset.id}</span>
                      </div>
                    </td>
                    <td>{asset.mimeType}</td>
                    <td>{asset.durationSeconds}s</td>
                    <td>{asset.processingStatus}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        description="Update the external reference for this image asset without changing its storage key."
        isOpen={Boolean(editingImage)}
        onClose={() => setEditingImage(null)}
        title="Edit image asset"
      >
        {editingImage ? (
          <form className="stack" onSubmit={(event) => void handleUpdateImage(event)}>
            <Field hint={editingImage.storageKey} label="Source URL">
              <Input defaultValue={editingImage.sourceUrl ?? ""} name="sourceUrl" />
            </Field>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </form>
        ) : null}
      </Modal>
    </section>
  );
}
