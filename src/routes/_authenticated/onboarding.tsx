import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — plonk" }] }),
  component: OnboardingPage,
});

const COVERS = [
  { id: "navy", label: "Navy", hex: "#083D77" },
  { id: "magenta", label: "Bloom", hex: "#DA4167" },
  { id: "gold", label: "Gold", hex: "#F4D35E" },
  { id: "coral", label: "Coral", hex: "#F78764" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const getProfile = useServerFn(getMyProfile);
  const updateProfile = useServerFn(updateMyProfile);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [cover, setCover] = useState("navy");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.onboarded_at) {
        navigate({ to: "/" });
      } else {
        setName(profile.display_name || "");
        setUsername(profile.username || "");
        setCover(profile.passport_cover_color || "navy");
      }
    }
  }, [profile, navigate]);

  const usernameValid = /^[A-Za-z0-9_]{3,20}$/.test(username);

  async function finish() {
    if (!name.trim() || !usernameValid) return;
    setSaving(true);
    try {
      await updateProfile({
        data: {
          display_name: name.trim(),
          username,
          passport_cover_color: cover,
          complete_onboarding: true,
        },
      });
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-16 pb-8">
      <div className="mx-auto w-full max-w-sm flex-1">
        {step === 0 && (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal text-primary-foreground mb-4">
                <span className="text-2xl">✦</span>
              </div>
              <h1 className="text-[26px] font-semibold tracking-tight">Welcome to plonk.</h1>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                A place to plan real hangouts with the people who matter — and collect a stamp for every one that actually happens.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground"
            >
              Get started
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Step 1 of 2</p>
            <h1 className="text-[24px] font-semibold tracking-tight">What should we call you?</h1>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your name"
              className="mt-6 w-full rounded-xl border border-border bg-paper px-4 py-3 text-[17px] focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            />

            <label className="mt-6 block text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Pick a username</label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-paper px-4 py-3">
              <span className="text-ink-muted">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
                placeholder="username"
                maxLength={20}
                className="flex-1 bg-transparent text-[17px] focus:outline-none"
              />
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              3–20 letters, numbers, or underscores. Friends use this to add you to groups.
            </p>

            <button
              onClick={() => setStep(2)}
              disabled={!name.trim() || !usernameValid}
              className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"
            >
              Next
            </button>
          </>
        )}


        {step === 2 && (
          <>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Step 2 of 2</p>
            <h1 className="text-[24px] font-semibold tracking-tight">Pick your plonk cover.</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Every hangout that actually happens becomes a stamp inside your book.
            </p>

            <div className="mt-8 flex justify-center">
              <div
                className="relative rounded-md shadow-[var(--shadow-stamp)]"
                style={{
                  width: 160,
                  height: 220,
                  backgroundColor: COVERS.find((c) => c.id === cover)?.hex,
                }}
              >
                <div
                  className="absolute inset-4 rounded-sm border"
                  style={{ borderColor: "rgba(255,255,255,0.25)" }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" />
                    </svg>
                  </div>
                  <span className="text-[11px] tracking-[0.2em]">PLONK</span>
                  <span className="mt-1 text-[10px] tracking-[0.18em] opacity-70">{name || "your name"}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              {COVERS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCover(c.id)}
                  aria-label={c.label}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${
                    cover === c.id ? "ring-2 ring-teal ring-offset-2 ring-offset-background" : ""
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {cover === c.id && <Check className="h-4 w-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>

            <button
              onClick={finish}
              disabled={saving}
              className="mt-10 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"
            >
              {saving ? "…" : "Enter plonk"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
