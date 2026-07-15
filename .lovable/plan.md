
# Complete Passport v1

Building the full MVP scope from the strategy doc on top of the current UI shell. Everything below is v1; v2 items (calendar sync, AI history suggestions, preference profiles) stay out.

## 1. Backend (Lovable Cloud)

Enable Lovable Cloud, then create these tables (all with RLS + grants):

- `profiles` — user_id, display_name, avatar_url, passport_cover_color
- `groups` — id, name, cover_color, created_by
- `group_members` — group_id, user_id, pinned
- `ideas` — id, title, timeframe_label, tag, group_id (nullable), recipient_user_id (nullable for 1:1), created_by, status (`collecting` / `suggested` / `confirmed` / `completed` / `stale`), suggested_at (timestamptz), created_at
- `idea_participants` — idea_id, user_id (nullable), lite_display_name (nullable) — for both app users and lite-link responders
- `availability_responses` — idea_id, participant_id, slots (jsonb: `{ mornings: string[], afternoons: [], evenings: [] }`), submitted_via (`app` | `lite`)
- `hangouts` — id, idea_id, confirmed_at, confirmed_time
- `stamps` — id, hangout_id, owner_user_id, tag, photo_url, art_url, art_prompt, caption, created_at
- `stamp_attendees` — stamp_id / hangout_id → tagged user_ids
- `lite_tokens` — idea_id, token (random), expires_at — powers the no-install link
- `user_roles` + `has_role()` helper (per user-roles rule)

Storage buckets: `hangout-photos` (private, RLS: attendees only), `stamp-art` (public read), `avatars` (public read).

## 2. Auth + Onboarding

- Google OAuth via the Lovable broker + email/password fallback
- Managed `_authenticated` layout gates the app
- Onboarding (3 steps, shown once after first sign-in):
  1. Name + avatar
  2. Pick passport cover color (4 preset swatches)
  3. Short "here's your passport" moment introducing the collectible — per decision 9 (foundational, not bolted on)
- Redirect to `/` once `profiles.onboarded_at` is set

## 3. Groups

- Create a group, invite by email or shareable invite link
- Group detail: members, pinned toggle, recent ideas
- 1:1 threads created implicitly from "send to a person"

## 4. Idea creation + feed (real data)

- `NewIdeaSheet` writes to `ideas` and seeds `idea_participants` from group membership or the chosen person
- Feed queries the user's ideas (via groups/1:1) with SWR, showing the four states already designed
- Filter chips over pinned groups drive the query
- Stale sweep: server fn / cron marks ideas older than 7 days without enough overlap as `stale` and notifies the creator; auto-discard 2 days later

## 5. Availability model (progressive disclosure)

- **Step 1 — general availability:** on the idea detail sheet, each participant taps morning / afternoon / evening across the timeframe's days. Toggle Week vs Month view.
- **Step 2 — specific time blocks:** unlocks only after a day has ≥ threshold overlap. Participants pick a concrete hour window on the settled day.
- Overlap engine (server fn) recomputes on each response and, once a threshold is met, sets `ideas.status = 'suggested'` with `suggested_at`.

## 6. Confirm → hangout

- Any app user can tap "Confirm time" on a suggested idea (decision 2). Writes `hangouts` row, flips idea to `confirmed`, notifies participants including non-responders (decision 1).
- After the confirmed time passes, the idea moves to an "awaiting photo" state on the home feed.

## 7. Stamp flow (photo trigger)

- On a confirmed hangout, any attendee can upload a photo to `hangout-photos`
- Upload sheet: pick photo → tag which friends actually attended (decision 4) → optional caption
- Server fn generates the stamp art via Lovable AI Gateway (Gemini image model), passing tag + short prompt derived from title/caption. Style-locked prompt template so the collection stays visually coherent (per doc).
- Insert a `stamps` row per tagged attendee (each person gets a stamp on their own passport) and mark idea `completed`.

## 8. Passport screen

- Real query of the signed-in user's stamps, newest first
- Filters: by friend, by date range (research-suggested add)
- Empty state stays warm — never reads as a broken streak (per Duolingo takeaway)
- Stamp detail sheet: full art, photo, attendees, group, date

## 9. Lite link (no-install)

- Public route `/i/$token` served without auth
- Fetches idea summary via a public server fn (narrow anon SELECT policy on `ideas` + `lite_tokens`)
- Non-user submits name + general availability only; writes an `idea_participants` row (`user_id null, lite_display_name set`) and an `availability_responses` row with `submitted_via = 'lite'`
- Cannot confirm; shows a "get the app to keep your stamps" CTA (decision 5)
- Feed treats lite and app responses identically in the aggregate count (decision 6)

## 10. Notifications (in-app only for v1)

- Bell icon in header opens a sheet of unread events: new idea in a group you're in, someone confirmed a time, stale-idea nudge to the creator, photo uploaded (stamp minted)
- Backed by a `notifications` table + realtime subscription

## Technical notes

- All reads through `createServerFn` (public reads via publishable-key client, user reads via `requireSupabaseAuth`). Admin client only for stamp generation writes.
- AI stamp gen runs in a server fn using `LOVABLE_API_KEY` (auto-provisioned by Lovable AI) — no external key needed
- Stale sweep runs via a `pg_cron` job hitting `/api/public/cron/sweep-stale` with a shared secret header
- Loaders under `_authenticated/*` only; the lite `/i/$token` route stays public with its own loader

## Out of scope (v2, per doc)

Native calendar sync, AI location suggestions, group preference profiles, per-group availability nuance.

## Suggested build order (I'll proceed top-down)

1. Enable Cloud + migrations + auth + onboarding
2. Groups + real idea creation wired to the existing feed UI
3. Availability + confirm flow
4. Photo upload + AI stamp generation + real passport
5. Lite link + notifications + stale sweep

One clarifying question before I start:

**Do you want a `profiles` table for user display name / avatar / passport cover color, or should I only use `auth.users`?** (Given onboarding needs a display name and cover color, I'd default to yes — but confirming.)
