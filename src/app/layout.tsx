import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSI App",
  description: "Hello-world skeleton — see ADR-0001 for stack rationale.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
