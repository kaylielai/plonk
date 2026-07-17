import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — plonk" },
      { name: "description", content: "Set a new password for your plonk account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery hash and emits PASSWORD_RECOVERY / SIGNED_IN.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        {!ready && (
          <p className="text-sm text-ink-muted">
            Open this page from the reset link in your email. If you got here directly, request a new reset link from the sign-in page.
          </p>
        )}
        <input
          type="password"
          placeholder="new password"
          value={password}
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-paper px-4 py-3 text-[15px]"
        />
        <button
          type="submit"
          disabled={!ready || loading}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"
        >
          {loading ? "…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
