import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const getLiteIdea = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const s = serverPublicClient();
    const { data: rows, error } = await s.rpc("lite_idea_summary", { _token: data.token });
    if (error) throw new Error(error.message);
    return rows?.[0] ?? null;
  });

export const submitLiteAvailability = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      token: z.string(),
      display_name: z.string().min(1).max(60),
      slots: z.object({
        mornings: z.array(z.string()).default([]),
        afternoons: z.array(z.string()).default([]),
        evenings: z.array(z.string()).default([]),
      }),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = serverPublicClient();
    const { data: participantId, error } = await s.rpc("lite_submit_availability", {
      _token: data.token,
      _display_name: data.display_name,
      _slots: data.slots,
    });
    if (error) throw new Error(error.message);
    return { participant_id: participantId };
  });
