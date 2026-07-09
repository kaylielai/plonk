export type IdeaStatus = "collecting-low" | "collecting-high" | "suggested" | "completed";

export interface SeedPerson {
  id: string;
  name: string;
  initials: string;
  color: string; // tailwind bg class from palette
  responded?: boolean;
}

export interface SeedIdea {
  id: string;
  title: string;
  timeframe: string;
  tag: string;
  recipient: string;
  status: IdeaStatus;
  people: SeedPerson[];
  suggestedTime?: string;
  happenedOn?: string;
}

const P = (id: string, name: string, color: string, responded = false): SeedPerson => ({
  id,
  name,
  initials: name.split(" ").map((n) => n[0]).slice(0, 2).join(""),
  color,
  responded,
});

export const seedGroups = [
  { id: "g1", name: "Roommates", color: "bg-teal text-primary-foreground" },
  { id: "g2", name: "UCSD crew", color: "bg-gold text-accent-foreground" },
  { id: "g3", name: "Hometown", color: "bg-terracotta text-primary-foreground" },
  { id: "g4", name: "Studio", color: "bg-sage text-primary-foreground" },
];

export const seedIdeas: SeedIdea[] = [
  {
    id: "i1",
    title: "coffee + pastries somewhere new",
    timeframe: "this weekend",
    tag: "Café",
    recipient: "Roommates",
    status: "collecting-low",
    people: [
      P("u1", "Maya Ortiz", "bg-teal-soft text-teal", true),
      P("u2", "Jordan Lee", "bg-gold-soft text-gold"),
      P("u3", "Sam Park", "bg-tan text-ink"),
      P("u4", "Ren K.", "bg-tan text-ink"),
    ],
  },
  {
    id: "i2",
    title: "sunset hike at Torrey Pines",
    timeframe: "next week",
    tag: "Outdoors",
    recipient: "UCSD crew",
    status: "collecting-high",
    people: [
      P("u1", "Maya Ortiz", "bg-teal-soft text-teal", true),
      P("u2", "Jordan Lee", "bg-gold-soft text-gold", true),
      P("u5", "Priya N.", "bg-teal-soft text-teal", true),
      P("u6", "Theo M.", "bg-gold-soft text-gold", true),
      P("u3", "Sam Park", "bg-tan text-ink"),
    ],
  },
  {
    id: "i3",
    title: "game night — bring snacks",
    timeframe: "this week",
    tag: "Game night",
    recipient: "Hometown",
    status: "suggested",
    suggestedTime: "Thursday · 7pm",
    people: [
      P("u7", "Alex R.", "bg-teal-soft text-teal", true),
      P("u8", "Casey W.", "bg-teal-soft text-teal", true),
      P("u9", "Dana P.", "bg-gold-soft text-gold", true),
    ],
  },
  {
    id: "i4",
    title: "ramen night downtown",
    timeframe: "last week",
    tag: "Food",
    recipient: "Roommates",
    status: "completed",
    happenedOn: "Tuesday",
    people: [
      P("u1", "Maya Ortiz", "bg-teal-soft text-teal", true),
      P("u2", "Jordan Lee", "bg-gold-soft text-gold", true),
    ],
  },
];
