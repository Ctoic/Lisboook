"use client";

import type { LoginResponseContract } from "@lisbook/types";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition
} from "react";
import { login } from "./api";
import { ADMIN_STORAGE_KEY } from "./config";

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: LoginResponseContract["user"];
}

interface AuthContextValue {
  isHydrated: boolean;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  session: StoredSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(ADMIN_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredSession;
  } catch {
    window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setSession(readStoredSession());
      setIsHydrated(true);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isHydrated,
      isAuthenticated: Boolean(session?.accessToken),
      isSubmitting,
      session,
      async signIn(email: string, password: string) {
        setIsSubmitting(true);

        try {
          const payload = await login(email, password);
          const nextSession: StoredSession = {
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
            user: payload.user
          };

          window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(nextSession));
          setSession(nextSession);
        } finally {
          setIsSubmitting(false);
        }
      },
      signOut() {
        window.localStorage.removeItem(ADMIN_STORAGE_KEY);
        setSession(null);
      }
    }),
    [isHydrated, isSubmitting, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
