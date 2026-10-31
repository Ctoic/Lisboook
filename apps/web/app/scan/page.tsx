"use client";
/* Cover recognition is a later API phase; until it ships this page captures the photo and hands
   the visitor to text search, so the flow is never a dead end. */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { CameraIcon, CloseIcon, ScanIcon, SearchIcon, SparkleIcon, UploadIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/providers/toast-provider";

const MAX_BYTES = 10 * 1024 * 1024;

export default function ScanPage() {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function accept(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ tone: "error", title: "That isn't an image", description: "Upload a JPG, PNG or HEIC photo of the cover." });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ tone: "error", title: "Image is too large", description: "Please use a photo under 10 MB." });
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  }

  function search(event: FormEvent) {
    event.preventDefault();
    router.push(title.trim() ? `/explore?q=${encodeURIComponent(title.trim())}` : "/explore");
  }

  return (
    <div className="shell" style={{ maxWidth: 820 }}>
      <header className="page-head" style={{ textAlign: "center" }}>
        <span className="eyebrow">
          <SparkleIcon size={14} /> Beta
        </span>
        <h1>Scan a book cover</h1>
        <p style={{ marginInline: "auto" }}>Snap or upload a photo of a printed book and we&apos;ll help you find its audiobook.</p>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {preview ? (
        <div className="glass glass--pad sheen stack" style={{ alignItems: "center", gap: 24 }}>
          <div className="scan-preview">
            <img src={preview} alt="Your uploaded book cover" />
            <span className="scan-preview__beam" aria-hidden />
          </div>
          <p className="muted">Looks good! Next, confirm the title so we can find it.</p>
          <div className="row" style={{ justifyContent: "center" }}>
            <Button variant="glass" onClick={() => setPreview(null)}>
              <CloseIcon size={16} /> Choose another
            </Button>
            <Button variant="primary" size="lg" onClick={() => setResultOpen(true)}>
              <ScanIcon size={18} /> Find this audiobook
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className="dropzone glass"
          data-dragging={dragging}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          aria-label="Upload a photo of a book cover"
        >
          <span className="empty__icon">
            <UploadIcon size={28} />
          </span>
          <h2 style={{ fontSize: "1.5rem" }}>Drop a cover photo here</h2>
          <p className="muted">or tap to take a photo / choose from your device · JPG, PNG up to 10 MB</p>
          <div className="row" style={{ justifyContent: "center", marginTop: 6 }}>
            <span className="btn btn--primary">
              <CameraIcon size={18} /> Take or upload photo
            </span>
          </div>
        </div>
      )}

      <Modal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        icon={<SearchIcon size={24} />}
        title="Let's find it together"
        description="Automatic cover recognition is coming soon. For now, type the title or author from the cover and we'll search the catalog."
      >
        <form onSubmit={search} className="stack">
          <label htmlFor="scan-title" className="sr-only">
            Book title or author
          </label>
          <input id="scan-title" className="input" placeholder="e.g. Pale Blue Dot" value={title} onChange={(event) => setTitle(event.target.value)} data-autofocus />
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setResultOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              <SearchIcon size={16} /> Search catalog
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
