"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthError } from "@/lib/auth/types";

export default function ProfilePage() {
  const { provider, session } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) setDisplayName(session.user.displayName);
  }, [session]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      await provider.updateProfile({ displayName });
      setStatus({ kind: "ok", message: "Saved." });
    } catch (err) {
      setStatus({
        kind: "err",
        message: err instanceof AuthError ? err.message : "Could not save profile",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!session) return null;

  return (
    <>
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Profile</h1>
      <form onSubmit={handleSave} style={{ marginTop: "1.5rem", maxWidth: 480 }}>
        <label htmlFor="profile-email" style={{ display: "block", opacity: 0.7 }}>
          Email
        </label>
        <input
          id="profile-email"
          value={session.user.email}
          readOnly
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem 0.75rem",
            margin: "0.25rem 0 1rem",
            background: "#0a0e15",
            color: "inherit",
            border: "1px solid #1f2533",
            borderRadius: 6,
            opacity: 0.7,
          }}
        />
        <label htmlFor="profile-display-name" style={{ display: "block" }}>
          Display name
        </label>
        <input
          id="profile-display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          data-testid="profile-display-name"
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem 0.75rem",
            margin: "0.25rem 0 1rem",
            background: "transparent",
            color: "inherit",
            border: "1px solid #2a3142",
            borderRadius: 6,
          }}
        />
        <button
          type="submit"
          disabled={busy}
          data-testid="profile-save"
          style={{
            padding: "0.5rem 1rem",
            background: "var(--accent)",
            color: "#0b0f17",
            border: 0,
            borderRadius: 6,
            fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {status ? (
          <p
            role="status"
            style={{ color: status.kind === "ok" ? "#4ade80" : "#f87171", marginTop: "0.75rem" }}
          >
            {status.message}
          </p>
        ) : null}
      </form>
    </>
  );
}
