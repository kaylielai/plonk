import { useState, useEffect } from "react";
import { X, Check, ArrowRight, Sunrise, Sun, Moon, Camera, Link as LinkIcon, Copy, Calendar as CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { getIdeaDetail, submitAvailability, suggestTime, confirmIdea, createLiteToken, updateIdea, deleteIdea } from "@/lib/ideas.functions";
import { createStampsFromPhoto } from "@/lib/stamps.functions";
import { addHangoutToGoogleCalendar, isGoogleCalendarConnected } from "@/lib/googleCalendar.functions";
import { supabase } from "@/integrations/supabase/client";
import { initials, pickColor } from "./IdeaCard";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface IdeaDetailSheetProps {
  ideaId: string | null;
  onClose: () => void;
}

export function IdeaDetailSheet({ ideaId, onClose }: IdeaDetailSheetProps) {
  const qc = useQueryClient();
  const detailFn = useServerFn(getIdeaDetail);
  const availFn = useServerFn(submitAvailability);
  const suggestFn = useServerFn(suggestTime);
  const confirmFn = useServerFn(confirmIdea);
  const liteFn = useServerFn(createLiteToken);
  const stampsFn = useServerFn(createStampsFromPhoto);
  const addToGcalFn = useServerFn(addHangoutToGoogleCalendar);
  const gcalStatusFn = useServerFn(isGoogleCalendarConnected);
  const { data: gcalStatus } = useQuery({
    queryKey: ["gcal-connected"],
    queryFn: () => gcalStatusFn(),
  });
  const addToGcalMut = useMutation({
    mutationFn: () => addToGcalFn({ data: { idea_id: ideaId! } }),
    onSuccess: (res) => {
      toast.success("Added to Google Calendar", {
        action: res.htmlLink
          ? { label: "Open", onClick: () => window.open(res.htmlLink!, "_blank") }
          : undefined,
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["idea", ideaId],
    queryFn: () => detailFn({ data: { idea_id: ideaId! } }),
    enabled: !!ideaId,
    retry: false,
  });

  const [slots, setSlots] = useState<{ mornings: string[]; afternoons: string[]; evenings: string[] }>({
    mornings: [], afternoons: [], evenings: [],
  });
  const [suggestDay, setSuggestDay] = useState("");
  const [suggestT, setSuggestT] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmDate, setConfirmDate] = useState("");
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [taggedIds, setTaggedIds] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [liteToken, setLiteToken] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTimeframe, setEditTimeframe] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editDate, setEditDate] = useState("");
  const updateFn = useServerFn(updateIdea);
  const deleteFn = useServerFn(deleteIdea);

  // Prefill my existing slots when data loads
  useEffect(() => {
    if (!data) return;
    const myPart = data.idea.idea_participants?.find((p) => p.user_id === data.myUserId);
    const rawResp = myPart?.availability_responses;
    const respObj = Array.isArray(rawResp) ? rawResp[0] : rawResp;
    const mySlots = respObj?.slots as typeof slots | undefined;
    if (mySlots) setSlots(mySlots);

    // default tagged: all app-user participants
    setTaggedIds(
      (data.idea.idea_participants ?? [])
        .filter((p) => p.user_id)
        .map((p) => p.user_id!) ?? [],
    );

    // Prefill confirm date/time from target_date if set (default 6:00 PM local)
    const td = (data.idea as { target_date?: string | null }).target_date;
    if (td && !confirmDate) {
      setConfirmDate(`${td}T18:00`);
    }
  }, [data]);


  if (!ideaId) return null;

  const idea = data?.idea;
  const hangout = data?.hangout;
  const myUserId = data?.myUserId;

  function toggle(band: keyof typeof slots, day: string) {
    setSlots((s) => ({
      ...s,
      [band]: s[band].includes(day) ? s[band].filter((d) => d !== day) : [...s[band], day],
    }));
  }

  const submitMut = useMutation({
    mutationFn: () => availFn({ data: { idea_id: ideaId, slots } }),
    onSuccess: () => {
      toast.success("Sent!");
      qc.invalidateQueries({ queryKey: ["idea", ideaId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  const suggestMut = useMutation({
    mutationFn: () => suggestFn({ data: { idea_id: ideaId, suggested_day: suggestDay, suggested_time: suggestT } }),
    onSuccess: () => {
      toast.success("Time suggested");
      qc.invalidateQueries({ queryKey: ["idea", ideaId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  const confirmMut = useMutation({
    mutationFn: () => confirmFn({ data: { idea_id: ideaId, confirmed_time: new Date(confirmDate).toISOString() } }),
    onSuccess: () => {
      toast.success("Plan confirmed ✨");
      setShowConfirm(false);
      qc.invalidateQueries({ queryKey: ["idea", ideaId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  async function handleLite() {
    try {
      const { token } = await liteFn({ data: { idea_id: ideaId } });
      const url = `${window.location.origin}/i/${encodeURIComponent(token)}`;
      setLiteToken(url);
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handlePhotoUpload() {
    if (!photoFile || !hangout || taggedIds.length === 0) return;
    setUploading(true);
    try {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${hangout.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("hangout-photos")
        .upload(path, photoFile, { contentType: photoFile.type });
      if (upErr) throw upErr;

      await stampsFn({
        data: {
          hangout_id: hangout.id,
          photo_path: path,
          tagged_user_ids: taggedIds,
          caption: caption || undefined,
          tag: idea!.tag,
          title: idea!.title,
        },
      });
      toast.success("Stamped! ✦");
      setShowPhoto(false);
      setPhotoFile(null);
      setCaption("");
      qc.invalidateQueries({ queryKey: ["idea", ideaId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["stamps"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md max-h-[85vh] overflow-hidden rounded-3xl bg-paper shadow-2xl flex flex-col">

        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <div className="flex justify-end px-5 pt-2">
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-ink-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-10" style={{ maxHeight: "82vh" }}>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-ink-muted">Loading…</div>
          ) : error || !idea ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-foreground">Couldn't load this idea</p>
              <p className="mt-1 text-xs text-ink-muted">{error instanceof Error ? error.message : "It may have been removed or you no longer have access."}</p>
              <button onClick={onClose} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Close</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-sm bg-ink px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
                  {idea.tag}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  {idea.groups?.name ?? "1:1"}
                </span>
              </div>
              <h2 className="mt-3 text-[24px] font-semibold leading-tight">{idea.title}</h2>
              <p className="mt-1 font-mono text-sm text-ink-muted">{idea.timeframe_label}</p>

              {/* Participants */}
              <div className="mt-6">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Who's in</p>
                <div className="flex flex-col gap-2.5">
                  {(idea.idea_participants ?? []).map((p) => {
                    const name = p.profiles?.display_name || p.lite_display_name || "?";
                    const id = p.user_id ?? p.id;
                    const ar = p.availability_responses;
                    const responded = Array.isArray(ar) ? ar.length > 0 : !!ar;

                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold ${pickColor(id)}`}>
                          {initials(name)}
                        </span>
                        <span className="flex-1 text-sm font-medium">{name}</span>
                        {responded ? (
                          <span className="flex items-center gap-1 rounded-full bg-teal-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-teal">
                            <Check className="h-3 w-3" /> In
                          </span>
                        ) : (
                          <span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                            Pending
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Availability picker (collecting state) */}
              {(idea.status === "collecting" || idea.status === "suggested") && (
                <div className="mt-6 rounded-2xl bg-cream p-4 ring-1 ring-border/50">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Your availability</p>
                  {(["mornings", "afternoons", "evenings"] as const).map((band) => (
                    <div key={band} className="mb-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        {band === "mornings" && <Sunrise className="h-3.5 w-3.5 text-gold" />}
                        {band === "afternoons" && <Sun className="h-3.5 w-3.5 text-coral" />}
                        {band === "evenings" && <Moon className="h-3.5 w-3.5 text-teal" />}
                        <span className="text-xs font-medium capitalize">{band}</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {DAYS.map((d) => {
                          const active = slots[band].includes(d);
                          return (
                            <button
                              key={d}
                              onClick={() => toggle(band, d)}
                              className={`rounded-md py-1.5 text-[10px] font-medium ${
                                active ? "bg-teal text-primary-foreground" : "bg-paper text-ink-muted"
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => submitMut.mutate()}
                    disabled={submitMut.isPending}
                    className="mt-2 w-full rounded-lg bg-primary py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"
                  >
                    {submitMut.isPending ? "…" : "Save my availability"}
                  </button>
                </div>
              )}

              {/* Suggest time (collecting → suggested) */}
              {idea.status === "collecting" && (
                <div className="mt-4 rounded-2xl bg-paper p-4 ring-1 ring-border/50">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                    Have a specific time in mind?
                  </p>
                  <div className="flex gap-2">
                    <input
                      placeholder="Day (Thu)"
                      value={suggestDay}
                      onChange={(e) => setSuggestDay(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-cream px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Time (7pm)"
                      value={suggestT}
                      onChange={(e) => setSuggestT(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-cream px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => suggestMut.mutate()}
                    disabled={!suggestDay || !suggestT || suggestMut.isPending}
                    className="mt-3 w-full rounded-lg border border-teal/40 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-teal disabled:opacity-50"
                  >
                    Propose this time
                  </button>
                </div>
              )}

              {/* Suggested block */}
              {idea.status === "suggested" && (
                <div className="mt-4 rounded-2xl bg-gold-soft/50 p-4 ring-1 ring-gold/30">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold">✦ Suggested</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {idea.suggested_day} · {idea.suggested_time}
                  </p>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"
                  >
                    Confirm time <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Confirm form */}
              {showConfirm && (
                <div className="mt-3 rounded-2xl bg-cream p-4 ring-1 ring-border/50">
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                    Lock in a date + time
                  </label>
                  <input
                    type="datetime-local"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-paper px-3 py-2.5 text-sm"
                  />
                  <button
                    onClick={() => confirmMut.mutate()}
                    disabled={!confirmDate || confirmMut.isPending}
                    className="mt-3 w-full rounded-lg bg-primary py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"
                  >
                    {confirmMut.isPending ? "…" : "Lock it in"}
                  </button>
                </div>
              )}

              {/* Confirmed → add photo */}
              {idea.status === "confirmed" && hangout && (
                <div className="mt-4 rounded-2xl bg-teal-soft/50 p-4 ring-1 ring-teal/30">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal">✓ Confirmed</p>
                  <p className="mt-1 text-lg font-semibold">
                    {new Date(hangout.confirmed_time).toLocaleString([], {
                      weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </p>
                  <button
                    onClick={() => setShowPhoto(true)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"
                  >
                    <Camera className="h-4 w-4" /> Upload photo → stamp
                  </button>
                  <button
                    onClick={() => {
                      if (!gcalStatus?.connected) {
                        toast.error("Connect Google Calendar in Profile first.");
                        return;
                      }
                      addToGcalMut.mutate();
                    }}
                    disabled={addToGcalMut.isPending}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-teal/40 bg-paper py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-teal disabled:opacity-50"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {addToGcalMut.isPending ? "Adding…" : "Add to Google Calendar"}
                  </button>
                </div>
              )}

              {/* Photo upload UI */}
              {showPhoto && idea.status === "confirmed" && (
                <div className="mt-3 rounded-2xl bg-cream p-4 ring-1 ring-border/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                    className="w-full text-xs"
                  />
                  <p className="mt-3 mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                    Who was actually there? (tap to include)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(idea.idea_participants ?? [])
                      .filter((p) => p.user_id)
                      .map((p) => {
                        const name = p.profiles?.display_name || "?";
                        const uid = p.user_id!;
                        const active = taggedIds.includes(uid);
                        return (
                          <button
                            key={uid}
                            onClick={() =>
                              setTaggedIds((ids) =>
                                ids.includes(uid) ? ids.filter((i) => i !== uid) : [...ids, uid],
                              )
                            }
                            className={`rounded-full px-3 py-1.5 text-[11px] ${
                              active ? "bg-teal text-primary-foreground" : "bg-paper text-ink-muted"
                            }`}
                          >
                            {name}
                            {uid === myUserId ? " (you)" : ""}
                          </button>
                        );
                      })}
                  </div>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="a line about this hangout (optional)"
                    className="mt-3 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm"
                    rows={2}
                  />
                  <button
                    onClick={handlePhotoUpload}
                    disabled={!photoFile || uploading || taggedIds.length === 0}
                    className="mt-3 w-full rounded-lg bg-primary py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"
                  >
                    {uploading ? "generating stamp…" : "Mint stamps ✦"}
                  </button>
                </div>
              )}

              {/* Completed */}
              {idea.status === "completed" && (
                <div className="mt-4 rounded-2xl bg-teal-soft/40 p-4 ring-1 ring-teal/30 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal">✓ This happened</p>
                  <p className="mt-1 text-sm text-ink-muted">Check your plonk for the stamp.</p>
                </div>
              )}

              {/* Lite link */}
              {idea.status !== "completed" && (
                <button
                  onClick={handleLite}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted"
                >
                  {liteToken ? <Copy className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
                  {liteToken ? "Link copied ✓" : "Share with a non-user (lite link)"}
                </button>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </>

  );
}
