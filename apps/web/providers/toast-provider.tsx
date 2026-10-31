"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from "@/components/ui/icons";

type Tone = "success" | "info" | "error";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; tone?: Tone }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneIcon: Record<Tone, ReactNode> = {
  success: <CheckIcon size={16} />,
  info: <InfoIcon size={16} />,
  error: <AlertIcon size={16} />
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ title, description, tone = "success" }) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-3), { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 4200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite" aria-relevant="additions">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast--${item.tone} glass glass--strong`} role={item.tone === "error" ? "alert" : "status"}>
            <span className="toast__icon">{toneIcon[item.tone]}</span>
            <div>
              <p className="toast__title">{item.title}</p>
              {item.description ? <p className="toast__desc">{item.description}</p> : null}
            </div>
            <Button variant="ghost" icon size="sm" className="toast__close" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
              <CloseIcon size={14} />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context.toast;
}
