import { beforeEach, describe, expect, it } from "vitest";
import { MemoryAuthProvider } from "./memory-provider";
import { AuthError } from "./types";

// Minimal Storage shim so we can pass a real Storage to the provider in
// hermetic tests without depending on jsdom's window.localStorage state
// leaking across tests.
function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

function tokenFromLink(link: string): string {
  const url = new URL(link, "http://localhost");
  const token = url.searchParams.get("token");
  if (!token) throw new Error("expected token in link");
  return token;
}

describe("MemoryAuthProvider", () => {
  let provider: MemoryAuthProvider;

  beforeEach(() => {
    provider = new MemoryAuthProvider(makeStorage());
  });

  describe("signup → magic-link → session", () => {
    it("creates a user and starts a session on first magic-link consume", async () => {
      const { link } = await provider.requestMagicLink({
        email: "Founder@Example.com",
        displayName: "Founder",
        intent: "signup",
      });
      expect(link).toBeTruthy();

      const session = await provider.consumeMagicLink(tokenFromLink(link as string));

      expect(provider.getSession()).toEqual(session);
      expect(session.user.email).toBe("founder@example.com");
      expect(session.user.displayName).toBe("Founder");
      expect(session.user.id).toBeTruthy();
    });

    it("rejects signup with an already-registered email", async () => {
      const first = await provider.requestMagicLink({
        email: "founder@example.com",
        intent: "signup",
      });
      await provider.consumeMagicLink(tokenFromLink(first.link as string));

      await expect(
        provider.requestMagicLink({ email: "founder@example.com", intent: "signup" }),
      ).rejects.toBeInstanceOf(AuthError);
    });
  });

  describe("login flow", () => {
    it("logs in an existing user with a fresh magic link", async () => {
      const signup = await provider.requestMagicLink({
        email: "ceo@example.com",
        displayName: "CEO",
        intent: "signup",
      });
      await provider.consumeMagicLink(tokenFromLink(signup.link as string));
      await provider.signOut();
      expect(provider.getSession()).toBeNull();

      const login = await provider.requestMagicLink({
        email: "ceo@example.com",
        intent: "login",
      });
      const session = await provider.consumeMagicLink(tokenFromLink(login.link as string));

      expect(session.user.email).toBe("ceo@example.com");
      expect(session.user.displayName).toBe("CEO");
      expect(provider.getSession()).not.toBeNull();
    });

    it("rejects login for an email with no account", async () => {
      await expect(
        provider.requestMagicLink({ email: "nobody@example.com", intent: "login" }),
      ).rejects.toBeInstanceOf(AuthError);
    });

    it("rejects an invalid email", async () => {
      await expect(
        provider.requestMagicLink({ email: "not-an-email", intent: "signup" }),
      ).rejects.toBeInstanceOf(AuthError);
    });
  });

  describe("magic-link tokens", () => {
    it("rejects an unknown / replayed token", async () => {
      const { link } = await provider.requestMagicLink({
        email: "user@example.com",
        intent: "signup",
      });
      const token = tokenFromLink(link as string);
      await provider.consumeMagicLink(token);
      await expect(provider.consumeMagicLink(token)).rejects.toBeInstanceOf(AuthError);
    });
  });

  describe("session persistence", () => {
    it("rehydrates the session from storage in a new instance", async () => {
      const storage = makeStorage();
      const a = new MemoryAuthProvider(storage);
      const { link } = await a.requestMagicLink({
        email: "p@example.com",
        intent: "signup",
        displayName: "P",
      });
      await a.consumeMagicLink(tokenFromLink(link as string));

      const b = new MemoryAuthProvider(storage);
      expect(b.getSession()?.user.email).toBe("p@example.com");
    });

    it("clears the session on signOut and notifies listeners", async () => {
      const events: (string | null)[] = [];
      provider.onSessionChange((s) => events.push(s ? s.user.email : null));

      const { link } = await provider.requestMagicLink({
        email: "x@example.com",
        intent: "signup",
      });
      await provider.consumeMagicLink(tokenFromLink(link as string));
      await provider.signOut();

      expect(provider.getSession()).toBeNull();
      expect(events).toEqual(["x@example.com", null]);
    });
  });

  describe("profile update", () => {
    it("updates the display name and emits a change", async () => {
      const { link } = await provider.requestMagicLink({
        email: "u@example.com",
        intent: "signup",
        displayName: "Old",
      });
      await provider.consumeMagicLink(tokenFromLink(link as string));

      const updated = await provider.updateProfile({ displayName: "New" });

      expect(updated.displayName).toBe("New");
      expect(provider.getSession()?.user.displayName).toBe("New");
    });

    it("refuses to update when not signed in", async () => {
      await expect(provider.updateProfile({ displayName: "x" })).rejects.toBeInstanceOf(AuthError);
    });

    it("refuses an empty display name", async () => {
      const { link } = await provider.requestMagicLink({
        email: "u@example.com",
        intent: "signup",
      });
      await provider.consumeMagicLink(tokenFromLink(link as string));
      await expect(provider.updateProfile({ displayName: "   " })).rejects.toBeInstanceOf(AuthError);
    });
  });
});
