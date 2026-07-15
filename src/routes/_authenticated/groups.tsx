import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { Plus, ArrowLeft, Copy } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listMyGroups, createGroup, getGroupDetail } from "@/lib/groups.functions";

export const Route = createFileRoute("/_authenticated/groups")({
  head: () => ({ meta: [{ title: "Groups — Passport" }] }),
  component: GroupsPage,
});

function GroupsPage() {
  const groupsFn = useServerFn(listMyGroups);
  const createFn = useServerFn(createGroup);
  const qc = useQueryClient();
  const { data: groups = [] } = useQuery({ queryKey: ["groups"], queryFn: () => groupsFn() });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  if (selectedId) return <GroupDetail groupId={selectedId} onBack={() => setSelectedId(null)} />;

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await createFn({ data: { name: name.trim(), cover_color: "teal" } });
      setName("");
      setCreating(false);
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pb-4 pt-8">
        <h1 className="text-[26px] font-semibold tracking-tight">Groups</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Plus className="h-5 w-5" />
        </button>
      </header>

      {creating && (
        <div className="mx-5 mb-4 rounded-2xl bg-paper p-4 ring-1 ring-border/50">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="group name (e.g. Roommates)"
            className="w-full rounded-lg border border-border bg-cream px-3 py-2.5 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={() => { setCreating(false); setName(""); }} className="flex-1 rounded-lg border border-border py-2 text-xs">Cancel</button>
            <button onClick={handleCreate} className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">Create</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0 px-5">
        {groups.length === 0 && !creating && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-3xl">✦</span>
            <p className="text-lg font-medium">No groups yet</p>
            <p className="text-sm text-ink-muted">Create a group, then invite friends.</p>
          </div>
        )}
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedId(g.id)}
            className="flex items-center gap-4 py-3 text-left"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-soft text-teal text-sm font-semibold">
              {g.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[20px] font-semibold text-foreground">{g.name}</span>
          </button>
        ))}
      </div>
    </AppShell>
  );
}

function GroupDetail({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const detailFn = useServerFn(getGroupDetail);
  const { data } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => detailFn({ data: { group_id: groupId } }),
  });

  async function copyInvite() {
    if (!data) return;
    const url = `${window.location.origin}/join/${encodeURIComponent(data.group.invite_token)}`;
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pb-4 pt-8">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-soft text-teal text-sm font-semibold">
          {data?.group.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="text-[20px] font-semibold">{data?.group.name}</span>
      </header>

      <div className="px-5">
        <button
          onClick={copyInvite}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted"
        >
          <Copy className="h-3.5 w-3.5" /> Copy invite link
        </button>

        <p className="mt-6 mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Members</p>
        <div className="flex flex-col gap-2">
          {(data?.members ?? []).map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 rounded-xl bg-paper p-3 ring-1 ring-border/40">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tan text-[12px] font-semibold text-ink">
                {(m.profiles?.display_name || "?").slice(0, 2).toUpperCase()}
              </span>
              <span className="text-sm">{m.profiles?.display_name || "Anonymous"}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
