import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { StampArt } from "@/components/passport/StampArt";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyStamps } from "@/lib/stamps.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/passport")({
  head: () => ({
    meta: [
      { title: "Your Passport" },
      { name: "description", content: "A keepsake of every hangout that actually happened." },
    ],
  }),
  component: PassportPage,
});

function PassportPage() {
  const stampsFn = useServerFn(listMyStamps);
  const { data: stamps = [] } = useQuery({ queryKey: ["stamps"], queryFn: () => stampsFn() });

  return (
    <AppShell>
      <header className="px-5 pt-8 pb-1">
        <h1 className="text-[32px] font-semibold tracking-tight">Passport</h1>
      </header>
      <p className="px-5 pb-6 text-sm text-ink-muted">
        {stamps.length} {stamps.length === 1 ? "hangout" : "hangouts"} stamped
      </p>

      {stamps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center px-8">
          <span className="text-4xl">✦</span>
          <p className="text-lg font-medium">Your book is empty — for now</p>
          <p className="text-sm text-ink-muted">
            Every hangout that actually happens becomes a stamp here. Upload a photo after a confirmed plan to mint one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 px-5 pb-6">
          {stamps.map((s) => <StampEntry key={s.id} stamp={s} />)}
        </div>
      )}
    </AppShell>
  );
}

type Stamp = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof listMyStamps>>>>[number];

function StampEntry({ stamp }: { stamp: Stamp }) {
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (stamp.art_url) {
        const [bucket, ...rest] = stamp.art_url.split("/");
        const { data } = await supabase.storage.from(bucket).createSignedUrl(rest.join("/"), 3600);
        if (data) setArtUrl(data.signedUrl);
      }
      if (stamp.photo_url) {
        const [bucket, ...rest] = stamp.photo_url.split("/");
        const { data } = await supabase.storage.from(bucket).createSignedUrl(rest.join("/"), 3600);
        if (data) setPhotoUrl(data.signedUrl);
      }
    }
    load();
  }, [stamp]);

  const idea = stamp.hangouts?.ideas;
  const date = stamp.hangouts?.confirmed_time
    ? new Date(stamp.hangouts.confirmed_time).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
    : "";

  return (
    <article className="rounded-3xl bg-paper p-5 shadow-[var(--shadow-stamp)] ring-1 ring-border/40">
      <div className="flex gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-cream p-2 shadow-[var(--shadow-card)]">
          <div className="flex h-full w-full flex-col items-center justify-center rounded-sm border border-gold/40 bg-gold-soft/50 p-1 text-gold overflow-hidden">
            {artUrl ? (
              <img src={artUrl} alt={stamp.tag} className="h-full w-full object-cover rounded-sm" />
            ) : (
              <>
                <StampArt tag={stamp.tag} className="h-12 w-12" />
                <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider">{stamp.tag}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{date}</p>
          <h2 className="mt-1 text-[20px] font-semibold leading-tight truncate">{idea?.title ?? "Hangout"}</h2>
          {idea?.groups?.name && (
            <p className="mt-1 text-xs text-ink-muted">with {idea.groups.name}</p>
          )}
        </div>
      </div>
      {photoUrl && (
        <div className="mt-4 overflow-hidden rounded-2xl bg-tan">
          <img src={photoUrl} alt="" className="h-48 w-full object-cover" />
        </div>
      )}
      {stamp.caption && <p className="mt-3 text-sm text-ink-muted italic">"{stamp.caption}"</p>}
    </article>
  );
}
