import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ============ LIST FEED ============
export const listMyFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Ideas from my groups + 1:1s where I'm creator or recipient
    const { data: ideas, error } = await context.supabase
      .from("ideas")
      .select(`
        id, title, timeframe_label, tag, status, suggested_day, suggested_time,
        confirmed_time, group_id, recipient_user_id, created_by, created_at,
        groups(name, cover_color),
        idea_participants(id, user_id, lite_display_name, profiles(display_name, avatar_url)),
        availability_responses(id, submitted_via)
      `)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return ideas ?? [];
  });

// ============ LIST BY GROUP ============
export const listGroupIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ group_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: ideas, error } = await context.supabase
      .from("ideas")
      .select(`
        id, title, timeframe_label, tag, status, suggested_day, suggested_time,
        confirmed_time, group_id, recipient_user_id, created_by, created_at,
        groups(name, cover_color),
        idea_participants(id, user_id, lite_display_name, profiles(display_name, avatar_url)),
        availability_responses(id, submitted_via)
      `)
      .eq("group_id", data.group_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ideas ?? [];
  });

// ============ CREATE ============
export const createIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      title: z.string().min(1).max(120),
      timeframe_label: z.string().min(1).max(60),
      tag: z.string().min(1).max(40),
      group_id: z.string().uuid().nullable().optional(),
      recipient_user_id: z.string().uuid().nullable().optional(),
      target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    }).refine((d) => d.group_id || d.recipient_user_id, {
      message: "Must send to a group or a person",
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: idea, error } = await context.supabase
      .from("ideas")
      .insert({
        title: data.title,
        timeframe_label: data.timeframe_label,
        tag: data.tag,
        group_id: data.group_id ?? null,
        recipient_user_id: data.recipient_user_id ?? null,
        target_date: data.target_date ?? null,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    // Auto-add creator as participant
    await context.supabase
      .from("idea_participants")
      .insert({ idea_id: idea.id, user_id: context.userId });
    return idea;
  });

// ============ UPDATE ============
export const updateIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      idea_id: z.string().uuid(),
      title: z.string().min(1).max(120).optional(),
      timeframe_label: z.string().min(1).max(60).optional(),
      tag: z.string().min(1).max(40).optional(),
      target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      title?: string;
      timeframe_label?: string;
      tag?: string;
      target_date?: string | null;
    } = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.timeframe_label !== undefined) patch.timeframe_label = data.timeframe_label;
    if (data.tag !== undefined) patch.tag = data.tag;
    if (data.target_date !== undefined) patch.target_date = data.target_date;
    const { data: idea, error } = await context.supabase
      .from("ideas")
      .update(patch)
      .eq("id", data.idea_id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return idea;
  });

// ============ DELETE ============
export const deleteIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ idea_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ideas")
      .delete()
      .eq("id", data.idea_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// ============ DETAIL ============
export const getIdeaDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ idea_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: idea, error } = await context.supabase
      .from("ideas")
      .select(`
        *,
        groups(id, name, cover_color),
        idea_participants(id, user_id, lite_display_name,
          profiles(user_id, display_name, avatar_url),
          availability_responses(id, slots, submitted_via)
        )
      `)
      .eq("id", data.idea_id)
      .maybeSingle();
    if (error || !idea) throw new Error("Idea not found");

    const { data: hangout } = await context.supabase
      .from("hangouts")
      .select("*")
      .eq("idea_id", data.idea_id)
      .maybeSingle();

    return { idea, hangout, myUserId: context.userId };
  });

// ============ AVAILABILITY ============
const SlotSchema = z.object({
  mornings: z.array(z.string()).default([]),
  afternoons: z.array(z.string()).default([]),
  evenings: z.array(z.string()).default([]),
});

export const submitAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      idea_id: z.string().uuid(),
      slots: SlotSchema,
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Ensure a participant row exists for me
    let { data: participant } = await context.supabase
      .from("idea_participants")
      .select("id")
      .eq("idea_id", data.idea_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!participant) {
      const { data: newP, error } = await context.supabase
        .from("idea_participants")
        .insert({ idea_id: data.idea_id, user_id: context.userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      participant = newP;
    }
    // Upsert availability
    const { error: upErr } = await context.supabase
      .from("availability_responses")
      .upsert(
        {
          idea_id: data.idea_id,
          participant_id: participant.id,
          slots: data.slots,
          submitted_via: "app",
        },
        { onConflict: "participant_id" },
      );
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

// ============ SUGGEST TIME ============
export const suggestTime = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      idea_id: z.string().uuid(),
      suggested_day: z.string().min(1).max(60),
      suggested_time: z.string().min(1).max(60),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ideas")
      .update({
        status: "suggested",
        suggested_day: data.suggested_day,
        suggested_time: data.suggested_time,
      })
      .eq("id", data.idea_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ CONFIRM ============
export const confirmIdea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      idea_id: z.string().uuid(),
      confirmed_time: z.string(), // ISO
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: hangout, error: hErr } = await context.supabase
      .from("hangouts")
      .insert({
        idea_id: data.idea_id,
        confirmed_time: data.confirmed_time,
        confirmed_by: context.userId,
      })
      .select()
      .single();
    if (hErr) throw new Error(hErr.message);
    const { error: iErr } = await context.supabase
      .from("ideas")
      .update({ status: "confirmed", confirmed_time: data.confirmed_time, confirmed_by: context.userId })
      .eq("id", data.idea_id);
    if (iErr) throw new Error(iErr.message);
    return { hangout };
  });

// ============ LITE TOKEN ============
export const createLiteToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ idea_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Return existing or create new
    const { data: existing } = await context.supabase
      .from("lite_tokens")
      .select("token")
      .eq("idea_id", data.idea_id)
      .maybeSingle();
    if (existing) return { token: existing.token };
    const { data: token, error } = await context.supabase
      .from("lite_tokens")
      .insert({ idea_id: data.idea_id })
      .select("token")
      .single();
    if (error) throw new Error(error.message);
    return { token: token.token };
  });
