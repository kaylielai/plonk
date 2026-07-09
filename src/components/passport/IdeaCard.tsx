import { ArrowRight, Check } from "lucide-react";
import type { SeedIdea } from "@/lib/seed";
import { AvatarRow } from "./Avatar";

export function IdeaCard({ idea }: { idea: SeedIdea }) {
  if (idea.status === "completed") return <CompletedTicket idea={idea} />;
  if (idea.status === "suggested") return <SuggestedTicket idea={idea} />;
  return <CollectingTicket idea={idea} />;
}

/**
 * Boarding-pass shape: main stub (left, ~72%) + tear-off stub (right).
 * A vertical dashed line separates them, with two half-circle notches
 * punched top and bottom for the perforation.
 */
function Ticket({
  children,
  stub,
  accent = "bg-teal",
  highlight = false,
}: {
  children: React.ReactNode;
  stub: React.ReactNode;
  accent?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] ${
        highlight ? "ring-2 ring-magenta/50" : "ring-1 ring-border/60"
      }`}
    >
      {/* colored header band */}
      <div className={`h-2 w-full ${accent}`} />

      <div className="flex">
        <div className="min-w-0 flex-1 p-4 pr-5">{children}</div>

        {/* perforation */}
        <div className="relative flex items-stretch">
          {/* top notch */}
          <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-background" />
          {/* bottom notch */}
          <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-background" />
          <div className="mx-1 my-3 border-l-2 border-dashed border-border" />
        </div>

        <div className="flex w-[92px] shrink-0 flex-col items-center justify-center gap-1 bg-cream/60 p-3 text-center">
          {stub}
        </div>
      </div>
    </div>
  );
}

function TagChip({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center rounded-sm bg-ink px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
      {tag}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </span>
      <span className="mt-0.5 font-mono text-[11px] font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

function CollectingTicket({ idea }: { idea: SeedIdea }) {
  const responded = idea.people.filter((p) => p.responded).length;
  const pct = Math.round((responded / idea.people.length) * 100);
  const high = idea.status === "collecting-high";
  return (
    <Ticket
      accent={high ? "bg-magenta" : "bg-teal"}
      highlight={high}
      stub={
        <>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
            Boarding
          </span>
          <span className={`font-serif text-2xl font-semibold leading-none ${high ? "text-magenta" : "text-teal"}`}>
            {pct}%
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
            {responded}/{idea.people.length} in
          </span>
        </>
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <TagChip tag={idea.tag} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          {idea.recipient}
        </span>
      </div>
      <h3 className="font-serif text-[19px] font-semibold leading-tight text-foreground">
        {idea.title}
      </h3>
      <div className="mt-3 flex items-end justify-between gap-3">
        <Meta label="When" value={idea.timeframe} />
        <AvatarRow people={idea.people} size="sm" max={5} />
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-tan-soft">
        <div
          className={`h-full rounded-full transition-all ${high ? "bg-magenta" : "bg-teal/60"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Ticket>
  );
}

function SuggestedTicket({ idea }: { idea: SeedIdea }) {
  const [day, time] = (idea.suggestedTime ?? "· ").split(" · ");
  return (
    <Ticket
      accent="bg-gold"
      highlight
      stub={
        <>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
            Gate
          </span>
          <span className="font-serif text-2xl font-semibold leading-none text-teal">
            {time || "TBD"}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
            confirm →
          </span>
        </>
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <TagChip tag={idea.tag} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          {idea.recipient}
        </span>
      </div>
      <h3 className="font-serif text-[19px] font-semibold leading-tight text-foreground">
        {idea.title}
      </h3>
      <div className="mt-3 flex items-end justify-between gap-3">
        <Meta label="Suggested" value={day || idea.suggestedTime || ""} />
        <AvatarRow people={idea.people} size="sm" max={5} />
      </div>
      <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition active:scale-[0.99]">
        Confirm time <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </Ticket>
  );
}

function CompletedTicket({ idea }: { idea: SeedIdea }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card/70 opacity-70 ring-1 ring-border/40">
      <div className="h-1.5 w-full bg-ink/20" />
      <div className="flex items-center gap-3 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft">
          <Check className="h-4 w-4 text-teal" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TagChip tag={idea.tag} />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              {idea.recipient}
            </span>
          </div>
          <p className="mt-1 truncate font-serif text-[14px] font-medium text-foreground line-through decoration-ink-muted/50">
            {idea.title}
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          {idea.happenedOn} · stamped
        </span>
      </div>
    </div>
  );
}
