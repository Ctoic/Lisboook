"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { LogoMark } from "@/components/ui/icons";
import type { AuthMode } from "@/providers/auth-provider";
import { authCopy, SignInForm } from "./sign-in-form";

interface AuthModalProps {
  open: boolean;
  reason?: string;
  initialMode?: AuthMode;
  onClose: () => void;
}

export function AuthModal({ open, reason, initialMode = "signin", onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  return (
    <Modal open={open} onClose={onClose} icon={<LogoMark size={26} />} title={authCopy[mode].title} description={reason ?? authCopy[mode].description}>
      <SignInForm key={mode} mode={mode} onModeChange={setMode} onSuccess={onClose} />
    </Modal>
  );
}
