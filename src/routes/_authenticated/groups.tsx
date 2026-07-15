import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { seedGroups, seedIdeas, type SeedIdea } from "@/lib/seed";
import { ChevronRight, Plus, ArrowLeft, MoreVertical, Check } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/groups")({
  head: () => ({ meta: [{ title: "Groups — Plonk" }] }),
  component: GroupsPage,
});

function GroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (selectedGroup) {
    return (
      <GroupDetail
        groupName={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pb-4 pt-8">
        <h1 className="font-serif text-[26px] font-semibold tracking-tight">Groups</h1>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className="h-5 w-5" />
        </button>
      </header>

      {/* recent contacts row */}
      <div className="flex gap-4 px-5 pb-5">
        {seedGroups.slice(0, 3).map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGroup(g.name)}
            className="flex flex-col items-center gap-1.5"
          >
            <span className={`flex h-16 w-16 items-center justify-center rounded-full text-sm font-semibold ${g.color}`}>
              {g.name.slice(0, 2).toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      {/* groups label */}
      <div className="px-5 pb-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Groups</span>
      </div>

      {/* group list */}
      <div className="flex flex-col gap-0 px-5">
        {seedGroups.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGroup(g.name)}
            className="flex items-center gap-4 py-3 text-left"
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold ${g.color}`}>
              {g.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="font-serif text-[20px] font-semibold text-foreground">{g.name}</span>
          </button>
        ))}
      </div>
    </AppShell>
  );
}

// Group detail ideas sorted by date label
const DATE_LABELS = ["Saturday", "Tuesday"];

function GroupDetail({ groupName, onBack }: { groupName: string; onBack: () => void }) {
  const group = seedGroups.find((g) => g.name === groupName);
  const ideas = seedIdeas.filter((i) => i.recipient === groupName);

  // Group ideas by fake date sections for the wireframe layout
  const sections: { label: string; ideas: SeedIdea[] }[] = [
    { label: "Saturday", ideas: ideas.filter((i) => i.status === "completed") },
    { label: "Tuesday", ideas: ideas.filter((i) => i.status !== "completed") },
  ].filter((s) => s.ideas.length > 0);

  if (sections.length === 0) {
    sections.push({ label: "Upcoming", ideas: ideas });
  }

  return (
    <AppShell>
      {/* header */}
      <header className="flex items-center justify-between px-5 pb-4 pt-8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${group?.color ?? "bg-secondary"}`}>
            {groupName.slice(0, 2).toUpperCase()}
          </span>
          <span className="font-serif text-[20px] font-semibold text-foreground">{groupName}</span>
        </div>
        <button className="text-ink-muted">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      {/* sections */}
      <div className="flex flex-col gap-6 px-5 pb-6">
        {sections.map((section) => (
          <div key={section.label}>
            {/* date label */}
            <p className="mb-3 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {section.label}
            </p>

            <div className="flex flex-col gap-3">
              {section.ideas.map((idea) => (
                <GroupIdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </div>
        ))}

        {ideas.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-3xl">✦</span>
            <p className="font-serif text-lg font-medium text-foreground">No ideas yet</p>
            <p className="text-sm text-ink-muted">Tap + to drop the first one</p>
          </div>
        )}
      </div>

      {/* group bottom action bar */}
      <div className="fixed bottom-[72px] inset-x-0 z-30">
        <div className="mx-auto flex max-w-[430px] items-center justify-around px-10 py-3">
          <button className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-ink-muted shadow-[var(--shadow-card)]">
            <span className="text-lg">👥</span>
          </button>
          <button className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)]">
            <Plus className="h-6 w-6" />
          </button>
          <button className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-ink-muted shadow-[var(--shadow-card)]">
            <span className="text-lg">📅</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function GroupIdeaCard({ idea }: { idea: SeedIdea }) {
  const isCompleted = idea.status === "completed";
  const isSuggested = idea.status === "suggested";
  const responded = idea.people.filter((p) => p.responded).length;

  return (
    <div className="relative overflow-visible rounded-2xl bg-card shadow-[var(--shadow-card)] ring-1 ring-border/50">
      {/* topic tab */}
      <div className="absolute -top-3 left-4 inline-flex rounded-b-none rounded-t-xl bg-ink px-3 py-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
          {idea.tag}
        </span>
      </div>

      <div className="px-4 pb-4 pt-6">
        <h3 className="font-serif text-[18px] font-semibold text-foreground">{idea.title}</h3>

        {isSuggested ? (
          <p className="mt-0.5 text-sm text-ink-muted">{idea.suggestedTime}</p>
        ) : isCompleted ? (
          <p className="mt-0.5 text-sm text-ink-muted">{idea.happenedOn}</p>
        ) : (
          <p className="mt-0.5 text-sm text-ink-muted">{idea.timeframe}</p>
        )}

        {isCompleted ? (
          <div className="mt-3 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-teal" />
            <span className="font-mono text-[11px] text-teal">stamp granted</span>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between">
            {/* avatar stack */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {idea.people.slice(0, 3).map((p) => (
                  <span
                    key={p.id}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-semibold ${p.color}`}
                  >
                    {p.initials}
                  </span>
                ))}
              </div>
              <span className="text-xs text-ink-muted">
                {responded} of {idea.people.length} confirmed
              </span>
            </div>

            {/* confirm button on suggested */}
            {isSuggested && (
              <button className="rounded-full bg-teal px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-white">
                Confirm
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
