import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { useState, useEffect } from "react";
import { LogOut, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Passport" }] }),
  component: ProfilePage,
});

const COVERS = [
  { id: "navy", label: "Navy", hex: "#083D77" },
  { id: "magenta", label: "Bloom", hex: "#DA4167" },
  { id: "gold", label: "Gold", hex: "#F4D35E" },
  { id: "coral", label: "Coral", hex: "#F78764" },
];

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profileFn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const [name, setName] = useState("");
  const [cover, setCover] = useState("navy");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || "");
      setCover(profile.passport_cover_color || "navy");
    }
  }, [profile]);

  async function save() {
    try {
      await updateFn({ data: { display_name: name, passport_cover_color: cover } });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const activeHex = COVERS.find((c) => c.id === cover)?.hex ?? COVERS[0].hex;

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-[26px] font-semibold tracking-tight">Profile</h1>
      </header>

      <section className="mx-5 mt-4 rounded-3xl bg-paper p-5 ring-1 ring-border/40">
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Display name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-[15px]"
        />

        <p className="mt-5 mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Passport cover</p>
        <div className="flex justify-center">
          <div className="relative rounded-md shadow-[var(--shadow-stamp)]" style={{ width: 120, height: 165, backgroundColor: activeHex }}>
            <div className="absolute inset-3 rounded-sm border" style={{ borderColor: "rgba(255,255,255,0.25)" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90">
              <span className="text-[10px] tracking-[0.2em]">PASSPORT</span>
              <span className="text-[9px] tracking-[0.18em] opacity-70">{name || "your name"}</span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-center gap-3">
          {COVERS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCover(c.id)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${
                cover === c.id ? "ring-2 ring-teal ring-offset-2 ring-offset-paper" : ""
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {cover === c.id && <Check className="h-4 w-4 text-white drop-shadow" />}
            </button>
          ))}
        </div>

        <button onClick={save} className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground">
          Save changes
        </button>
      </section>

      <button
        onClick={signOut}
        className="mx-5 mt-6 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-xl border border-destructive/40 py-3 text-sm text-destructive"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </AppShell>
  );
}
