import { ArrowRight, Check } from "lucide-react";
import type { SeedIdea } from "@/lib/seed";
import { AvatarRow } from "./Avatar";

export function IdeaCard({ idea }: { idea: SeedIdea }) {
  if (idea.status === "completed") return <CompletedCard idea={idea} />;
  if (idea.status === "suggested") return <SuggestedCard idea={idea} />;
  return <CollectingCard idea={idea} />;
}

function CardShell({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-card p-5 shadow-[var(--shadow-card)] transition-all ${
        highlight ? "ring-1 ring-teal/40" : "ring-1 ring-border/60"
      }`}
    >
      {children}
    </div>
  );
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium tracking-wide text-paper">
      {tag}
    </span>
  );
}

function TopRow({ idea }: { idea: SeedIdea }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-2">
      <TagPill tag={idea.tag} />
      <span className="text-xs text-ink-muted">{idea.recipient}</span>
    </div>
  );
}

function CollectingCard({ idea }: { idea: SeedIdea }) {
  const responded = idea.people.filter((p) => p.responded).length;
  const pct = Math.round((responded / idea.people.length) * 100);
  const high = idea.status === "collecting-high";
  return (
    <CardShell highlight={high}>
      <TopRow idea={idea} />
      <h3 className="text-[17px] font-semibold leading-snug text-foreground">{idea.title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{idea.timeframe}</p>
      <div className="mt-4 flex items-center justify-between">
        <AvatarRow people={idea.people} />
        <span className="text-xs font-medium text-ink-muted">
          {responded}/{idea.people.length} free
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-tan-soft">
        <div
          className={`h-full rounded-full transition-all ${high ? "bg-teal" : "bg-ink-muted/40"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </CardShell>
  );
}

function SuggestedCard({ idea }: { idea: SeedIdea }) {
  return (
    <CardShell highlight>
      <TopRow idea={idea} />
      <h3 className="text-[17px] font-semibold leading-snug text-foreground">{idea.title}</h3>
      <p className="mt-2 text-sm font-medium text-teal">{idea.suggestedTime} suggested</p>
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.99]">
        Confirm time <ArrowRight className="h-4 w-4" />
      </button>
    </CardShell>
  );
}

function CompletedCard({ idea }: { idea: SeedIdea }) {
  return (
    <div className="rounded-2xl bg-card/70 p-4 opacity-60 ring-1 ring-border/50">
      <div className="mb-1 flex items-center justify-between">
        <TagPill tag={idea.tag} />
        <span className="text-xs text-ink-muted">{idea.recipient}</span>
      </div>
      <h3 className="text-[15px] font-medium text-foreground line-through decoration-ink-muted/50">
        {idea.title}
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
        <Check className="h-3.5 w-3.5" />
        happened {idea.happenedOn} · stamp added
      </p>
    </div>
  );
}
