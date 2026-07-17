import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  authorizeAppUserOAuth,
  callAsAppUser,
  disconnectAppUser,
} from "@/integrations/lovable/appUserConnector";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "google_calendar";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.events",
];

// ============ START OAUTH ============
export const startGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ targetOrigin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const clientKey = process.env.GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY;
    if (!clientKey) throw new Error("Google Calendar connector not configured.");
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl: `${data.targetOrigin}/profile`,
      responseMode: "web_message",
      webMessageTargetOrigin: data.targetOrigin,
      credentialsConfiguration: { scopes: SCOPES },
    });
    return { authorizationUrl };
  });

// ============ SAVE ============
export const saveGoogleCalendarConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ connectionAPIKey: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { saveConnectionKeyForUser } = await import("@/lib/appUserConnections.server");
    await saveConnectionKeyForUser(context.userId, CONNECTOR_ID, data.connectionAPIKey);
    return { ok: true };
  });

// ============ STATUS ============
export const isGoogleCalendarConnected = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("app_user_connections")
      .select("id")
      .eq("user_id", context.userId)
      .eq("connector_id", CONNECTOR_ID)
      .maybeSingle();
    return { connected: !!data };
  });

// ============ DISCONNECT ============
export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getConnectionKeyForUser, deleteConnectionForUser } = await import(
      "@/lib/appUserConnections.server"
    );
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (key) {
      try {
        await disconnectAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey: key,
          connectorId: CONNECTOR_ID,
        });
      } catch {
        // Continue even if remote revoke fails
      }
    }
    await deleteConnectionForUser(context.userId, CONNECTOR_ID);
    return { ok: true };
  });

// ============ ADD HANGOUT ============
export const addHangoutToGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ idea_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Load idea + hangout under RLS (participant access enforced)
    const { data: idea, error: iErr } = await context.supabase
      .from("ideas")
      .select("id, title, tag, timeframe_label, groups(name)")
      .eq("id", data.idea_id)
      .maybeSingle();
    if (iErr || !idea) throw new Error("Idea not found");

    const { data: hangout, error: hErr } = await context.supabase
      .from("hangouts")
      .select("confirmed_time")
      .eq("idea_id", data.idea_id)
      .maybeSingle();
    if (hErr || !hangout) throw new Error("Hangout not confirmed yet");

    const { getConnectionKeyForUser } = await import("@/lib/appUserConnections.server");
    const connectionAPIKey = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!connectionAPIKey) throw new Error("Google Calendar isn't connected. Connect it from Profile first.");

    const start = new Date(hangout.confirmed_time);
    const end = new Date(start.getTime() + 90 * 60 * 1000); // default 90 min
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const groupName = (idea.groups as { name?: string } | null)?.name;
    const description = [
      "Confirmed via plonk ✨",
      groupName ? `Group: ${groupName}` : null,
      idea.tag ? `Tag: ${idea.tag}` : null,
      idea.timeframe_label ? `Timeframe: ${idea.timeframe_label}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: CONNECTOR_ID,
      path: "/calendar/v3/calendars/primary/events",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: idea.title,
          description,
          start: { dateTime: start.toISOString(), timeZone: tz },
          end: { dateTime: end.toISOString(), timeZone: tz },
          source: { title: "plonk", url: "https://plonk.lovable.app" },
        }),
      },
    });
    const bodyText = await res.text();
    if (!res.ok) {
      throw new Error(`Google Calendar rejected the event [${res.status}]: ${bodyText.slice(0, 300)}`);
    }
    const event = JSON.parse(bodyText) as { id?: string; htmlLink?: string };
    return { ok: true, htmlLink: event.htmlLink ?? null };
  });
