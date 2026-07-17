import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// The Supabase auth.oauth namespace is beta; local typed wrapper for the 3 methods we call.
type OAuthDetails = {
  client?: { name?: string; redirect_uri?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};
type OAuthResult = { data: OAuthDetails | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId =
      new URLSearchParams(location.search).get("authorization_id") ?? "";
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-semibold text-foreground mb-2">Could not load this request</h1>
        <p className="text-sm text-ink-muted">{String((error as Error)?.message ?? error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-primary-foreground mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" />
            </svg>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            Connect {clientName} to plonk
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {clientName} will be able to call plonk's tools while you are signed in — reading your
            feed, groups, and stamps and creating new hangout ideas as you.
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            This does not bypass plonk's permissions.
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-3 rounded-lg bg-coral/10 px-3 py-2 text-xs text-coral">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50 active:scale-[0.99] transition"
          >
            {busy ? "…" : "Approve"}
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="w-full rounded-xl border border-border bg-paper py-3 text-sm font-medium text-foreground disabled:opacity-50 hover:bg-secondary transition"
          >
            Cancel connection
          </button>
        </div>
      </div>
    </main>
  );
}
