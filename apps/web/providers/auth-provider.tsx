"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LoginResponseContract } from "@lisbook/types";
import { AuthModal } from "@/components/auth-modal";
import { login as loginRequest, register as registerRequest } from "@/lib/client-api";
import { readJson, removeKey, storageKeys, writeJson } from "@/lib/storage";

export type Session = LoginResponseContract;

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<Session>;
  signUp: (displayName: string, email: string, password: string) => Promise<Session>;
  signOut: () => void;
  openSignIn: (reason?: string, mode?: AuthMode) => void;
}

export type AuthMode = "signin" | "signup";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; reason?: string; mode?: AuthMode }>({ open: false });

  useEffect(() => {
    setSession(readJson<Session | null>(storageKeys.session, null));
    setReady(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await loginRequest(email, password);
    setSession(next);
    writeJson(storageKeys.session, next);
    return next;
  }, []);

  const signUp = useCallback(async (displayName: string, email: string, password: string) => {
    const next = await registerRequest(displayName, email, password);
    setSession(next);
    writeJson(storageKeys.session, next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    removeKey(storageKeys.session);
  }, []);

  const openSignIn = useCallback((reason?: string, mode?: AuthMode) => setModal({ open: true, reason, mode }), []);

  const value = useMemo(
    () => ({ session, ready, signIn, signUp, signOut, openSignIn }),
    [session, ready, signIn, signUp, signOut, openSignIn]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal open={modal.open} reason={modal.reason} initialMode={modal.mode} onClose={() => setModal({ open: false })} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
