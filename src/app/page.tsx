import { greeting } from "@/lib/hello";

export default function Home() {
  return (
    <main>
      <h1>{greeting("world")}</h1>
      <p>
        This is the hello-world skeleton for the company app. The stack and
        deploy pipeline are documented in <code>docs/adr/0001-stack.md</code>.
      </p>
      <p>
        Build:{" "}
        <code>{process.env.NEXT_PUBLIC_COMMIT_SHA ?? "local"}</code>
      </p>
    </main>
  );
}
