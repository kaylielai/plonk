import { useState } from "react";
import { X, Check, ArrowRight } from "lucide-react";
import type { SeedIdea } from "@/lib/seed";
import { StampArt } from "./StampArt";
import { AvatarRow } from "./Avatar";

interface IdeaDetailSheetProps {
  idea: SeedIdea | null;
  onClose: () => void;
  onConfirm?: (ideaId: string) => void;
}

export function IdeaDetailSheet({ idea, onClose, onConfirm }: IdeaDetailSheetProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [showCalendarToast, setShowCalendarToast] = useState(false);

  if (!idea) return null;

  const responded = idea.people.filter((p) => p.responded).length;
  const pct = Math.round((responded / idea.people.length) * 100);
  const isSuggested = idea.status === "suggested";
  const isCompleted = idea.status === "completed";

  function handleConfirm() {
    setConfirmed(true);
    onConfirm?.(idea!.id);
    setTimeout(() => {
      setShowCalendarToast(true);
    }, 600);
  }

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-paper shadow-[0_-8px_40px_rgba(0,0,0,0.14)]">
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* close button */}
        <div className="flex justify-end px-5 pt-2">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-ink-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-10" style={{ maxHeight: "78vh" }}>
          {/* tag + recipient */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-sm bg-ink px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
              {idea.tag}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              {idea.recipient}
            </span>
          </div>

          {/* title */}
          <h2 className="mt-3 font-serif text-[26px] font-semibold leading-tight text-foreground">
            {idea.title}
          </h2>

          {/* timeframe */}
          <p className="mt-1 font-mono text-sm text-ink-muted">{idea.timeframe}</p>

          {/* stamp art (small) */}
          <div className="mt-5 flex justify-center">
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-md bg-cream p-2"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 4px 4px, transparent 3px, var(--color-cream) 3.5px)",
                backgroundSize: "8px 8px",
                backgroundPosition: "-4px -4px",
              }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-sm border border-gold/40 bg-gold-soft/50 p-1 text-gold">
                <StampArt tag={idea.tag} className="h-14 w-14" />
                <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider">
                  {idea.tag}
                </span>
              </div>
            </div>
          </div>

          {/* who's free */}
          <div className="mt-6">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              Who's in
            </p>
            <div className="flex flex-col gap-2.5">
              {idea.people.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold ${p.color}`}
                  >
                    {p.initials}
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {p.name}
                  </span>
                  {p.responded ? (
                    <span className="flex items-center gap-1 rounded-full bg-teal-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-teal">
                      <Check className="h-3 w-3" /> Free
                    </span>
                  ) : (
                    <span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* availability meter */}
            {!isCompleted && (
              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-tan-soft">
                  <div
                    className="h-full rounded-full bg-teal transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-right font-mono text-[10px] text-ink-muted">
                  {responded} of {idea.people.length} responded
                </p>
              </div>
            )}
          </div>

          {/* suggested time block */}
          {isSuggested && !confirmed && (
            <div className="mt-6 rounded-2xl bg-gold-soft/40 p-4 ring-1 ring-gold/30">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
                ✦ Suggested time
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
                {idea.suggestedTime}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Based on who's free — confirm to lock it in for everyone.
              </p>
            </div>
          )}

          {/* confirmed state */}
          {confirmed && (
            <div className="mt-6 rounded-2xl bg-teal-soft/40 p-4 ring-1 ring-teal/30">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal">
                ✓ Plan confirmed
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
                {idea.suggestedTime}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Everyone in the thread has been notified.
              </p>
            </div>
          )}

          {/* completed state */}
          {isCompleted && (
            <div className="mt-6 rounded-2xl bg-teal-soft/40 p-4 ring-1 ring-teal/30">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal">
                ✓ This happened
              </p>
              <p className="mt-1 font-serif text-xl font-semibold text-foreground">
                {idea.happenedOn}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Stamp added to your passport.
              </p>
            </div>
          )}

          {/* CTA buttons */}
          <div className="mt-6 flex flex-col gap-3">
            {isSuggested && !confirmed && (
              <>
                <button
                  onClick={handleConfirm}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground active:scale-[0.99]"
                >
                  Confirm time <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button className="w-full rounded-xl border border-border py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                  Suggest different time
                </button>
              </>
            )}

            {confirmed && showCalendarToast && (
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal/40 bg-teal-soft/30 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-teal">
                Add to calendar (coming soon)
              </button>
            )}

            {!isSuggested && !isCompleted && (
              <button className="w-full rounded-xl border border-border/60 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted/60">
                Not happening
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
