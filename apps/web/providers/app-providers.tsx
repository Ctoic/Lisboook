"use client";

import type { ReactNode } from "react";
import { AssistantProvider } from "./assistant-provider";
import { AuthProvider } from "./auth-provider";
import { LibraryProvider } from "./library-provider";
import { PlayerProvider } from "./player-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <LibraryProvider>
            <PlayerProvider>
              <AssistantProvider>{children}</AssistantProvider>
            </PlayerProvider>
          </LibraryProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
