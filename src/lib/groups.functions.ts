import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listMyGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Get all groups I'm a member of + my membership row
    const { data: memberships, error: mErr } = await context.supabase
      .from("group_members")
      .select("group_id, pinned, groups(id, name, cover_color, invite_token, created_by)")
      .eq("user_id", context.userId);
    if (mErr) throw new Error(mErr.message);
    return (memberships ?? []).map((m) => ({
      ...m.groups!,
      pinned: m.pinned,
    }));
  });

export const createGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().min(1).max(60),
      cover_color: z.string().max(30).default("teal"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: group, error } = await context.supabase
      .from("groups")
      .insert({ name: data.name, cover_color: data.cover_color, created_by: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    // Auto-join as member
    const { error: mErr } = await context.supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: context.userId });
    if (mErr) throw new Error(mErr.message);
    return group;
  });

export const joinGroupByToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    // Need admin to look up group by token if user isn't a member yet
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: group, error } = await supabaseAdmin
      .from("groups")
      .select("id, name")
      .eq("invite_token", data.token)
      .maybeSingle();
    if (error || !group) throw new Error("Invalid invite link");
    const { error: mErr } = await supabaseAdmin
      .from("group_members")
      .upsert({ group_id: group.id, user_id: context.userId }, { onConflict: "group_id,user_id" });
    if (mErr) throw new Error(mErr.message);
    return group;
  });

export const togglePinGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ group_id: z.string().uuid(), pinned: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("group_members")
      .update({ pinned: data.pinned })
      .eq("group_id", data.group_id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getGroupDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ group_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: group, error } = await context.supabase
      .from("groups")
      .select("*")
      .eq("id", data.group_id)
      .maybeSingle();
    if (error || !group) throw new Error("Group not found");
    const { data: members } = await context.supabase
      .from("group_members")
      .select("user_id, joined_at, profiles(user_id, display_name, avatar_url)")
      .eq("group_id", data.group_id);
    return { group, members: members ?? [] };
  });
