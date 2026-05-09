// Thin observability shim. See ADR-0001.
//
// Today this is a no-op wrapper around `console` so the rest of the codebase
// can call `track.error(...)` / `track.event(...)` without caring whether
// Sentry is wired up. When we provision Sentry, this module becomes the
// single place that swaps `console` for `@sentry/nextjs`.

type Extra = Record<string, unknown>;

function isEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export const track = {
  event(name: string, extra?: Extra) {
    if (isEnabled()) {
      // TODO(MSI-?): forward to Sentry.captureMessage / addBreadcrumb.
    }
    if (process.env.NODE_ENV !== "production") {
      console.info(`[event] ${name}`, extra ?? {});
    }
  },
  error(err: unknown, extra?: Extra) {
    if (isEnabled()) {
      // TODO(MSI-?): forward to Sentry.captureException.
    }
    console.error("[error]", err, extra ?? {});
  },
};
