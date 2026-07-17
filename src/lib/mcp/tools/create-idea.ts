import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function client(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_idea",
  title: "Create hangout idea",
  description: "Float a new plonk hangout idea to one of the signed-in user's groups or a 1:1 recipient. Must include either group_id or recipient_user_id.",
  inputSchema: {
    title: z.string().trim().min(1).max(120).describe("Short idea title, e.g. 'coffee at Blue Bottle'."),
    timeframe_label: z.string().trim().min(1).max(60).describe("Loose timeframe, e.g. 'this weekend', 'next week'."),
    tag: z.string().trim().min(1).max(40).describe("Vibe tag, e.g. 'coffee', 'dinner', 'walk'."),
    group_id: z.string().uuid().optional().describe("Target group ID (mutually exclusive with recipient_user_id)."),
    recipient_user_id: z.string().uuid().optional().describe("Target user ID for a 1:1 (mutually exclusive with group_id)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    if (!input.group_id && !input.recipient_user_id) {
      return { content: [{ type: "text", text: "Must include group_id or recipient_user_id" }], isError: true };
    }
    const sb = client(ctx);
    const { data: idea, error } = await sb
      .from("ideas")
      .insert({
        title: input.title,
        timeframe_label: input.timeframe_label,
        tag: input.tag,
        group_id: input.group_id ?? null,
        recipient_user_id: input.recipient_user_id ?? null,
        created_by: ctx.getUserId(),
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    await sb.from("idea_participants").insert({ idea_id: idea.id, user_id: ctx.getUserId() });
    return {
      content: [{ type: "text", text: `Created idea ${idea.id}` }],
      structuredContent: { idea },
    };
  },
});
