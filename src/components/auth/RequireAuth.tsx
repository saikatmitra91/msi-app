"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

interface Props {
  children: React.ReactNode;
}

// Client-side auth gate. Redirects to /login if there's no session once the
// auth provider has finished loading. Static export means this is the only
// option; we cannot gate at the server.
export function RequireAuth({ children }: Props) {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) router.replace("/login/");
  }, [loading, session, router]);

  if (loading) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }
  if (!session) {
    // Render nothing while the redirect kicks in.
    return null;
  }
  return <>{children}</>;
}
