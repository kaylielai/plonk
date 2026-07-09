import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { seedGroups } from "@/lib/seed";
import { ChevronRight, Plus } from "lucide-react";

export const Route = createFileRoute("/groups")({
  head: () => ({ meta: [{ title: "Groups — Passport" }] }),
  component: GroupsPage,
});

function GroupsPage() {
  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pb-4 pt-8">
        <h1 className="text-[26px] font-semibold tracking-tight">Groups</h1>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className="h-5 w-5" />
        </button>
      </header>
      <div className="flex flex-col gap-2 px-5">
        {seedGroups.map((g) => (
          <button
            key={g.id}
            className="flex items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-card)] ring-1 ring-border/50"
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${g.color}`}>
              {g.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{g.name}</p>
              <p className="text-xs text-ink-muted">4 members · 2 active ideas</p>
            </div>
            <ChevronRight className="h-4 w-4 text-ink-muted" />
          </button>
        ))}
      </div>
    </AppShell>
  );
}
