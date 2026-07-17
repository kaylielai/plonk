import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { useState, useEffect, useMemo } from "react";
import { LogOut, Check, ChevronDown, ShieldAlert } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile, deleteMyAccount } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — plonk" }] }),
  component: ProfilePage,
});


const COVERS = [
  { id: "navy", label: "Navy", hex: "#083D77" },
  { id: "magenta", label: "Bloom", hex: "#DA4167" },
  { id: "gold", label: "Gold", hex: "#F4D35E" },
  { id: "coral", label: "Coral", hex: "#F78764" },
];

const SLOTS = ["morning", "afternoon", "evening"] as const;
type Slot = (typeof SLOTS)[number];
type ScheduleMap = Record<string, Slot[]>;

const DAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profileFn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [cover, setCover] = useState("navy");
  const [view, setView] = useState<"week" | "month">("week");
  const [weekly, setWeekly] = useState<ScheduleMap>({});
  const [monthly, setMonthly] = useState<ScheduleMap>({});

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || "");
      setUsername(profile.username || "");
      setCover(profile.passport_cover_color || "navy");
      setView((profile.schedule_view as "week" | "month") || "week");
      setWeekly((profile.weekly_schedule as ScheduleMap) || {});
      setMonthly((profile.monthly_schedule as ScheduleMap) || {});
    }
  }, [profile]);

  const usernameValid = !username || /^[A-Za-z0-9_]{3,20}$/.test(username);

  async function save() {
    if (!usernameValid) {
      toast.error("Username must be 3-20 letters, numbers, or underscores.");
      return;
    }
    try {
      await updateFn({
        data: {
          display_name: name,
          username: username || null,
          passport_cover_color: cover,
          schedule_view: view,
          weekly_schedule: weekly,
          monthly_schedule: monthly,
        },
      });
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

  function toggleSlot(key: string, slot: Slot) {
    const setter = view === "week" ? setWeekly : setMonthly;
    const current = view === "week" ? weekly : monthly;
    const existing = current[key] || [];
    const next = existing.includes(slot)
      ? existing.filter((s) => s !== slot)
      : [...existing, slot];
    setter({ ...current, [key]: next });
  }

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

        <label className="mt-4 mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Username</label>
        <div className={`flex items-center gap-2 rounded-xl border bg-cream px-4 py-3 ${usernameValid ? "border-border" : "border-destructive"}`}>
          <span className="text-ink-muted">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
            placeholder="username"
            maxLength={20}
            className="flex-1 bg-transparent text-[15px] focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">3–20 letters, numbers, or underscores. Friends add you by @username.</p>

        <p className="mt-5 mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">plonk cover</p>
        <div className="flex justify-center">
          <div className="relative rounded-md shadow-[var(--shadow-stamp)]" style={{ width: 120, height: 165, backgroundColor: activeHex }}>
            <div className="absolute inset-3 rounded-sm border" style={{ borderColor: "rgba(255,255,255,0.25)" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90">
              <span className="text-[10px] tracking-[0.2em]">PLONK</span>
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
      </section>

      <ScheduleSection
        view={view}
        setView={setView}
        weekly={weekly}
        monthly={monthly}
        toggleSlot={toggleSlot}
      />

      <button
        onClick={save}
        className="mx-5 mt-6 w-[calc(100%-2.5rem)] rounded-xl bg-primary py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground"
      >
        Save changes
      </button>

      <button
        onClick={signOut}
        className="mx-5 mt-3 mb-4 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-xl border border-destructive/40 py-3 text-sm text-destructive"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </AppShell>
  );
}

function ScheduleSection({
  view,
  setView,
  weekly,
  monthly,
  toggleSlot,
}: {
  view: "week" | "month";
  setView: (v: "week" | "month") => void;
  weekly: ScheduleMap;
  monthly: ScheduleMap;
  toggleSlot: (key: string, slot: Slot) => void;
}) {
  const monthDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const last = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: last }, (_, i) => {
      const d = new Date(year, month, i + 1);
      const key = d.toISOString().slice(0, 10);
      return { key, day: i + 1, weekday: d.toLocaleDateString(undefined, { weekday: "short" }) };
    });
  }, []);

  return (
    <section className="mx-5 mt-5 rounded-3xl bg-paper p-5 ring-1 ring-border/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Your schedule</p>
          <p className="mt-0.5 text-[15px] font-semibold">When are you free?</p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-cream p-1 text-xs font-medium">
          <button
            onClick={() => setView("week")}
            className={`rounded-full px-3 py-1.5 transition ${view === "week" ? "bg-primary text-primary-foreground" : "text-ink-muted"}`}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={`rounded-full px-3 py-1.5 transition ${view === "month" ? "bg-primary text-primary-foreground" : "text-ink-muted"}`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {view === "week"
          ? DAYS.map((d) => (
              <ScheduleRow
                key={d.id}
                label={d.label}
                selected={weekly[d.id] || []}
                onToggle={(s) => toggleSlot(d.id, s)}
              />
            ))
          : (
            <div className="max-h-[420px] overflow-y-auto pr-1">
              {monthDays.map((d) => (
                <ScheduleRow
                  key={d.key}
                  label={`${d.weekday} ${d.day}`}
                  selected={monthly[d.key] || []}
                  onToggle={(s) => toggleSlot(d.key, s)}
                />
              ))}
            </div>
          )}
      </div>
    </section>
  );
}

function ScheduleRow({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: Slot[];
  onToggle: (s: Slot) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border/40 py-2 last:border-b-0">
      <span className="w-16 shrink-0 text-xs font-medium text-ink-muted">{label}</span>
      <div className="flex flex-1 gap-1.5">
        {SLOTS.map((s) => {
          const active = selected.includes(s);
          return (
            <button
              key={s}
              onClick={() => onToggle(s)}
              className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium uppercase tracking-wider transition ${
                active
                  ? "bg-teal text-primary-foreground"
                  : "bg-cream text-ink-muted hover:bg-secondary"
              }`}
            >
              {s[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
