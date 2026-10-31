"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { subscribeToNewsletter } from "@/lib/client-api";
import { useToast } from "@/providers/toast-provider";

export function NewsletterForm({ source, compact }: { source: string; compact?: boolean }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setState("loading");
    try {
      await subscribeToNewsletter(email.trim(), source);
      setState("done");
      toast({ title: "You're on the list", description: "We'll send new releases and listening picks to your inbox." });
    } catch (err) {
      setState("idle");
      toast({ tone: "error", title: "Couldn't subscribe", description: err instanceof Error ? err.message : undefined });
    }
  }

  if (state === "done") {
    return (
      <div className="notice glass" role="status">
        <CheckIcon size={18} />
        <span>
          Subscribed as <strong>{email.trim()}</strong>. Look out for our next release note.
        </span>
      </div>
    );
  }

  const inputId = `newsletter-${source}`;
  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="inline-form">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          className="input"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          style={compact ? { height: 46 } : undefined}
        />
        <Button type="submit" variant="primary" size={compact ? "md" : "lg"} loading={state === "loading"}>
          Subscribe
        </Button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="field__error" style={{ marginTop: 8, paddingLeft: 18 }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
