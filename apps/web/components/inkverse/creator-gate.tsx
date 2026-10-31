"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { QuillIcon } from "@/components/ui/icons";
import { useInkverse, type InkverseClient } from "@/lib/inkverse-client";
import { useAuth } from "@/providers/auth-provider";

export function InkverseSkeleton() {
  return (
    <div className="shell" aria-busy="true" aria-label="Loading">
      <div className="page-head">
        <div className="skeleton" style={{ width: 120, height: 14 }} />
        <div className="skeleton" style={{ width: "min(520px, 80%)", height: 52, margin: "18px 0 14px" }} />
        <div className="skeleton" style={{ width: "min(420px, 70%)", height: 18 }} />
      </div>
      <div className="ink-grid">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="skeleton" style={{ height: 180, borderRadius: 26 }} />
        ))}
      </div>
    </div>
  );
}

/** Renders its children only for a signed-in writer; everyone else gets an invitation to sign in. */
export function CreatorGate({ children }: { children: (api: InkverseClient) => ReactNode }) {
  const { ready, openSignIn } = useAuth();
  const api = useInkverse();

  if (!ready) return <InkverseSkeleton />;
  if (!api) {
    return (
      <div className="shell">
        <header className="page-head">
          <span className="eyebrow">The Inkverse</span>
          <h1>
            Where listeners become <span className="gradient-text">storytellers</span>
          </h1>
          <p>Shape your ideas with Lis, write chapter by chapter, and one day hear your own book read aloud.</p>
        </header>
        <EmptyState
          icon={<QuillIcon size={28} />}
          title="Open your Inkwell"
          description="Your Sagas, chapters and Muse sessions are saved to your account, so you can pick up the quill on any device."
          actions={
            <>
              <Button variant="primary" onClick={() => openSignIn("Create a free account to start writing in the Inkverse.", "signup")}>
                Create an account
              </Button>
              <Button variant="glass" onClick={() => openSignIn("Sign in to keep writing in the Inkverse.")}>
                Sign in
              </Button>
            </>
          }
        />
      </div>
    );
  }
  return <>{children(api)}</>;
}
