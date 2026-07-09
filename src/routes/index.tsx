import { createFileRoute } from "@tanstack/react-router";
import { Plus, Bell } from "lucide-react";
import { AppShell } from "@/components/passport/BottomNav";
import { IdeaCard } from "@/components/passport/IdeaCard";
import { seedGroups, seedIdeas } from "@/lib/seed";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Passport — a passport for your friendships" },
      { name: "description", content: "Turn vague hangout plans into real ones. Collect a stamp for every hangout that actually happens." },
      { property: "og:title", content: "Passport — a passport for your friendships" },
      { property: "og:description", content: "Turn vague hangout plans into real ones. Collect a stamp for every hangout that actually happens." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [filter, setFilter] = useState<string | null>(null);
  const visible = filter ? seedIdeas.filter((i) => i.recipient === filter) : seedIdeas;

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pb-3 pt-6">
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
          Let&apos;s hang.
        </h1>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-ink"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />
          </button>
          <button
            aria-label="New idea"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)] active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Pinned groups */}
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-5 py-3">
        {seedGroups.map((g) => {
          const active = filter === g.name;
          return (
            <button
              key={g.id}
              onClick={() => setFilter(active ? null : g.name)}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold transition-all ${g.color} ${
                  active ? "ring-2 ring-teal ring-offset-2 ring-offset-background" : ""
                }`}
              >
                {g.name.slice(0, 2).toUpperCase()}
              </span>
              <span className={`text-[11px] ${active ? "text-teal font-medium" : "text-ink-muted"}`}>
                {g.name}
              </span>
            </button>
          );
        })}
        <button className="flex flex-col items-center gap-1.5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border text-ink-muted">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-[11px] text-ink-muted">New</span>
        </button>
      </div>

      {/* Feed header */}
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-ink-muted">UPCOMING</span>
        <button className="text-[11px] font-semibold tracking-[0.14em] text-ink-muted">FILTER</button>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-6">
        {visible.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
    </AppShell>
  );
}
