import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { useState, useEffect, useMemo } from "react";
import { LogOut, Check, ChevronDown, ShieldAlert, Settings as SettingsIcon, X } from "lucide-react";
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
  const [settingsOpen, setSettingsOpen] = useState(false);


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
      <header className="flex items-center justify-between px-5 pb-2 pt-8">
        <h1 className="text-[26px] font-semibold tracking-tight">Profile</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="rounded-full p-2 text-ink-muted hover:bg-secondary hover:text-foreground transition"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
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
        className="mx-5 mt-6 mb-6 w-[calc(100%-2.5rem)] rounded-xl bg-primary py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground"
      >
        Save changes
      </button>

      {settingsOpen && (
        <SettingsSheet onClose={() => setSettingsOpen(false)} onSignedOut={signOut} />
      )}
    </AppShell>
  );
}

function SettingsSheet({ onClose, onSignedOut }: { onClose: () => void; onSignedOut: () => Promise<void> }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[18px] font-semibold">
            <SettingsIcon className="h-4 w-4" /> Settings
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <AdvancedSecurity onSignedOut={onSignedOut} />

        <button
          onClick={onSignedOut}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 py-3 text-sm text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}


function AdvancedSecurity({ onSignedOut }: { onSignedOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [delLoading, setDelLoading] = useState(false);
  const deleteFn = useServerFn(deleteMyAccount);

  async function changePassword() {
    if (pw.length < 6) return toast.error("Password must be at least 6 characters.");
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwLoading(false);
    if (error) return toast.error(error.message);
    setPw("");
    toast.success("Password updated");
  }

  async function sendReset() {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (!email) return toast.error("No email on account.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) return toast.error(error.message);
    toast.success("Reset link sent to " + email);
  }

  async function deleteAccount() {
    if (confirmDelete !== "DELETE") return toast.error('Type "DELETE" to confirm.');
    setDelLoading(true);
    try {
      await deleteFn({ data: { confirm: "DELETE" } });
      toast.success("Account deleted");
      await onSignedOut();
    } catch (err) {
      setDelLoading(false);
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <section className="rounded-3xl bg-paper ring-1 ring-border/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-[14px] font-semibold">
          <ShieldAlert className="h-4 w-4 text-destructive" /> Advanced security options
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border/40 px-5 py-5 space-y-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Change password</p>
            <div className="mt-2 flex gap-2">
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="new password"
                minLength={6}
                className="flex-1 rounded-xl border border-border bg-cream px-4 py-2.5 text-sm"
              />
              <button
                onClick={changePassword}
                disabled={pwLoading}
                className="rounded-xl bg-primary px-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
              >
                Update
              </button>
            </div>
            <button onClick={sendReset} className="mt-2 text-xs text-ink-muted underline hover:text-foreground">
              Email me a reset link instead
            </button>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Forgot your username?</p>
            <p className="mt-1 text-xs text-ink-muted">
              Your @username is shown at the top of this Profile tab. Edit it any time in the Username field above.
            </p>
          </div>

          <div className="rounded-2xl border border-destructive/40 p-4">
            <p className="text-[13px] font-semibold text-destructive">Delete account</p>
            <p className="mt-1 text-xs text-ink-muted">
              Permanently removes your profile, stamps, groups, and sign-in. This cannot be undone.
            </p>
            <input
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="mt-3 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm"
            />
            <button
              onClick={deleteAccount}
              disabled={delLoading || confirmDelete !== "DELETE"}
              className="mt-2 w-full rounded-xl bg-destructive py-2.5 text-xs font-semibold uppercase tracking-wider text-destructive-foreground disabled:opacity-40"
            >
              {delLoading ? "Deleting…" : "Delete my account forever"}
            </button>
          </div>
        </div>
      )}
    </section>
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
