"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuthProvider } from "./provider";
import type { AuthProvider, Session } from "./types";

interface AuthContextValue {
  session: Session | null;
  // True until we've read initial state from the provider on mount. While
  // loading, gated UI should show a spinner / skeleton rather than redirect.
  loading: boolean;
  provider: AuthProvider;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const provider = useMemo(() => getAuthProvider(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(provider.getSession());
    setLoading(false);
    return provider.onSessionChange(setSession);
  }, [provider]);

  return (
    <AuthContext.Provider value={{ session, loading, provider }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthContextProvider>");
  return ctx;
}
