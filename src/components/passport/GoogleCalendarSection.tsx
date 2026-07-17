import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  isGoogleCalendarConnected,
  startGoogleCalendarConnect,
  saveGoogleCalendarConnection,
  disconnectGoogleCalendar,
} from "@/lib/googleCalendar.functions";
import { connectAppUser } from "@/integrations/lovable/appUserConnectorClient";

const GATEWAY = "https://connector-gateway.lovable.dev";

export function GoogleCalendarSection() {
  const qc = useQueryClient();
  const statusFn = useServerFn(isGoogleCalendarConnected);
  const startFn = useServerFn(startGoogleCalendarConnect);
  const saveFn = useServerFn(saveGoogleCalendarConnection);
  const disconnectFn = useServerFn(disconnectGoogleCalendar);

  const { data, isLoading } = useQuery({
    queryKey: ["gcal-connected"],
    queryFn: () => statusFn(),
  });
  const connected = !!data?.connected;

  const connectMut = useMutation({
    mutationFn: async () => {
      const result = await connectAppUser({
        connectorId: "google_calendar",
        gatewayBaseUrl: GATEWAY,
        start: (targetOrigin) => startFn({ data: { targetOrigin } }),
      });
      if (!result.success) throw new Error(result.error || "Sign in failed");
      if (!result.connectionAPIKey) throw new Error("No connection key returned");
      await saveFn({ data: { connectionAPIKey: result.connectionAPIKey } });
    },
    onSuccess: () => {
      toast.success("Google Calendar connected");
      qc.invalidateQueries({ queryKey: ["gcal-connected"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const disconnectMut = useMutation({
    mutationFn: () => disconnectFn(),
    onSuccess: () => {
      toast.success("Disconnected");
      qc.invalidateQueries({ queryKey: ["gcal-connected"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <section className="mx-5 mt-4 rounded-3xl bg-paper p-5 ring-1 ring-border/40">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Integrations</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream ring-1 ring-border/40">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[15px] font-semibold">Google Calendar</p>
            <p className="text-xs text-ink-muted">
              {connected ? "Confirmed hangouts sync to your calendar." : "Add confirmed hangouts to your calendar."}
            </p>
          </div>
        </div>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
        ) : connected ? (
          <button
            onClick={() => disconnectMut.mutate()}
            disabled={disconnectMut.isPending}
            className="rounded-xl border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted hover:bg-secondary"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => connectMut.mutate()}
            disabled={connectMut.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-50"
          >
            {connectMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Connect
          </button>
        )}
      </div>
    </section>
  );
}
