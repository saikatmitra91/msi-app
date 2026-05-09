"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthError } from "@/lib/auth/types";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";

export default function SignupPage() {
  const { provider } = useAuth();
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit({ email, displayName }: { email: string; displayName?: string }) {
    setError(null);
    setLink(null);
    try {
      const res = await provider.requestMagicLink({
        email,
        displayName,
        intent: "signup",
      });
      setLink(res.link ?? null);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong");
    }
  }

  return (
    <main>
      <h1>Sign up</h1>
      <p>Enter your email — we&apos;ll send you a magic link to create your account.</p>
      <MagicLinkForm submitLabel="Send signup link" includeDisplayName onSubmit={handleSubmit} />
      {error ? (
        <p role="alert" style={{ color: "#f87171" }}>
          {error}
        </p>
      ) : null}
      {link ? (
        <div
          role="status"
          style={{
            marginTop: "1rem",
            padding: "1rem",
            border: "1px dashed var(--accent)",
            borderRadius: 8,
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Dev mode:</strong> we&apos;d email this. Click to continue:
          </p>
          <p style={{ margin: "0.5rem 0 0" }}>
            <a href={link} data-testid="magic-link">
              Continue →
            </a>
          </p>
        </div>
      ) : null}
      <p style={{ marginTop: "2rem", opacity: 0.7 }}>
        Already have an account? <Link href="/login/">Log in</Link>
      </p>
    </main>
  );
}
