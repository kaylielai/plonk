import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell } from "@/components/passport/BottomNav";
import { IdeaCard, initials, pickColor, type DisplayIdea } from "@/components/passport/IdeaCard";
import { NewIdeaSheet } from "@/components/passport/NewIdeaSheet";

import { listMyFeed, createIdea } from "@/lib/ideas.functions";
import { listMyGroups } from "@/lib/groups.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { listMyNotifications } from "@/lib/notifications.functions";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "plonk — a keepsake for your friendships" },
      { name: "description", content: "Turn vague hangout plans into real ones. Collect a stamp for every hangout that actually happens." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const feedFn = useServerFn(listMyFeed);
  const groupsFn = useServerFn(listMyGroups);
  const profileFn = useServerFn(getMyProfile);
  const notifsFn = useServerFn(listMyNotifications);
  const createFn = useServerFn(createIdea);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const { data: feed = [], isLoading } = useQuery({ queryKey: ["feed"], queryFn: () => feedFn() });
  const { data: groups = [] } = useQuery({ queryKey: ["groups"], queryFn: () => groupsFn() });
  const { data: notifs = [] } = useQuery({ queryKey: ["notifs"], queryFn: () => notifsFn() });

  const [filter, setFilter] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (profile && !profile.onboarded_at) {
      navigate({ to: "/onboarding" });
    }
  }, [profile, navigate]);

  const displayIdeas: DisplayIdea[] = feed.map((i) => toDisplay(i));
  const visible = filter ? displayIdeas.filter((i) => i.recipient === filter) : displayIdeas;
  const unread = notifs.filter((n) => !n.read_at).length;

  async function handleNewIdea(input: { title: string; timeframe_label: string; tag: string; group_id: string; target_date: string | null }) {
    try {
      await createFn({ data: input });
      toast.success("Idea dropped");
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create idea");
    }
  }

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pb-3 pt-6">
        <h1 className="text-[26px] font-semibold tracking-tight">Let's hang.</h1>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-ink"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />}
          </button>
          <button
            aria-label="New idea"
            onClick={() => setNewOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)]"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Pinned groups strip */}
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-5 py-3">
        {groups.map((g) => {
          const active = filter === g.name;
          return (
            <button
              key={g.id}
              onClick={() => setFilter(active ? null : g.name)}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold bg-teal-soft text-teal ${
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
        <button
          onClick={() => navigate({ to: "/groups" })}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border text-ink-muted">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-[11px] text-ink-muted">New</span>
        </button>
      </div>

      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-ink-muted">UPCOMING</span>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-6">
        {isLoading && (
          <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>
        )}
        {!isLoading && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">✦</span>
            <p className="text-lg font-medium text-foreground">No ideas yet</p>
            <p className="text-sm text-ink-muted">
              {groups.length === 0 ? "Create a group first, then tap + to drop an idea." : "Tap + to drop the first one."}
            </p>
          </div>
        )}
        {visible.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} onClick={() => navigate({ to: "/ideas/$ideaId", params: { ideaId: idea.id } })} />
        ))}
      </div>

      <NewIdeaSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        groups={groups.map((g) => ({ id: g.id, name: g.name, cover_color: g.cover_color }))}
        onSubmit={handleNewIdea}
      />
    </AppShell>
  );
}

// Map DB idea to display shape
type FeedIdea = Awaited<ReturnType<typeof listMyFeed>>[number];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function computeAvailableBands(
  responses: Array<{ slots?: { mornings?: string[]; afternoons?: string[]; evenings?: string[] } | null } | undefined>,
  targetDate: string | null | undefined,
): Array<"mornings" | "afternoons" | "evenings"> {
  if (!targetDate) return [];
  const slotsList = responses
    .map((r) => r?.slots ?? null)
    .filter(Boolean) as Array<{ mornings?: string[]; afternoons?: string[]; evenings?: string[] }>;
  if (slotsList.length === 0) return [];
  const wd = WEEKDAYS[new Date(`${targetDate}T12:00:00Z`).getUTCDay()];
  const bands: Array<"mornings" | "afternoons" | "evenings"> = [];
  for (const b of ["mornings", "afternoons", "evenings"] as const) {
    if (slotsList.every((s) => (s[b] ?? []).includes(wd))) bands.push(b);
  }
  return bands;
}

function toDisplay(i: FeedIdea): DisplayIdea {
  const participants = i.idea_participants ?? [];
  const responses = (i.availability_responses ?? []) as Array<{
    id: string;
    participant_id: string;
    slots?: { mornings?: string[]; afternoons?: string[]; evenings?: string[] } | null;
  }>;
  const respondedIds = new Set(responses.map((r) => r.participant_id));
  const recipient = i.groups?.name ?? "1:1";
  const people = participants.map((p) => {
    const name = p.profiles?.display_name || p.lite_display_name || "?";
    const id = p.user_id ?? p.id;
    return { initials: initials(name), color: pickColor(id), responded: respondedIds.has(p.id) };
  });
  const targetDate = (i as { target_date?: string | null }).target_date ?? undefined;
  return {
    id: i.id,
    title: i.title,
    tag: i.tag,
    timeframe: i.timeframe_label,
    recipient,
    status: i.status,
    participantCount: Math.max(participants.length, 1),
    respondedCount: respondedIds.size,
    suggestedLabel: i.suggested_day && i.suggested_time ? `${i.suggested_day} · ${i.suggested_time}` : undefined,
    confirmedTime: i.confirmed_time ? new Date(i.confirmed_time).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }) : undefined,
    targetDate: targetDate ?? undefined,
    availableBands: computeAvailableBands(responses, targetDate),
    people,
  };
}

