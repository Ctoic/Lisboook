"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AlertIcon, EyeIcon, LockIcon, MailIcon, UserIcon } from "@/components/ui/icons";
import { useAuth, type AuthMode } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authCopy: Record<AuthMode, { title: string; description: string }> = {
  signin: { title: "Welcome back", description: "Sign in to sync your library and pick up where you left off." },
  signup: { title: "Create your account", description: "Save your library, and write your own stories in the Inkverse." }
};

interface SignInFormProps {
  mode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  onSuccess?: () => void;
}

export function SignInForm({ mode = "signin", onModeChange, onSuccess }: SignInFormProps) {
  const { signIn, signUp } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const signingUp = mode === "signup";

  function switchMode(next: AuthMode) {
    setErrors({});
    onModeChange?.(next);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (signingUp && name.trim().length < 2) nextErrors.name = "Tell us your name (at least 2 characters).";
    if (!EMAIL_RE.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const session = signingUp ? await signUp(name.trim(), email.trim(), password) : await signIn(email.trim(), password);
      const firstName = session.user.displayName.split(" ")[0];
      toast(
        signingUp
          ? { title: `Welcome to Lisbook, ${firstName}`, description: "Your account is ready." }
          : { title: `Welcome back, ${firstName}`, description: "You're signed in." }
      );
      onSuccess?.();
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : signingUp ? "Sign up failed." : "Sign in failed." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {errors.form ? (
        <div className="notice glass" role="alert">
          <AlertIcon size={18} style={{ color: "var(--danger)" }} />
          <span>{errors.form}</span>
        </div>
      ) : null}

      {signingUp ? (
        <div className="field">
          <label className="field__label" htmlFor="signin-name">
            Your name
          </label>
          <div className="input-group">
            <UserIcon size={18} />
            <input
              id="signin-name"
              className="input"
              autoComplete="name"
              placeholder="Jane Reader"
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "signin-name-error" : undefined}
              data-autofocus
            />
          </div>
          {errors.name ? (
            <span id="signin-name-error" className="field__error">
              {errors.name}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="field">
        <label className="field__label" htmlFor="signin-email">
          Email
        </label>
        <div className="input-group">
          <MailIcon size={18} />
          <input
            id="signin-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "signin-email-error" : undefined}
            data-autofocus={signingUp ? undefined : true}
          />
        </div>
        {errors.email ? (
          <span id="signin-email-error" className="field__error">
            {errors.email}
          </span>
        ) : null}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="signin-password">
          Password
        </label>
        <div className="input-group">
          <LockIcon size={18} />
          <input
            id="signin-password"
            className="input"
            type={showPassword ? "text" : "password"}
            autoComplete={signingUp ? "new-password" : "current-password"}
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "signin-password-error" : undefined}
            style={{ paddingRight: 52 }}
          />
          <Button
            variant="ghost"
            icon
            className="input-group__action password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            <EyeIcon size={18} off={showPassword} />
          </Button>
        </div>
        {errors.password ? (
          <span id="signin-password-error" className="field__error">
            {errors.password}
          </span>
        ) : null}
      </div>

      <Button type="submit" variant="primary" size="lg" block loading={submitting} style={{ marginTop: 6 }}>
        {signingUp ? (submitting ? "Creating your account…" : "Create account") : submitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="field__hint" style={{ textAlign: "center" }}>
        {signingUp ? "Already have an account? " : "New to Lisbook? "}
        <button type="button" className="text-link" onClick={() => switchMode(signingUp ? "signin" : "signup")}>
          {signingUp ? "Sign in" : "Create an account"}
        </button>
      </p>
      <p className="field__hint" style={{ textAlign: "center" }}>
        Browsing and listening never need an account.
      </p>
    </form>
  );
}
