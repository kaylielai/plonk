import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { StampArt } from "@/components/passport/StampArt";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyStamps } from "@/lib/stamps.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/passport")({
  head: () => ({
    meta: [
      { title: "Your Passport" },
      { name: "description", content: "A keepsake of every hangout that actually happened." },
    ],
  }),
  component: PassportPage,
});

type Stamp = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof listMyStamps>>>>[number];

function PassportPage() {
  const stampsFn = useServerFn(listMyStamps);
  const { data: stamps = [] } = useQuery({ queryKey: ["stamps"], queryFn: () => stampsFn() });

  // Two stamps per spread (one on each page). Cover spread comes first.
  const spreads = useMemo(() => {
    const pages: Array<Stamp | null> = stamps.length === 0 ? [null, null] : [...stamps];
    if (pages.length % 2 !== 0) pages.push(null);
    const grouped: Array<[Stamp | null, Stamp | null]> = [];
    for (let i = 0; i < pages.length; i += 2) grouped.push([pages[i], pages[i + 1]]);
    return grouped;
  }, [stamps]);

  const totalSpreads = 1 + spreads.length; // cover + interior spreads
  const [spreadIndex, setSpreadIndex] = useState(0);

  return (
    <AppShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 px-5 pt-8 pb-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold tracking-tight">Passport</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {stamps.length} {stamps.length === 1 ? "hangout" : "hangouts"} stamped
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
          {spreadIndex === 0 ? "Cover" : `Pg ${(spreadIndex * 2) - 1}–${spreadIndex * 2}`}
        </span>
      </header>

      <div className="px-3 pb-8">
        <PassportBook
          spread={spreadIndex}
          totalSpreads={totalSpreads}
          coverName={stamps[0]?.hangouts?.ideas?.groups?.name}
          spreads={spreads}
        />

        <div className="mt-5 flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => setSpreadIndex((i) => Math.max(0, i - 1))}
            disabled={spreadIndex === 0}
            className="grid h-11 w-11 place-items-center rounded-full bg-paper text-navy shadow-[var(--shadow-card)] ring-1 ring-border/50 transition disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSpreads }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === spreadIndex ? "w-6 bg-navy" : "w-1.5 bg-ink-muted/30"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSpreadIndex((i) => Math.min(totalSpreads - 1, i + 1))}
            disabled={spreadIndex >= totalSpreads - 1}
            className="grid h-11 w-11 place-items-center rounded-full bg-paper text-navy shadow-[var(--shadow-card)] ring-1 ring-border/50 transition disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function PassportBook({
  spread,
  totalSpreads,
  coverName,
  spreads,
}: {
  spread: number;
  totalSpreads: number;
  coverName?: string;
  spreads: Array<[Stamp | null, Stamp | null]>;
}) {
  return (
    <div
      className="relative mx-auto w-full max-w-md"
      style={{ perspective: "1600px" }}
    >
      {/* Outer cover — visible behind pages when open */}
      <div
        className="relative aspect-[3/2] w-full rounded-[14px] p-[10px] shadow-[0_18px_40px_-12px_rgba(8,32,64,0.45),0_2px_0_rgba(255,255,255,0.15)_inset]"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.28 0.09 258), oklch(0.22 0.08 258) 55%, oklch(0.18 0.06 258))",
        }}
      >
        {/* Faint embossed gold border on the cover edge */}
        <div className="pointer-events-none absolute inset-[6px] rounded-[10px] ring-1 ring-gold/20" />

        {/* Inside spread */}
        <div className="relative h-full w-full overflow-hidden rounded-[6px]">
          {spread === 0 ? (
            <CoverSpread coverName={coverName} />
          ) : (
            <InteriorSpread pair={spreads[spread - 1]} pageNumbers={[(spread * 2) - 1, spread * 2]} />
          )}

          {/* Center spine */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-ink/25 to-transparent" />
          {/* Stitched fold shadow */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 h-full w-8 -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.14),transparent_70%)]" />
          {/* Corner shadow (page curl feel) */}
          <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 rounded-tl-[24px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.10),transparent_70%)]" />
        </div>
      </div>

      {/* Page counter under book */}
      <p className="mt-3 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
        Spread {spread + 1} / {totalSpreads}
      </p>
    </div>
  );
}

function PageSurface({ children, side }: { children: React.ReactNode; side: "left" | "right" }) {
  return (
    <div
      className="relative h-full w-1/2 overflow-hidden"
      style={{
        background:
          side === "left"
            ? "linear-gradient(115deg, oklch(0.985 0.008 90), oklch(0.965 0.014 85))"
            : "linear-gradient(245deg, oklch(0.985 0.008 90), oklch(0.965 0.014 85))",
      }}
    >
      {/* subtle paper grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(rgba(120,90,40,0.06) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      {/* inner spine shadow */}
      <div
        className={`pointer-events-none absolute inset-y-0 ${side === "left" ? "right-0" : "left-0"} w-6`}
        style={{
          background:
            side === "left"
              ? "linear-gradient(to right, transparent, rgba(0,0,0,0.09))"
              : "linear-gradient(to left, transparent, rgba(0,0,0,0.09))",
        }}
      />
      {children}
    </div>
  );
}

function CoverSpread({ coverName }: { coverName?: string }) {
  return (
    <div className="flex h-full w-full">
      <PageSurface side="left">
        <div className="flex h-full flex-col items-center justify-center px-4 text-center text-navy">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-navy/60">
            Est. {new Date().getFullYear()}
          </span>
          <div className="mt-2 grid h-14 w-14 place-items-center rounded-full ring-2 ring-gold/70">
            <span className="text-2xl">✦</span>
          </div>
          <h2 className="mt-3 text-[15px] font-semibold uppercase tracking-[0.22em]">Passport</h2>
          <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-navy/60">of friendships</p>
        </div>
      </PageSurface>
      <PageSurface side="right">
        <div className="flex h-full flex-col justify-between p-4 text-navy">
          <div>
            <p className="text-[8px] font-mono uppercase tracking-[0.28em] text-navy/60">Bearer</p>
            <p className="mt-1 text-[13px] font-semibold leading-tight">
              {coverName ? `Adventures with ${coverName}` : "You & your people"}
            </p>
          </div>
          <div className="space-y-1.5">
            <FieldLine label="Issued" value={new Date().toLocaleDateString([], { month: "short", year: "numeric" })} />
            <FieldLine label="Type" value="Personal — Friendships" />
            <FieldLine label="Code" value="PSPT" />
          </div>
        </div>
      </PageSurface>
    </div>
  );
}

function FieldLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-navy/15 pb-1">
      <p className="text-[7px] font-mono uppercase tracking-[0.28em] text-navy/50">{label}</p>
      <p className="text-[11px] font-medium leading-tight">{value}</p>
    </div>
  );
}

function InteriorSpread({
  pair,
  pageNumbers,
}: {
  pair: [Stamp | null, Stamp | null];
  pageNumbers: [number, number];
}) {
  return (
    <div className="flex h-full w-full">
      <PageSurface side="left">
        <StampSlot stamp={pair[0]} pageNumber={pageNumbers[0]} rotate={-3.5} />
      </PageSurface>
      <PageSurface side="right">
        <StampSlot stamp={pair[1]} pageNumber={pageNumbers[1]} rotate={2.5} />
      </PageSurface>
    </div>
  );
}

function StampSlot({
  stamp,
  pageNumber,
  rotate,
}: {
  stamp: Stamp | null;
  pageNumber: number;
  rotate: number;
}) {
  return (
    <div className="relative flex h-full flex-col justify-between p-3">
      <span className="text-[8px] font-mono uppercase tracking-[0.28em] text-navy/40">
        Pg {pageNumber.toString().padStart(3, "0")}
      </span>

      <div className="flex flex-1 items-center justify-center">
        {stamp ? (
          <PostageStamp stamp={stamp} rotate={rotate} />
        ) : (
          <div className="flex flex-col items-center gap-1.5 opacity-60">
            <div className="grid h-14 w-14 place-items-center rounded-full border border-dashed border-navy/25">
              <span className="text-lg text-navy/40">✦</span>
            </div>
            <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-navy/40">Awaiting stamp</p>
          </div>
        )}
      </div>

      <div className="h-3" />
    </div>
  );
}

function PostageStamp({ stamp, rotate }: { stamp: Stamp; rotate: number }) {
  const [artUrl, setArtUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!stamp.art_url) return;
      const [bucket, ...rest] = stamp.art_url.split("/");
      const { data } = await supabase.storage.from(bucket).createSignedUrl(rest.join("/"), 3600);
      if (!cancelled && data) setArtUrl(data.signedUrl);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [stamp]);

  const date = stamp.hangouts?.confirmed_time
    ? new Date(stamp.hangouts.confirmed_time).toLocaleDateString([], {
        month: "short",
        day: "2-digit",
        year: "2-digit",
      }).toUpperCase()
    : "";
  const title = stamp.hangouts?.ideas?.title ?? "Hangout";
  const groupName = stamp.hangouts?.ideas?.groups?.name;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* Round postmark ring — stamped on paper */}
      <div className="relative h-[112px] w-[112px] rounded-full">
        {/* Outer + inner rings drawn with the magenta ink */}
        <div className="absolute inset-0 rounded-full border-[1.5px] border-magenta/70" />
        <div className="absolute inset-[7px] rounded-full border-[1px] border-magenta/60" />

        {/* Curved title (top) using SVG so text follows the ring */}
        <svg viewBox="0 0 112 112" className="absolute inset-0 h-full w-full text-magenta">
          <defs>
            <path id="top-curve" d="M 14 56 A 42 42 0 0 1 98 56" fill="none" />
            <path id="bottom-curve" d="M 14 56 A 42 42 0 0 0 98 56" fill="none" />
          </defs>
          <text
            fontSize="8"
            fontWeight="700"
            letterSpacing="1.2"
            fill="currentColor"
            style={{ textTransform: "uppercase" }}
          >
            <textPath href="#top-curve" startOffset="50%" textAnchor="middle">
              {truncate(title, 26)}
            </textPath>
          </text>
          {groupName && (
            <text
              fontSize="6.5"
              letterSpacing="1.4"
              fill="currentColor"
              style={{ textTransform: "uppercase" }}
              opacity="0.75"
            >
              <textPath href="#bottom-curve" startOffset="50%" textAnchor="middle">
                {truncate(groupName, 30)}
              </textPath>
            </text>
          )}
        </svg>

        {/* Center: art or fallback + date bar */}
        <div className="absolute inset-[18px] flex flex-col items-center justify-center gap-1 text-magenta">
          <div className="h-9 w-9 overflow-hidden">
            {artUrl ? (
              <img src={artUrl} alt={stamp.tag} className="h-full w-full object-cover mix-blend-multiply opacity-90" />
            ) : (
              <StampArt tag={stamp.tag} className="h-full w-full" />
            )}
          </div>
          {date && (
            <div className="border-y border-magenta/70 px-1.5 py-[1px] text-[7px] font-mono font-bold tracking-[0.14em]">
              {date}
            </div>
          )}
          <span className="text-[6.5px] font-semibold uppercase tracking-[0.18em] opacity-80">
            {stamp.tag}
          </span>
        </div>

        {/* Two small ★ markers at 3 & 9 o'clock */}
        <span className="absolute left-[3px] top-1/2 -translate-y-1/2 text-[8px] text-magenta">★</span>
        <span className="absolute right-[3px] top-1/2 -translate-y-1/2 text-[8px] text-magenta">★</span>
      </div>

      {/* Handwritten-style caption under the stamp */}
      {stamp.caption && (
        <p className="mt-2 max-w-[140px] truncate text-center text-[10px] italic text-navy/70">
          "{stamp.caption}"
        </p>
      )}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
