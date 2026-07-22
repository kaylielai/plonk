import { ArrowRight, Check, Sunrise, Sun, Moon } from "lucide-react";

/**
 * Display-model for an idea card — normalized from DB queries.
 */
export interface DisplayIdea {
  id: string;
  title: string;
  tag: string;
  timeframe: string;
  recipient: string;
  status: "collecting" | "suggested" | "confirmed" | "completed" | "stale";
  participantCount: number;
  respondedCount: number;
  suggestedLabel?: string;
  confirmedTime?: string;
  /** ISO date YYYY-MM-DD of the planned day, if set */
  targetDate?: string;
  /** Time bands (morning/afternoon/evening) with unanimous overlap on the target date */
  availableBands?: Array<"mornings" | "afternoons" | "evenings">;
  people: { initials: string; color: string; responded: boolean }[];
}


const AVATAR_COLORS = [
  "bg-teal-soft text-teal",
  "bg-gold-soft text-gold",
  "bg-magenta-soft text-magenta",
  "bg-coral-soft text-coral",
  "bg-tan text-ink",
];

export function pickColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function IdeaCard({ idea, onClick }: { idea: DisplayIdea; onClick?: () => void }) {
  if (idea.status === "completed") return <CompletedTicket idea={idea} onClick={onClick} />;
  if (idea.status === "confirmed") return <ConfirmedTicket idea={idea} onClick={onClick} />;
  if (idea.status === "suggested") return <SuggestedTicket idea={idea} onClick={onClick} />;
  return <CollectingTicket idea={idea} onClick={onClick} />;
}

function Ticket({
  children,
  stub,
  accent = "bg-teal",
  highlight = false,
  onClick,
}: {
  children: React.ReactNode;
  stub: React.ReactNode;
  accent?: string;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] cursor-pointer transition active:scale-[0.99] ${
        highlight ? "ring-2 ring-magenta/40" : "ring-1 ring-border/60"
      }`}
    >
      <div className={`h-2 w-full ${accent}`} />
      <div className="flex">
        <div className="min-w-0 flex-1 p-4 pr-5">{children}</div>
        <div className="relative flex items-stretch">
          <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-background" />
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
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">{label}</span>
      <span className="mt-0.5 font-mono text-[11px] font-semibold text-foreground">{value}</span>
    </div>
  );
}

function AvatarStack({ people, max = 4 }: { people: DisplayIdea["people"]; max?: number }) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <span
          key={i}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-paper ${
            p.responded ? p.color : "bg-tan-soft text-ink-muted opacity-60"
          }`}
        >
          {p.initials}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-tan text-[10px] font-medium text-ink-muted ring-2 ring-paper">
          +{overflow}
        </span>
      )}
    </div>
  );
}

function CollectingTicket({ idea, onClick }: { idea: DisplayIdea; onClick?: () => void }) {
  const pct = idea.participantCount === 0 ? 0 : Math.round((idea.respondedCount / idea.participantCount) * 100);
  const high = pct >= 60;
  return (
    <Ticket
      accent={high ? "bg-magenta" : "bg-teal"}
      highlight={high}
      onClick={onClick}
      stub={
        <>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">Boarding</span>
          <span className={`text-2xl font-semibold leading-none ${high ? "text-magenta" : "text-teal"}`}>{pct}%</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
            {idea.respondedCount}/{idea.participantCount} in
          </span>
        </>
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <TagChip tag={idea.tag} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted truncate max-w-[45%]">{idea.recipient}</span>
      </div>
      <h3 className="text-[18px] font-semibold leading-tight text-foreground">{idea.title}</h3>
      <div className="mt-3 flex items-end justify-between gap-3">
        <Meta label="When" value={idea.timeframe} />
        <AvatarStack people={idea.people} />
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-tan-soft">
        <div className={`h-full rounded-full ${high ? "bg-magenta" : "bg-teal/60"}`} style={{ width: `${pct}%` }} />
      </div>
    </Ticket>
  );
}

function SuggestedTicket({ idea, onClick }: { idea: DisplayIdea; onClick?: () => void }) {
  return (
    <Ticket
      accent="bg-gold"
      highlight
      onClick={onClick}
      stub={
        <>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">Gate</span>
          <span className="text-lg font-semibold leading-tight text-teal text-center break-words">
            {idea.suggestedLabel?.split(" ").slice(-1)[0] || "TBD"}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">confirm →</span>
        </>
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <TagChip tag={idea.tag} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted truncate max-w-[45%]">{idea.recipient}</span>
      </div>
      <h3 className="text-[18px] font-semibold leading-tight text-foreground">{idea.title}</h3>
      <div className="mt-3 flex items-end justify-between gap-3">
        <Meta label="Suggested" value={idea.suggestedLabel ?? ""} />
        <AvatarStack people={idea.people} />
      </div>
      <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
        Confirm time <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </Ticket>
  );
}

function ConfirmedTicket({ idea, onClick }: { idea: DisplayIdea; onClick?: () => void }) {
  return (
    <Ticket
      accent="bg-teal"
      onClick={onClick}
      stub={
        <>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">Locked</span>
          <Check className="h-6 w-6 text-teal" />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">add photo</span>
        </>
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <TagChip tag={idea.tag} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted truncate max-w-[45%]">{idea.recipient}</span>
      </div>
      <h3 className="text-[18px] font-semibold leading-tight text-foreground">{idea.title}</h3>
      <div className="mt-3 flex items-end justify-between gap-3">
        <Meta label="Confirmed" value={idea.confirmedTime ?? ""} />
        <AvatarStack people={idea.people} />
      </div>
    </Ticket>
  );
}

function CompletedTicket({ idea, onClick }: { idea: DisplayIdea; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl bg-card/70 ring-1 ring-border/40 cursor-pointer"
    >
      <div className="h-1.5 w-full bg-ink/20" />
      <div className="flex items-center gap-3 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft">
          <Check className="h-4 w-4 text-teal" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TagChip tag={idea.tag} />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted truncate">{idea.recipient}</span>
          </div>
          <p className="mt-1 truncate text-[14px] font-medium text-foreground line-through decoration-ink-muted/50">{idea.title}</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">stamped</span>
      </div>
    </div>
  );
}
