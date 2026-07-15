import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listMyStamps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("stamps")
      .select(`
        id, tag, photo_url, art_url, caption, created_at, hangout_id,
        hangouts(idea_id, confirmed_time,
          ideas(title, timeframe_label, group_id, groups(name))
        )
      `)
      .eq("owner_user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getStampPhotoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    // Determine bucket from path prefix
    const [bucket, ...rest] = data.path.split("/");
    const objectPath = rest.join("/");
    const { data: signed, error } = await context.supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, 60 * 60);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

/**
 * After a photo is uploaded to hangout-photos bucket, create stamps for tagged attendees
 * and try to generate stamp art via Lovable AI (best-effort — falls back to photo).
 */
export const createStampsFromPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      hangout_id: z.string().uuid(),
      photo_path: z.string(), // path in hangout-photos bucket
      tagged_user_ids: z.array(z.string().uuid()).min(1),
      caption: z.string().max(280).optional(),
      tag: z.string(),
      title: z.string(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // ---- Authorization: caller must be a participant of the hangout's idea,
    // and every tagged user must also be a participant of that idea. ----
    const { data: hangoutRow, error: hangoutErr } = await context.supabase
      .from("hangouts")
      .select("id, idea_id")
      .eq("id", data.hangout_id)
      .maybeSingle();
    if (hangoutErr) throw new Error(hangoutErr.message);
    if (!hangoutRow) throw new Error("Hangout not found or access denied");

    // Caller must be a real participant (not just able to see the idea).
    const { data: callerPart, error: callerErr } = await context.supabase
      .from("idea_participants")
      .select("user_id")
      .eq("idea_id", hangoutRow.idea_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (callerErr) throw new Error(callerErr.message);
    if (!callerPart) throw new Error("Only participants can create stamps for this hangout");

    // Every tagged user must be a participant of the same idea.
    const { data: participantRows, error: partsErr } = await context.supabase
      .from("idea_participants")
      .select("user_id")
      .eq("idea_id", hangoutRow.idea_id);
    if (partsErr) throw new Error(partsErr.message);
    const participantIds = new Set(
      (participantRows ?? []).map((r) => r.user_id).filter((u): u is string => !!u),
    );
    const invalid = data.tagged_user_ids.filter((uid) => !participantIds.has(uid));
    if (invalid.length > 0) {
      throw new Error("One or more tagged users are not participants of this hangout");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Try to generate art via Lovable AI (best-effort)
    let art_url: string | null = null;
    try {
      art_url = await generateStampArt(data.tag, data.title, data.caption ?? "");
    } catch (err) {
      console.error("Stamp art generation failed", err);
    }

    // Signed URL for photo so it can be shown to attendees
    const photoUrl = `hangout-photos/${data.photo_path.replace(/^hangout-photos\//, "")}`;

    // Insert one stamp per tagged attendee
    const rows = data.tagged_user_ids.map((uid) => ({
      hangout_id: data.hangout_id,
      owner_user_id: uid,
      tag: data.tag,
      photo_url: photoUrl,
      art_url,
      caption: data.caption ?? null,
    }));
    const { error } = await supabaseAdmin
      .from("stamps")
      .upsert(rows, { onConflict: "hangout_id,owner_user_id" });
    if (error) throw new Error(error.message);

    // Mark idea as completed
    const { data: hangout } = await supabaseAdmin
      .from("hangouts")
      .select("idea_id")
      .eq("id", data.hangout_id)
      .maybeSingle();
    if (hangout) {
      await supabaseAdmin.from("ideas").update({ status: "completed" }).eq("id", hangout.idea_id);
    }

    // Notify tagged attendees
    const notifs = data.tagged_user_ids
      .filter((uid) => uid !== context.userId)
      .map((uid) => ({
        user_id: uid,
        kind: "stamp_minted",
        payload: { hangout_id: data.hangout_id, title: data.title, tag: data.tag },
      }));
    if (notifs.length > 0) {
      await supabaseAdmin.from("notifications").insert(notifs);
    }

    return { count: rows.length, art_url };
  });

/**
 * Generate a stamp image using Lovable AI Gateway.
 * Uses Gemini image model with a style-locked prompt.
 * Uploads to stamp-art bucket and returns the storage path.
 */
async function generateStampArt(tag: string, title: string, caption: string): Promise<string | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;

  const prompt = `A vintage-style postage stamp illustration for a friendship keepsake app. Simple, single-color line art on a warm cream background, framed by a subtle perforated border. Subject: ${tag.toLowerCase()} — "${title}". ${caption ? `Mood: ${caption}.` : ""} Style: minimal, tactile, hand-drawn feeling, muted color palette (navy ink on cream), no text, no logos. Square, centered.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    console.error("AI gateway image failed", res.status, await res.text());
    return null;
  }
  const json = await res.json() as {
    choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
  };
  const imageData = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageData) return null;

  // Data URL: data:image/png;base64,....
  const match = /^data:(image\/[\w+.-]+);base64,(.+)$/.exec(imageData);
  if (!match) return null;
  const mime = match[1];
  const b64 = match[2];
  const buffer = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const ext = mime.split("/")[1].split("+")[0];
  const path = `${crypto.randomUUID()}.${ext}`;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.storage
    .from("stamp-art")
    .upload(path, buffer, { contentType: mime, upsert: false });
  if (error) {
    console.error("Failed to upload stamp art", error);
    return null;
  }
  return `stamp-art/${path}`;
}
