"use client";

import { useId, useState, type FormEvent } from "react";

interface Props {
  submitLabel: string;
  includeDisplayName?: boolean;
  onSubmit(input: { email: string; displayName?: string }): Promise<void>;
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.6rem 0.75rem",
  margin: "0.25rem 0 1rem",
  background: "transparent",
  color: "inherit",
  border: "1px solid #2a3142",
  borderRadius: 6,
  fontSize: "1rem",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  background: "var(--accent)",
  color: "#0b0f17",
  border: 0,
  borderRadius: 6,
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
};

export function MagicLinkForm({ submitLabel, includeDisplayName, onSubmit }: Props) {
  const emailId = useId();
  const nameId = useId();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({ email, displayName: includeDisplayName ? displayName : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
      {includeDisplayName ? (
        <>
          <label htmlFor={nameId}>Name</label>
          <input
            id={nameId}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            style={inputStyle}
            autoComplete="name"
          />
        </>
      ) : null}
      <label htmlFor={emailId}>Email</label>
      <input
        id={emailId}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        style={inputStyle}
        autoComplete="email"
      />
      <button type="submit" disabled={busy} style={buttonStyle}>
        {busy ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
