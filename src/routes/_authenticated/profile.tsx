import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { useState } from "react";
import { Bell, Calendar, Lock, LogOut, ChevronRight, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Passport" }] }),
  component: ProfilePage,
});

const covers = [
  { id: "cream", label: "Cream", hex: "oklch(0.972 0.012 85)" },
  { id: "teal", label: "Teal", hex: "oklch(0.475 0.062 195)" },
  { id: "gold", label: "Gold", hex: "oklch(0.71 0.13 78)" },
  { id: "terracotta", label: "Terracotta", hex: "oklch(0.62 0.13 40)" },
  { id: "navy", label: "Navy", hex: "oklch(0.32 0.06 260)" },
  { id: "sage", label: "Sage", hex: "oklch(0.65 0.06 150)" },
];

function ProfilePage() {
  const [cover, setCover] = useState("teal");
  const activeHex = covers.find((c) => c.id === cover)?.hex ?? covers[0].hex;

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-[26px] font-semibold tracking-tight">Profile</h1>
      </header>

      {/* Identity */}
      <section className="px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal text-lg font-semibold text-primary-foreground">
            MO
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold">Maya Ortiz</p>
            <p className="text-xs text-ink-muted">UCSD · San Diego</p>
          </div>
          <button className="text-xs font-medium text-teal">Edit</button>
        </div>
      </section>

      {/* Passport cover */}
      <section className="mx-5 mt-4 rounded-3xl bg-paper p-5 ring-1 ring-border/40">
        <h2 className="font-serif text-lg font-semibold">Your Passport</h2>
        <div className="mt-4 flex justify-center">
          <PassportBooklet color={activeHex} />
        </div>
        <div className="mt-5 flex justify-between gap-2">
          {covers.map((c) => (
            <button
              key={c.id}
              onClick={() => setCover(c.id)}
              aria-label={c.label}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full ring-offset-2 ring-offset-paper transition ${
                cover === c.id ? "ring-2 ring-teal" : ""
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {cover === c.id && <Check className="h-4 w-4 text-white drop-shadow" />}
            </button>
          ))}
        </div>
      </section>

      {/* Settings */}
      <section className="mx-5 mt-6 overflow-hidden rounded-2xl bg-paper ring-1 ring-border/40">
        <Row icon={Bell} label="Notifications" />
        <Row icon={Calendar} label="Availability" />
        <Row icon={Lock} label="Privacy" />
        <Row icon={LogOut} label="Log out" destructive />
      </section>
    </AppShell>
  );
}

function Row({
  icon: Icon,
  label,
  destructive = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  destructive?: boolean;
}) {
  return (
    <button className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3.5 text-left last:border-b-0">
      <Icon className={`h-4 w-4 ${destructive ? "text-destructive" : "text-ink-muted"}`} />
      <span className={`flex-1 text-sm ${destructive ? "text-destructive" : "text-foreground"}`}>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-ink-muted" />
    </button>
  );
}

export function PassportBooklet({ color, size = 140 }: { color: string; size?: number }) {
  return (
    <div
      className="relative rounded-md shadow-[var(--shadow-stamp)]"
      style={{
        width: size,
        height: size * 1.35,
        backgroundColor: color,
      }}
    >
      <div
        className="absolute inset-3 rounded-sm border"
        style={{ borderColor: "rgba(255,255,255,0.25)" }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" />
          </svg>
        </div>
        <span className="font-serif text-[11px] tracking-[0.2em]">PASSPORT</span>
      </div>
    </div>
  );
}
