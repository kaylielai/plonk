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

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      display_name: z.string().min(1).max(60).optional(),
      passport_cover_color: z.string().max(30).optional(),
      avatar_url: z.string().url().nullable().optional(),
      complete_onboarding: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      display_name?: string;
      passport_cover_color?: string;
      avatar_url?: string | null;
      onboarded_at?: string;
    } = {};
    if (data.display_name !== undefined) patch.display_name = data.display_name;
    if (data.passport_cover_color !== undefined) patch.passport_cover_color = data.passport_cover_color;
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url;
    if (data.complete_onboarding) patch.onboarded_at = new Date().toISOString();

    const { data: row, error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", context.userId)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    return row;
  });
