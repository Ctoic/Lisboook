"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon, MailIcon, ShareIcon, XBrandIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/providers/toast-provider";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  author: string;
  path: string;
}

export function ShareModal({ open, onClose, title, author, path }: ShareModalProps) {
  const toast = useToast();
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
    setCanNativeShare(typeof navigator.share === "function");
  }, [path]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const text = `Listening to “${title}” by ${author} on Lisbook`;
  const encoded = { url: encodeURIComponent(url), text: encodeURIComponent(text) };
  const targets = [
    { label: "X", href: `https://x.com/intent/post?text=${encoded.text}&url=${encoded.url}`, icon: <XBrandIcon size={16} /> },
    { label: "WhatsApp", href: `https://wa.me/?text=${encoded.text}%20${encoded.url}`, icon: <ShareIcon size={16} /> },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded.url}`, icon: <ShareIcon size={16} /> },
    { label: "Email", href: `mailto:?subject=${encodeURIComponent(title)}&body=${encoded.text}%0A${encoded.url}`, icon: <MailIcon size={16} /> }
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied", description: "Paste it anywhere to share this audiobook." });
    } catch {
      toast({ tone: "error", title: "Couldn't copy link", description: "Select the link and copy it manually." });
    }
  }

  return (
    <Modal open={open} onClose={onClose} icon={<ShareIcon size={24} />} title="Share this audiobook" description={text}>
      <div className="stack">
        <div className="input-group">
          <input className="input" value={url} readOnly aria-label="Share link" onFocus={(event) => event.currentTarget.select()} style={{ paddingLeft: 18, paddingRight: 120 }} />
          <Button variant={copied ? "glass" : "primary"} size="sm" className="input-group__action" onClick={copy} active={copied}>
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {targets.map((target) => (
            <a key={target.label} className="btn btn--glass" href={target.href} target="_blank" rel="noreferrer">
              {target.icon}
              {target.label}
            </a>
          ))}
        </div>
        {canNativeShare ? (
          <Button variant="ghost" block onClick={() => navigator.share({ title, text, url }).catch(() => undefined)}>
            More options…
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
