"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthError } from "@/lib/auth/types";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { provider } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Missing token");
      return;
    }
    let cancelled = false;
    provider
      .consumeMagicLink(token)
      .then(() => {
        if (!cancelled) router.replace("/dashboard/");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof AuthError ? err.message : "Could not sign you in");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [provider, router, token]);

  if (error) {
    return (
      <main>
        <h1>Sign-in link not valid</h1>
        <p role="alert">{error}</p>
        <p>
          <Link href="/login/">Try again →</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Signing you in…</h1>
      <p>Hang tight.</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main>
          <h1>Signing you in…</h1>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
