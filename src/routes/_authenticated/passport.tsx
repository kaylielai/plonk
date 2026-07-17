import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/passport/BottomNav";
import { StampArt } from "@/components/passport/StampArt";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyStamps } from "@/lib/stamps.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/passport")({
  head: () => ({
    meta: [
      { title: "Your stamps" },
      { name: "description", content: "A keepsake of every hangout that actually happened." },
    ],
  }),
  component: PassportPage,
});

type Stamp = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof listMyStamps>>>>[number];

const COVER_GRADIENTS: Record<string, string> = {
  navy: "linear-gradient(135deg, oklch(0.28 0.09 258), oklch(0.22 0.08 258) 55%, oklch(0.18 0.06 258))",
  magenta: "linear-gradient(135deg, oklch(0.62 0.19 5), oklch(0.5 0.18 5) 55%, oklch(0.42 0.16 5))",
  gold: "linear-gradient(135deg, oklch(0.88 0.14 92), oklch(0.78 0.14 82) 55%, oklch(0.66 0.13 72))",
  coral: "linear-gradient(135deg, oklch(0.78 0.14 40), oklch(0.68 0.15 32) 55%, oklch(0.56 0.14 28))",
};

function PassportPage() {
  const stampsFn = useServerFn(listMyStamps);
  const profileFn = useServerFn(getMyProfile);
  const { data: stamps = [] } = useQuery({ queryKey: ["stamps"], queryFn: () => stampsFn() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const coverKey = profile?.passport_cover_color || "navy";
  const coverGradient = COVER_GRADIENTS[coverKey] ?? COVER_GRADIENTS.navy;
  const bearerName = profile?.display_name;

  // Two stamps per spread (one on each page). Cover spread comes first.
  const spreads = useMemo(() => {
    const pages: Array<Stamp | null> = stamps.length === 0 ? [null, null] : [...stamps];
    if (pages.length % 2 !== 0) pages.push(null);
    const grouped: Array<[Stamp | null, Stamp | null]> = [];
    for (let i = 0; i < pages.length; i += 2) grouped.push([pages[i], pages[i + 1]]);
    return grouped;
  }, [stamps]);

  const totalSpreads = 1 + spreads.length;
  const [spreadIndex, setSpreadIndex] = useState(0);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="mx-auto grid max-w-[430px] grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 px-5 pt-8 pb-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold tracking-tight">Stamps</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {stamps.length} {stamps.length === 1 ? "hangout" : "hangouts"} stamped
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
          {spreadIndex === 0 ? "Cover" : `Pg ${(spreadIndex * 2) - 1}–${spreadIndex * 2}`}
        </span>
      </header>

      {/* Full-viewport passport display */}
      <div className="mx-auto w-full max-w-[1100px] px-3 sm:px-6">
        <PassportBook
          spread={spreadIndex}
          totalSpreads={totalSpreads}
          coverName={stamps[0]?.hangouts?.ideas?.groups?.name}
          bearerName={bearerName}
          coverGradient={coverGradient}
          spreads={spreads}
        />

        <div className="mx-auto mt-6 flex max-w-md items-center justify-between px-2">
          <button
            type="button"
            onClick={() => setSpreadIndex((i) => Math.max(0, i - 1))}
            disabled={spreadIndex === 0}
            className="grid h-12 w-12 place-items-center rounded-full bg-paper text-navy shadow-[var(--shadow-card)] ring-1 ring-border/50 transition hover:bg-teal-soft active:scale-90 disabled:opacity-30 disabled:hover:bg-paper"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSpreads }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSpreadIndex(i)}
                className={`h-1.5 rounded-full transition-all hover:bg-navy/60 ${
                  i === spreadIndex ? "w-6 bg-navy" : "w-1.5 bg-ink-muted/30"
                }`}
                aria-label={`Go to spread ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSpreadIndex((i) => Math.min(totalSpreads - 1, i + 1))}
            disabled={spreadIndex >= totalSpreads - 1}
            className="grid h-12 w-12 place-items-center rounded-full bg-paper text-navy shadow-[var(--shadow-card)] ring-1 ring-border/50 transition hover:bg-teal-soft active:scale-90 disabled:opacity-30 disabled:hover:bg-paper"
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function PassportBook({
  spread,
  totalSpreads,
  coverName,
  bearerName,
  coverGradient,
  spreads,
}: {
  spread: number;
  totalSpreads: number;
  coverName?: string;
  bearerName?: string;
  coverGradient: string;
  spreads: Array<[Stamp | null, Stamp | null]>;
}) {
  return (
    <div className="relative mx-auto w-full" style={{ perspective: "1600px" }}>
      {/* Outer cover */}
      <div
        className="relative aspect-[3/2] w-full rounded-[18px] p-[12px] shadow-[0_28px_60px_-18px_rgba(8,32,64,0.55),0_2px_0_rgba(255,255,255,0.15)_inset] transition-transform duration-500"
        style={{ background: coverGradient }}
      >
        {/* Faint embossed gold border on the cover edge */}
        <div className="pointer-events-none absolute inset-[8px] rounded-[12px] ring-1 ring-gold/25" />

        {/* Inside spread */}
        <div className="relative h-full w-full overflow-hidden rounded-[8px]">
          {spread === 0 ? (
            <CoverSpread coverName={coverName} bearerName={bearerName} />
          ) : (
            <InteriorSpread pair={spreads[spread - 1]} pageNumbers={[(spread * 2) - 1, spread * 2]} />
          )}

          {/* Center spine */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-ink/25 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 h-full w-12 -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.14),transparent_70%)]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 rounded-tl-[28px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.10),transparent_70%)]" />
        </div>
      </div>

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
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage: "radial-gradient(rgba(120,90,40,0.06) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 ${side === "left" ? "right-0" : "left-0"} w-8`}
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

function CoverSpread({ coverName, bearerName }: { coverName?: string; bearerName?: string }) {
  return (
    <div className="flex h-full w-full">
      <PageSurface side="left">
        <div className="flex h-full flex-col items-center justify-center px-4 text-center text-navy">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-navy/60">
            Est. {new Date().getFullYear()}
          </span>
          <div className="mt-3 grid h-20 w-20 place-items-center rounded-full ring-2 ring-gold/70">
            <span className="text-3xl">✦</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold uppercase tracking-[0.24em]">plonk</h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-navy/60">of friendships</p>
        </div>
      </PageSurface>
      <PageSurface side="right">
        <div className="flex h-full flex-col justify-between p-5 text-navy">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.28em] text-navy/60">Bearer</p>
            <p className="mt-1 text-base font-semibold leading-tight">
              {bearerName ?? (coverName ? `Adventures with ${coverName}` : "You & your people")}
            </p>
          </div>
          <div className="space-y-2">
            <FieldLine label="Issued" value={new Date().toLocaleDateString([], { month: "short", year: "numeric" })} />
            <FieldLine label="Type" value="Personal — Friendships" />
            <FieldLine label="Code" value="PLNK" />
          </div>
        </div>
      </PageSurface>
    </div>
  );
}

function FieldLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-navy/15 pb-1.5">
      <p className="text-[8px] font-mono uppercase tracking-[0.28em] text-navy/50">{label}</p>
      <p className="text-[12px] font-medium leading-tight">{value}</p>
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
    <div className="relative flex h-full flex-col justify-between p-4">
      <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-navy/40">
        Pg {pageNumber.toString().padStart(3, "0")}
      </span>

      <div className="flex flex-1 items-center justify-center">
        {stamp ? (
          <PostageStamp stamp={stamp} rotate={rotate} />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-60">
            <div className="grid h-20 w-20 place-items-center rounded-full border border-dashed border-navy/25">
              <span className="text-2xl text-navy/40">✦</span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-navy/40">Awaiting stamp</p>
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
      className="relative flex flex-col items-center transition-transform duration-300 hover:scale-105"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="relative h-[160px] w-[160px] rounded-full">
        <div className="absolute inset-0 rounded-full border-[2px] border-magenta/70" />
        <div className="absolute inset-[10px] rounded-full border-[1.5px] border-magenta/60" />

        <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full text-magenta">
          <defs>
            <path id="top-curve" d="M 20 80 A 60 60 0 0 1 140 80" fill="none" />
            <path id="bottom-curve" d="M 20 80 A 60 60 0 0 0 140 80" fill="none" />
          </defs>
          <text fontSize="11" fontWeight="700" letterSpacing="1.5" fill="currentColor" style={{ textTransform: "uppercase" }}>
            <textPath href="#top-curve" startOffset="50%" textAnchor="middle">
              {truncate(title, 26)}
            </textPath>
          </text>
          {groupName && (
            <text fontSize="9" letterSpacing="1.6" fill="currentColor" style={{ textTransform: "uppercase" }} opacity="0.75">
              <textPath href="#bottom-curve" startOffset="50%" textAnchor="middle">
                {truncate(groupName, 30)}
              </textPath>
            </text>
          )}
        </svg>

        <div className="absolute inset-[26px] flex flex-col items-center justify-center gap-1.5 text-magenta">
          <div className="h-12 w-12 overflow-hidden">
            {artUrl ? (
              <img src={artUrl} alt={stamp.tag} className="h-full w-full object-cover mix-blend-multiply opacity-90" />
            ) : (
              <StampArt tag={stamp.tag} className="h-full w-full" />
            )}
          </div>
          {date && (
            <div className="border-y border-magenta/70 px-2 py-[2px] text-[9px] font-mono font-bold tracking-[0.14em]">
              {date}
            </div>
          )}
          <span className="text-[8px] font-semibold uppercase tracking-[0.18em] opacity-80">
            {stamp.tag}
          </span>
        </div>

        <span className="absolute left-[5px] top-1/2 -translate-y-1/2 text-[10px] text-magenta">★</span>
        <span className="absolute right-[5px] top-1/2 -translate-y-1/2 text-[10px] text-magenta">★</span>
      </div>

      {stamp.caption && (
        <p className="mt-3 max-w-[180px] truncate text-center text-[11px] italic text-navy/70">
          "{stamp.caption}"
        </p>
      )}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
