import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const scheduleSlotsSchema = z.record(z.string(), z.array(z.enum(["morning", "afternoon", "evening"])));

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      display_name: z.string().min(1).max(60).optional(),
      username: z.string().regex(/^[A-Za-z0-9_]{3,20}$/, "3-20 letters, numbers, or underscores").nullable().optional(),
      passport_cover_color: z.string().max(30).optional(),
      avatar_url: z.string().url().nullable().optional(),
      complete_onboarding: z.boolean().optional(),
      schedule_view: z.enum(["week", "month"]).optional(),
      weekly_schedule: scheduleSlotsSchema.optional(),
      monthly_schedule: scheduleSlotsSchema.optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      display_name?: string;
      username?: string | null;
      passport_cover_color?: string;
      avatar_url?: string | null;
      onboarded_at?: string;
      schedule_view?: "week" | "month";
      weekly_schedule?: Record<string, ("morning" | "afternoon" | "evening")[]>;
      monthly_schedule?: Record<string, ("morning" | "afternoon" | "evening")[]>;
    } = {};
    if (data.display_name !== undefined) patch.display_name = data.display_name;
    if (data.username !== undefined) patch.username = data.username;
    if (data.passport_cover_color !== undefined) patch.passport_cover_color = data.passport_cover_color;
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url;
    if (data.schedule_view !== undefined) patch.schedule_view = data.schedule_view;
    if (data.weekly_schedule !== undefined) patch.weekly_schedule = data.weekly_schedule;
    if (data.monthly_schedule !== undefined) patch.monthly_schedule = data.monthly_schedule;
    if (data.complete_onboarding) patch.onboarded_at = new Date().toISOString();

    const { data: row, error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", context.userId)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === "23505") throw new Error("That username is already taken.");
      throw new Error(error.message);
    }
    return row;
  });

export const checkUsernameAvailable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ username: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!/^[A-Za-z0-9_]{3,20}$/.test(data.username)) {
      return { available: false, reason: "3-20 letters, numbers, or underscores" };
    }
    const { data: rows, error } = await context.supabase
      .from("profiles")
      .select("user_id")
      .ilike("username", data.username)
      .limit(1);
    if (error) throw new Error(error.message);
    const taken = (rows ?? []).some((r) => r.user_id !== context.userId);
    return { available: !taken, reason: taken ? "Already taken" : "" };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ confirm: z.literal("DELETE") }).parse(d))
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Cascades via FKs on auth.users where configured; explicit profile cleanup as belt-and-braces.
    await supabaseAdmin.from("profiles").delete().eq("user_id", context.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

