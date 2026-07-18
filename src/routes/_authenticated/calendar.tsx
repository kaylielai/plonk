import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyFeed } from "@/lib/ideas.functions";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — plonk" },
      { name: "description", content: "See every confirmed and suggested hangout on one calendar." },
    ],
  }),
  component: CalendarPage,
});

type DayEvent = { id: string; title: string; tag: string; status: string; time: string; iso: string };

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function CalendarPage() {
  const navigate = useNavigate();
  const feedFn = useServerFn(listMyFeed);
  const { data: feed = [] } = useQuery({ queryKey: ["feed"], queryFn: () => feedFn() });

  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);

  // Build map of date -> events
  const events = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    for (const i of feed) {
      const iso = i.confirmed_time;
      if (!iso) continue;
      const d = new Date(iso);
      const key = dayKey(d);
      const arr = map.get(key) ?? [];
      arr.push({
        id: i.id,
        title: i.title,
        tag: i.tag,
        status: i.status,
        iso,
        time: d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      });
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.iso.localeCompare(b.iso));
    return map;
  }, [feed]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = cursor.toLocaleDateString([], { month: "long", year: "numeric" });

  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, key: `e${i}` });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `d${d}` });

  const selectedEvents = events.get(dayKey(selected)) ?? [];

  const upcoming = useMemo(() => {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return feed
      .filter((i) => i.confirmed_time && new Date(i.confirmed_time).getTime() >= startOfToday)
      .sort((a, b) => new Date(a.confirmed_time!).getTime() - new Date(b.confirmed_time!).getTime())
      .slice(0, 10);
  }, [feed, today]);

  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(today);
  };

  return (
    <AppShell>
      <header className="flex items-end justify-between px-5 pb-3 pt-8">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Calendar</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Tap a day to see what's planned</p>
        </div>
        <button
          onClick={goToday}
          className="rounded-full bg-secondary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-navy hover:bg-teal-soft transition"
        >
          Today
        </button>
      </header>

      <div className="mx-5 mt-3 rounded-3xl bg-paper p-4 ring-1 ring-border/40 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-ink hover:bg-teal-soft transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-navy">{monthLabel}</span>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-ink hover:bg-teal-soft transition"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((c) => {
            if (c.day === null) return <div key={c.key} className="aspect-square" />;
            const dateForCell = new Date(year, month, c.day);
            const key = dayKey(dateForCell);
            const dayEvents = events.get(key) ?? [];
            const isToday = key === dayKey(today);
            const isSelected = key === dayKey(selected);
            return (
              <button
                key={c.key}
                onClick={() => setSelected(dateForCell)}
                className={`relative aspect-square rounded-lg p-1 text-[11px] transition ${
                  isSelected
                    ? "bg-navy text-primary-foreground ring-2 ring-gold"
                    : isToday
                    ? "bg-teal text-primary-foreground"
                    : dayEvents.length
                    ? "bg-magenta-soft text-navy hover:bg-magenta/30"
                    : "text-ink hover:bg-secondary"
                }`}
              >
                <span className="font-medium">{c.day}</span>
                {dayEvents.length > 0 && (
                  <span
                    className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                      isSelected || isToday ? "bg-gold" : "bg-magenta"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            {selected.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <span className="font-mono text-[10px] text-ink-muted">
            {selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {selectedEvents.length === 0 && (
            <p className="rounded-2xl bg-paper px-4 py-6 text-center text-sm text-ink-muted ring-1 ring-border/40">
              Nothing planned on this day.
            </p>
          )}
          {selectedEvents.map((i) => (
            <button
              key={i.id}
              onClick={() => navigate({ to: "/ideas/$ideaId", params: { ideaId: i.id } })}
              className="flex w-full items-center gap-4 rounded-2xl bg-paper p-3 text-left ring-1 ring-border/40 hover:ring-teal/40 transition"
            >
              <div className="grid h-12 w-14 place-items-center rounded-xl bg-navy text-primary-foreground">
                <div className="text-center leading-tight">
                  <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-gold">at</div>
                  <div className="text-[11px] font-semibold">{i.time}</div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{i.title}</div>
                <div className="text-[11px] text-ink-muted capitalize">{i.status}</div>
              </div>
              <span className="rounded-full bg-gold-soft px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-navy">
                {i.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-8 pb-4">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Upcoming</p>
        <div className="flex flex-col gap-2">
          {upcoming.length === 0 && (
            <p className="rounded-2xl bg-paper px-4 py-6 text-center text-sm text-ink-muted ring-1 ring-border/40">
              Nothing confirmed yet. Once a hangout is locked in, it'll show up here.
            </p>
          )}
          {upcoming.map((i) => {
            const d = new Date(i.confirmed_time!);
            return (
              <button
                key={i.id}
                onClick={() => {
                  setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                  setSelected(d);
                }}
                className="flex w-full items-center gap-4 rounded-2xl bg-paper p-3 text-left ring-1 ring-border/40 hover:ring-teal/40 transition"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-soft text-teal">
                  <div className="text-center leading-tight">
                    <div className="font-mono text-[8px] uppercase tracking-[0.14em]">
                      {d.toLocaleDateString([], { month: "short" })}
                    </div>
                    <div className="text-base font-semibold">{d.getDate()}</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{i.title}</div>
                  <div className="text-[11px] text-ink-muted">
                    {d.toLocaleDateString([], { weekday: "short" })} · {d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
                <span className="rounded-full bg-gold-soft px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-navy">
                  {i.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
