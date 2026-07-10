import { useState } from "react";
import { X, Plus } from "lucide-react";
import { seedGroups } from "@/lib/seed";

const FIXED_TAGS = [
  "Food",
  "Outdoors",
  "Study",
  "Game night",
  "Movie",
  "Music",
  "Café",
  "Travel",
];

const TIMEFRAMES = [
  "this weekend",
  "next week",
  "next 2 weeks",
  "this month",
];

interface NewIdeaSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (idea: { title: string; timeframe: string; tag: string; recipient: string }) => void;
}

export function NewIdeaSheet({ open, onClose, onSubmit }: NewIdeaSheetProps) {
  const [title, setTitle] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [customTimeframe, setCustomTimeframe] = useState("");
  const [tag, setTag] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [showCustomTag, setShowCustomTag] = useState(false);
  const [recipient, setRecipient] = useState("");

  const effectiveTimeframe = timeframe === "custom" ? customTimeframe : timeframe;
  const effectiveTag = tag === "custom" ? customTag : tag;
  const canSubmit = title.trim() && effectiveTimeframe.trim() && effectiveTag && recipient;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit?.({
      title: title.trim(),
      timeframe: effectiveTimeframe.trim(),
      tag: effectiveTag,
      recipient,
    });
    // reset
    setTitle("");
    setTimeframe("");
    setCustomTimeframe("");
    setTag("");
    setCustomTag("");
    setShowCustomTag(false);
    setRecipient("");
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-paper shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-2 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Drop an idea
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-ink-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: "72vh" }}>
          {/* Title */}
          <div className="mt-4">
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              What's the vibe?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="boba?? / hike this weekend / library sesh"
              className="w-full rounded-xl border border-border bg-cream px-4 py-3 font-serif text-[17px] text-foreground placeholder:text-ink-muted/60 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              autoFocus
            />
          </div>

          {/* Timeframe */}
          <div className="mt-5">
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              When?
            </label>
            <div className="flex flex-wrap gap-2">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTimeframe(t);
                    setCustomTimeframe("");
                  }}
                  className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-all ${
                    timeframe === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-ink-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customTimeframe}
              onChange={(e) => {
                setCustomTimeframe(e.target.value);
                setTimeframe("custom");
              }}
              placeholder="or type your own…"
              className="mt-2.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 font-mono text-[12px] text-foreground placeholder:text-ink-muted/50 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            />
          </div>

          {/* Activity tag */}
          <div className="mt-5">
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              Activity
            </label>
            <div className="flex flex-wrap gap-2">
              {FIXED_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTag(t);
                    setShowCustomTag(false);
                  }}
                  className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-all ${
                    tag === t
                      ? "bg-ink text-paper"
                      : "bg-secondary text-ink-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowCustomTag(true);
                  setTag("custom");
                }}
                className={`flex items-center gap-1 rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-all ${
                  showCustomTag
                    ? "bg-ink text-paper"
                    : "bg-secondary text-ink-muted"
                }`}
              >
                <Plus className="h-3 w-3" /> Custom
              </button>
            </div>
            {showCustomTag && (
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="name your vibe…"
                autoFocus
                className="mt-2.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 font-mono text-[12px] text-foreground placeholder:text-ink-muted/50 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              />
            )}
          </div>

          {/* Send to */}
          <div className="mt-5">
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              Send to
            </label>
            <div className="flex flex-wrap gap-2">
              {seedGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setRecipient(g.name)}
                  className={`flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-all ${
                    recipient === g.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-ink-muted"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${g.color}`}
                  >
                    {g.name.slice(0, 2).toUpperCase()}
                  </span>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`mt-6 w-full rounded-xl py-3.5 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition-all ${
              canSubmit
                ? "bg-primary text-primary-foreground active:scale-[0.99]"
                : "bg-secondary text-ink-muted opacity-50"
            }`}
          >
            Drop it ✦
          </button>
        </div>
      </div>
    </>
  );
}
