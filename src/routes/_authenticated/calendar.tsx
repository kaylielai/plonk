import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { seedIdeas } from "@/lib/seed";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Plonk" }] }),
  component: CalendarPage,
});

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const IDEA_DATES: Record<string, typeof seedIdeas[number][]> = {
  "2026-07-06": [seedIdeas[3]],
  "2026-07-10": [seedIdeas[2]],
  "2026-07-19": [seedIdeas[1]],
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}

function CalendarPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const selectedIdeas = selectedDate ? (IDEA_DATES[selectedDate] ?? []) : [];
  const selectedLabel = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <AppShell>
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-[26px] font-semibold tracking-tight text-foreground">
            {MONTHS[month]} {year}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-ink-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-ink-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar grid — dark background matching your wireframe */}
        <div className="rounded-2xl bg-ink overflow-hidden">
          <div className="grid grid-cols-7 px-3 pt-4 pb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center font-mono text-[11px] uppercase tracking-wider text-paper/50">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1 px-3 pb-4">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
              const hasIdea = !!IDEA_DATES[dateStr];
              const isSelected = selectedDate === dateStr;
              const isToday =
                day === now.getDate() &&
                month === now.getMonth() &&
                year === now.getFullYear();

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className="flex flex-col items-center py-1.5 gap-1"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-[13px] transition-all ${
                      isSelected
                        ? "bg-teal text-white font-semibold"
                        : isToday
                        ? "bg-gold/30 text-gold font-semibold"
                        : "text-paper/80"
                    }`}
                  >
                    {day}
                  </span>
                  {hasIdea && (
                    <span className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-gold"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected day */}
      {selectedLabel && (
        <div className="px-5 pb-6">
          <p className="mb-3 font-serif text-[16px] font-semibold text-foreground">
            {selectedLabel}
          </p>
          {selectedIdeas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="text-3xl">✦</span>
              <p className="text-sm text-ink-muted">Nothing planned — drop an idea?</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedIdeas.map((idea) => (
                <CalendarIdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function CalendarIdeaCard({ idea }: { idea: typeof seedIdeas[number] }) {
  const isCompleted = idea.status === "completed";
  const isSuggested = idea.status === "suggested";

  return (
    <div className="relative overflow-visible rounded-2xl bg-card ring-1 ring-border/50 shadow-[var(--shadow-card)]">
      <div className="absolute -top-3 left-4 inline-flex rounded-t-xl bg-ink px-3 py-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
          {idea.tag}
        </span>
      </div>
      <div className="px-4 pb-4 pt-6">
        <p className="font-mono text-[11px] text-ink-muted">
          {isSuggested ? idea.suggestedTime : isCompleted ? idea.happenedOn : idea.timeframe}
        </p>
        <h3 className="mt-0.5 font-serif text-[18px] font-semibold text-foreground">
          {idea.title}
        </h3>
        {isCompleted ? (
          <div className="mt-2 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-teal" />
            <span className="font-mono text-[11px] text-teal">stamp granted</span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-ink-muted">with {idea.recipient}</p>
        )}
      </div>
    </div>
  );
}
