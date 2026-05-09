"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

export default function Home() {
  const { session, loading } = useAuth();

  return (
    <main>
      <h1>MSI</h1>
      <p>
        This is the company app shell. The stack and deploy pipeline are
        documented in <code>docs/adr/0001-stack.md</code> and{" "}
        <code>docs/adr/0002-auth-and-data.md</code>.
      </p>
      <nav style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        {loading ? null : session ? (
          <Link href="/dashboard/">Go to dashboard →</Link>
        ) : (
          <>
            <Link href="/login/">Log in</Link>
            <Link href="/signup/">Sign up</Link>
          </>
        )}
      </nav>
      <p style={{ marginTop: "3rem", opacity: 0.6, fontSize: "0.85rem" }}>
        Build:{" "}
        <code>{process.env.NEXT_PUBLIC_COMMIT_SHA ?? "local"}</code>
      </p>
    </main>
  );
}
