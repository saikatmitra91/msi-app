import type { Metadata } from "next";
import "./globals.css";
import { AuthContextProvider } from "@/lib/auth/AuthContext";

export const metadata: Metadata = {
  title: "MSI App",
  description: "Hello-world skeleton — see ADR-0001 for stack rationale.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthContextProvider>{children}</AuthContextProvider>
      </body>
    </html>
  );
}
