// Domain types for auth + the provider abstraction.
//
// Two implementations live behind this interface:
//   - MemoryAuthProvider (used in dev when Supabase env vars are unset, and
//     in all tests).
//   - SupabaseAuthProvider (lands in a follow-up issue).
//
// See docs/adr/0002-auth-and-data.md for the rationale.

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface Session {
  user: User;
  // Opaque token. Memory provider uses a random string; Supabase will use
  // its own access-token format. Treat as opaque from app code.
  token: string;
  // ISO timestamp; null = no expiry (memory provider does not expire).
  expiresAt: string | null;
}

export type MagicLinkIntent = "login" | "signup";

export interface RequestMagicLinkInput {
  email: string;
  displayName?: string;
  intent: MagicLinkIntent;
}

export interface RequestMagicLinkResult {
  // The link to click. In dev/test we surface this directly so the flow can
  // be exercised without an inbox. In production (Supabase) this is omitted.
  link?: string;
}

export interface AuthProvider {
  /** Synchronous read of the current session from cached state. */
  getSession(): Session | null;

  /** Subscribe to session changes. Returns an unsubscribe function. */
  onSessionChange(handler: (session: Session | null) => void): () => void;

  /** Issue a magic link for the given email + intent. */
  requestMagicLink(input: RequestMagicLinkInput): Promise<RequestMagicLinkResult>;

  /** Consume a magic-link token and start a session. */
  consumeMagicLink(token: string): Promise<Session>;

  /** Clear the active session. */
  signOut(): Promise<void>;

  /** Update the current user's profile. Throws if not signed in. */
  updateProfile(input: { displayName: string }): Promise<User>;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "user_exists"
      | "user_not_found"
      | "invalid_token"
      | "not_authenticated"
      | "invalid_input",
  ) {
    super(message);
    this.name = "AuthError";
  }
}
