import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { StampArt } from "@/components/passport/StampArt";
import { AvatarRow } from "@/components/passport/Avatar";
import { Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/passport")({
  head: () => ({
    meta: [
      { title: "Your Passport — Passport" },
      { name: "description", content: "A keepsake of every hangout that actually happened." },
    ],
  }),
  component: PassportPage,
});

const entries = [
  {
    id: "s1",
    title: "ramen night downtown",
    date: "Tuesday, June 10",
    group: "Roommates",
    tag: "Food",
    photo: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=70",
    people: [
      { initials: "MO", color: "bg-teal-soft text-teal", responded: true },
      { initials: "JL", color: "bg-gold-soft text-gold", responded: true },
    ],
  },
  {
    id: "s2",
    title: "Torrey Pines sunset",
    date: "Saturday, May 31",
    group: "UCSD crew",
    tag: "Outdoors",
    photo: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=70",
    people: [
      { initials: "MO", color: "bg-teal-soft text-teal", responded: true },
      { initials: "PN", color: "bg-gold-soft text-gold", responded: true },
      { initials: "TM", color: "bg-terracotta text-primary-foreground", responded: true },
    ],
  },
  {
    id: "s3",
    title: "late coffee + long talk",
    date: "Thursday, May 22",
    group: "Sam Park",
    tag: "Café",
    photo: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=70",
    people: [{ initials: "SP", color: "bg-tan text-ink", responded: true }],
  },
];

function PassportPage() {
  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pb-1 pt-8">
        <h1 className="font-serif text-[32px] font-semibold tracking-tight text-foreground">
          Passport
        </h1>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-ink">
          <Filter className="h-4 w-4" />
        </button>
      </header>
      <p className="px-5 pb-6 text-sm text-ink-muted">
        {entries.length} hangouts · 3 friend groups
      </p>

      <div className="flex flex-col gap-8 px-5 pb-6">
        {entries.map((e) => (
          <article
            key={e.id}
            className="rounded-3xl bg-paper p-5 shadow-[var(--shadow-stamp)] ring-1 ring-border/40"
          >
            <div className="flex gap-4">
              <Stamp tag={e.tag} />
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{e.date}</p>
                <h2 className="mt-1 font-serif text-[20px] font-semibold leading-tight text-foreground">
                  {e.title}
                </h2>
                <p className="mt-1 text-xs text-ink-muted">with {e.group}</p>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl bg-tan">
              <img src={e.photo} alt="" className="h-48 w-full object-cover" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <AvatarRow people={e.people} size="sm" />
              <span className="text-[11px] text-ink-muted">stamped</span>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

function Stamp({ tag }: { tag: string }) {
  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-cream p-2 shadow-[var(--shadow-card)]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 4px 4px, transparent 3px, var(--color-cream) 3.5px)",
        backgroundSize: "8px 8px",
        backgroundPosition: "-4px -4px",
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-sm border border-gold/40 bg-gold-soft/50 p-1 text-gold">
        <StampArt tag={tag} className="h-12 w-12" />
        <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider">{tag}</span>
      </div>
    </div>
  );
}
