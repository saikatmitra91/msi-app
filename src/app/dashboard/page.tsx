"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getWorkspaceStore } from "@/lib/workspaces/memory-store";
import { WorkspaceError, type Workspace } from "@/lib/workspaces/types";

export default function DashboardPage() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setWorkspaces(await getWorkspaceStore().list(userId));
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError(null);
    setBusy(true);
    try {
      await getWorkspaceStore().create({ name, ownerUserId: userId });
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof WorkspaceError ? err.message : "Could not create workspace");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    setError(null);
    try {
      await getWorkspaceStore().remove(id);
      await refresh();
    } catch (err) {
      setError(err instanceof WorkspaceError ? err.message : "Could not delete workspace");
    }
  }

  return (
    <>
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Dashboard</h1>
      <p style={{ opacity: 0.7, marginTop: "0.25rem" }}>
        Welcome, <span data-testid="welcome-name">{session?.user.displayName}</span>.
      </p>
      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Your workspaces</h2>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem", margin: "0.75rem 0" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New workspace name"
            aria-label="Workspace name"
            data-testid="workspace-name-input"
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              background: "transparent",
              color: "inherit",
              border: "1px solid #2a3142",
              borderRadius: 6,
            }}
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            data-testid="create-workspace"
            style={{
              padding: "0.5rem 0.9rem",
              background: "var(--accent)",
              color: "#0b0f17",
              border: 0,
              borderRadius: 6,
              fontWeight: 600,
              cursor: busy || !name.trim() ? "not-allowed" : "pointer",
              opacity: busy || !name.trim() ? 0.6 : 1,
            }}
          >
            Create
          </button>
        </form>
        {error ? (
          <p role="alert" style={{ color: "#f87171" }}>
            {error}
          </p>
        ) : null}
        {workspaces.length === 0 ? (
          <p data-testid="empty-workspaces" style={{ opacity: 0.6 }}>
            No workspaces yet — create your first one above.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }} data-testid="workspaces-list">
            {workspaces.map((w) => (
              <li
                key={w.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.75rem",
                  border: "1px solid #1f2533",
                  borderRadius: 6,
                  marginBottom: "0.4rem",
                }}
              >
                <span data-testid={`workspace-name-${w.id}`}>{w.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(w.id)}
                  data-testid={`workspace-delete-${w.id}`}
                  style={{
                    padding: "0.3rem 0.6rem",
                    background: "transparent",
                    color: "#f87171",
                    border: "1px solid #3a1f24",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
