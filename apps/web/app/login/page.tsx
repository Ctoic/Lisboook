"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authCopy, SignInForm } from "@/components/sign-in-form";
import { LogoMark } from "@/components/ui/icons";
import { useAuth, type AuthMode } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { session, ready } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");

  useEffect(() => {
    if (ready && session) router.replace("/profile");
  }, [ready, router, session]);

  return (
    <div className="shell auth-page">
      <div className="auth-card glass glass--strong sheen">
        <div className="modal__icon">
          <LogoMark size={26} />
        </div>
        <h1 style={{ fontSize: "2rem" }}>{authCopy[mode].title}</h1>
        <p className="muted" style={{ margin: "8px 0 26px" }}>
          {authCopy[mode].description}
        </p>
        <SignInForm key={mode} mode={mode} onModeChange={setMode} onSuccess={() => router.push("/profile")} />
      </div>
    </div>
  );
}
