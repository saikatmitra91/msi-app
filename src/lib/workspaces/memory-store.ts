import { WorkspaceError, type Workspace, type WorkspaceStore } from "./types";

const PERSIST_KEY = "msi-workspaces-memory-v1";

interface PersistedShape {
  workspaces: Workspace[];
}

export class MemoryWorkspaceStore implements WorkspaceStore {
  private rows = new Map<string, Workspace>();
  private storage: Storage | null;

  constructor(storage: Storage | null = null) {
    this.storage = storage;
    this.hydrate();
  }

  private hydrate(): void {
    if (!this.storage) return;
    const raw = this.storage.getItem(PERSIST_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as PersistedShape;
      for (const w of parsed.workspaces ?? []) this.rows.set(w.id, w);
    } catch {
      this.storage.removeItem(PERSIST_KEY);
    }
  }

  private persist(): void {
    if (!this.storage) return;
    const payload: PersistedShape = { workspaces: [...this.rows.values()] };
    this.storage.setItem(PERSIST_KEY, JSON.stringify(payload));
  }

  private static genId(): string {
    const bytes = new Uint8Array(12);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async list(userId: string): Promise<Workspace[]> {
    return [...this.rows.values()]
      .filter((w) => w.ownerUserId === userId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<Workspace | null> {
    return this.rows.get(id) ?? null;
  }

  async create(input: { name: string; ownerUserId: string }): Promise<Workspace> {
    const name = input.name.trim();
    if (!name) throw new WorkspaceError("Workspace name is required", "invalid_input");
    if (!input.ownerUserId) {
      throw new WorkspaceError("ownerUserId is required", "invalid_input");
    }
    const ws: Workspace = {
      id: MemoryWorkspaceStore.genId(),
      name,
      ownerUserId: input.ownerUserId,
      createdAt: new Date().toISOString(),
    };
    this.rows.set(ws.id, ws);
    this.persist();
    return ws;
  }

  async update(id: string, patch: { name: string }): Promise<Workspace> {
    const existing = this.rows.get(id);
    if (!existing) throw new WorkspaceError("Workspace not found", "not_found");
    const name = patch.name.trim();
    if (!name) throw new WorkspaceError("Workspace name is required", "invalid_input");
    const updated: Workspace = { ...existing, name };
    this.rows.set(id, updated);
    this.persist();
    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!this.rows.has(id)) throw new WorkspaceError("Workspace not found", "not_found");
    this.rows.delete(id);
    this.persist();
  }

  _reset(): void {
    this.rows.clear();
    if (this.storage) this.storage.removeItem(PERSIST_KEY);
  }
}

let cached: WorkspaceStore | null = null;
export function getWorkspaceStore(): WorkspaceStore {
  if (cached) return cached;
  const storage =
    typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  cached = new MemoryWorkspaceStore(storage);
  return cached;
}

export function _resetWorkspaceStore(): void {
  cached = null;
}
