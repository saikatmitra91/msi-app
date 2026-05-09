import { MemoryAuthProvider } from "./memory-provider";
import type { AuthProvider } from "./types";

// Picks the active auth provider. Today there is only the in-memory one;
// the Supabase provider lands in a follow-up issue once the project is
// provisioned (see ADR-0002).

let cached: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (cached) return cached;
  const storage =
    typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  cached = new MemoryAuthProvider(storage);
  return cached;
}

// Test-only escape hatch.
export function _resetAuthProvider(): void {
  cached = null;
}
