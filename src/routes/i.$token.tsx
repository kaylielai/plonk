import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getLiteIdea, submitLiteAvailability } from "@/lib/lite.functions";
import { Check, Sunrise, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/i/$token")({
  head: ({ params }) => ({
    meta: [
      { title: "You're invited on plonk" },
      { name: "description", content: "A friend wants to hang out. Drop your availability — no account needed." },
    ],
  }),
  component: LiteInvitePage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function LiteInvitePage() {
  const { token } = Route.useParams();
  const getIdea = useServerFn(getLiteIdea);
  const submit = useServerFn(submitLiteAvailability);
  const { data: idea, isLoading } = useQuery({
    queryKey: ["lite", token],
    queryFn: () => getIdea({ data: { token } }),
  });

  const [name, setName] = useState("");
  const [slots, setSlots] = useState<{ mornings: string[]; afternoons: string[]; evenings: string[] }>({
    mornings: [], afternoons: [], evenings: [],
  });
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => submit({ data: { token, display_name: name.trim(), slots } }),
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to send"),
  });

  function toggle(band: "mornings" | "afternoons" | "evenings", day: string) {
    setSlots((s) => ({
      ...s,
      [band]: s[band].includes(day) ? s[band].filter((d) => d !== day) : [...s[band], day],
    }));
  }

  if (isLoading) return <div className="min-h-screen bg-background" />;

  if (!idea) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold">Link expired</h1>
          <p className="mt-2 text-sm text-ink-muted">This invite is no longer active.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-soft text-teal mb-4">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="text-[22px] font-semibold">You're in.</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Thanks {name.split(" ")[0]}. Your availability was sent back to the group. They'll confirm a time in the app.
          </p>
          <div className="mt-8 rounded-2xl bg-paper p-5 ring-1 ring-border/50">
            <p className="text-xs text-ink-muted uppercase tracking-[0.14em] mb-2">Want your own plonk?</p>
            <p className="text-sm text-foreground">
              Every hangout you show up to earns a stamp. Get the app to start your own collection.
            </p>
            <a
              href="/auth"
              className="mt-4 inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground"
            >
              Get plonk
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 pt-12 pb-16">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">from {idea.group_name}</p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-tight leading-tight">{idea.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{idea.timeframe_label} · {idea.tag}</p>
          <p className="mt-2 text-xs text-ink-muted">{idea.response_count} people responded so far</p>
        </div>

        <div className="mt-8">
          <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-ink-muted">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="who is this?"
            className="w-full rounded-xl border border-border bg-paper px-4 py-3 text-[15px] focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          />
        </div>

        <div className="mt-6">
          <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-ink-muted">When are you free?</p>
          {(["mornings", "afternoons", "evenings"] as const).map((band) => (
            <div key={band} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                {band === "mornings" && <Sunrise className="h-4 w-4 text-gold" />}
                {band === "afternoons" && <Sun className="h-4 w-4 text-coral" />}
                {band === "evenings" && <Moon className="h-4 w-4 text-teal" />}
                <span className="text-sm font-medium capitalize">{band}</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((d) => {
                  const active = slots[band].includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggle(band, d)}
                      className={`rounded-lg py-2 text-[11px] font-medium transition ${
                        active ? "bg-teal text-primary-foreground" : "bg-secondary text-ink-muted"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"
        >
          {mutation.isPending ? "sending…" : "Send my availability"}
        </button>

        <p className="mt-4 text-center text-[11px] text-ink-muted">
          Only your name and availability are shared. No account created.
        </p>
      </div>
    </div>
  );
}
