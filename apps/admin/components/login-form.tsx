"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "../lib/auth";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";

export function LoginForm() {
  const router = useRouter();
  const { signIn, isSubmitting } = useAuth();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await signIn(email, password);
      router.replace("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to login");
    }
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <div className="login-card__header">
        <p className="eyebrow">Lisbook admin</p>
        <h1>Control the catalog, content and audience operations.</h1>
        <p>
          Use the seeded operator account for now:
          <br />
          <strong>admin@lisbook.local</strong> / <strong>password123</strong>
        </p>
      </div>

      <div className="form-grid">
        <Field label="Email address">
          <Input autoComplete="email" defaultValue="admin@lisbook.local" name="email" type="email" />
        </Field>
        <Field label="Password">
          <Input autoComplete="current-password" defaultValue="password123" name="password" type="password" />
        </Field>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}

      <Button disabled={isSubmitting} fullWidth type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
