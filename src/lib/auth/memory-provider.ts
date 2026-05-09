import {
  AuthError,
  type AuthProvider,
  type RequestMagicLinkInput,
  type RequestMagicLinkResult,
  type Session,
  type User,
} from "./types";

// In-memory auth provider with optional localStorage persistence.
//
// "In-memory" is slightly misleading: a single instance keeps users +
// pending magic-link tokens in JS memory, but if a `Storage` is provided,
// we hydrate/persist the user table and active session so a browser
// reload preserves login state. Tests pass a fresh `Map`-backed Storage
// (or none) for hermetic runs.

interface PendingToken {
  token: string;
  email: string;
  intent: "login" | "signup";
  displayName?: string;
}

interface PersistedShape {
  users: User[];
  session: Session | null;
}

const PERSIST_KEY = "msi-auth-memory-v1";

export class MemoryAuthProvider implements AuthProvider {
  private users = new Map<string, User>(); // by email
  private pending = new Map<string, PendingToken>(); // by token
  private session: Session | null = null;
  private listeners = new Set<(s: Session | null) => void>();
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
      for (const u of parsed.users ?? []) this.users.set(u.email, u);
      this.session = parsed.session ?? null;
    } catch {
      // Corrupt persisted state: drop it.
      this.storage.removeItem(PERSIST_KEY);
    }
  }

  private persist(): void {
    if (!this.storage) return;
    const payload: PersistedShape = {
      users: [...this.users.values()],
      session: this.session,
    };
    this.storage.setItem(PERSIST_KEY, JSON.stringify(payload));
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.session);
  }

  private static genToken(): string {
    // Cryptographically random hex; sufficient for dev/test.
    const bytes = new Uint8Array(16);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  private static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  getSession(): Session | null {
    return this.session;
  }

  onSessionChange(handler: (session: Session | null) => void): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  async requestMagicLink(input: RequestMagicLinkInput): Promise<RequestMagicLinkResult> {
    const email = MemoryAuthProvider.normalizeEmail(input.email);
    if (!email || !email.includes("@")) {
      throw new AuthError("Invalid email", "invalid_input");
    }
    const exists = this.users.has(email);
    if (input.intent === "signup" && exists) {
      throw new AuthError("An account with that email already exists", "user_exists");
    }
    if (input.intent === "login" && !exists) {
      throw new AuthError("No account with that email — sign up instead", "user_not_found");
    }
    const token = MemoryAuthProvider.genToken();
    this.pending.set(token, {
      token,
      email,
      intent: input.intent,
      displayName: input.displayName?.trim(),
    });
    // Surface the link so the dev UI can show it without a real inbox.
    const link = `/auth/callback?token=${encodeURIComponent(token)}`;
    return { link };
  }

  async consumeMagicLink(token: string): Promise<Session> {
    const pending = this.pending.get(token);
    if (!pending) {
      throw new AuthError("Magic link is invalid or already used", "invalid_token");
    }
    this.pending.delete(token);
    let user = this.users.get(pending.email);
    if (!user) {
      // First-time login = signup. (We don't bother distinguishing further.)
      user = {
        id: MemoryAuthProvider.genToken(),
        email: pending.email,
        displayName: pending.displayName?.length
          ? pending.displayName
          : pending.email.split("@")[0],
        createdAt: new Date().toISOString(),
      };
      this.users.set(user.email, user);
    } else if (pending.displayName && pending.displayName !== user.displayName) {
      user = { ...user, displayName: pending.displayName };
      this.users.set(user.email, user);
    }
    this.session = {
      user,
      token: MemoryAuthProvider.genToken(),
      expiresAt: null,
    };
    this.persist();
    this.emit();
    return this.session;
  }

  async signOut(): Promise<void> {
    this.session = null;
    this.persist();
    this.emit();
  }

  async updateProfile(input: { displayName: string }): Promise<User> {
    if (!this.session) {
      throw new AuthError("Not signed in", "not_authenticated");
    }
    const trimmed = input.displayName.trim();
    if (!trimmed) {
      throw new AuthError("Display name cannot be empty", "invalid_input");
    }
    const updated: User = { ...this.session.user, displayName: trimmed };
    this.users.set(updated.email, updated);
    this.session = { ...this.session, user: updated };
    this.persist();
    this.emit();
    return updated;
  }

  // Test-only helpers — exposed for integration tests, not used by app code.
  _reset(): void {
    this.users.clear();
    this.pending.clear();
    this.session = null;
    if (this.storage) this.storage.removeItem(PERSIST_KEY);
    this.emit();
  }
}
