"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardChrome>{children}</DashboardChrome>
    </RequireAuth>
  );
}

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { provider, session } = useAuth();

  async function handleSignOut() {
    await provider.signOut();
    router.replace("/login/");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          padding: "1.5rem 1rem",
          borderRight: "1px solid #1f2533",
          background: "#0a0e15",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Link href="/dashboard/" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
          MSI
        </Link>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1.5rem" }}>
          <Link href="/dashboard/" data-testid="nav-dashboard">
            Dashboard
          </Link>
          <Link href="/dashboard/profile/" data-testid="nav-profile">
            Profile
          </Link>
        </nav>
        <div style={{ marginTop: "auto", paddingTop: "2rem", fontSize: "0.85rem", opacity: 0.7 }}>
          <div data-testid="current-user">{session?.user.displayName}</div>
          <div style={{ opacity: 0.6 }}>{session?.user.email}</div>
          <button
            type="button"
            onClick={handleSignOut}
            data-testid="sign-out"
            style={{
              marginTop: "0.75rem",
              padding: "0.4rem 0.75rem",
              background: "transparent",
              color: "inherit",
              border: "1px solid #2a3142",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <section style={{ flex: 1, padding: "2rem" }}>{children}</section>
    </div>
  );
}
