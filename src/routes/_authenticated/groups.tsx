import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/passport/BottomNav";
import { Plus, ArrowLeft, Copy, Search, MoreVertical, UserPlus, Users, X, Pencil } from "lucide-react";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listMyGroups, createGroup, getGroupDetail, addGroupMemberByUsername, renameGroup } from "@/lib/groups.functions";
import { listGroupIdeas, createIdea } from "@/lib/ideas.functions";
import { IdeaCard, initials, pickColor, type DisplayIdea } from "@/components/passport/IdeaCard";
import { NewIdeaSheet } from "@/components/passport/NewIdeaSheet";
import { IdeaDetailSheet } from "@/components/passport/IdeaDetailSheet";


export const Route = createFileRoute("/_authenticated/groups")({
  head: () => ({ meta: [{ title: "Groups — plonk" }] }),
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
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => groups.filter((g) => g.name.toLowerCase().includes(search.trim().toLowerCase())),
    [groups, search],
  );

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

      <div className="px-5 pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups"
            className="w-full rounded-xl border border-border bg-paper py-2.5 pl-9 pr-9 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:bg-secondary"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

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
        {filtered.length === 0 && !creating && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-3xl">✦</span>
            <p className="text-lg font-medium">{search ? "No matches" : "No groups yet"}</p>
            <p className="text-sm text-ink-muted">
              {search ? "Try a different search." : "Create a group, then invite friends."}
            </p>
          </div>
        )}
        {filtered.map((g) => (
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
  const addByUsernameFn = useServerFn(addGroupMemberByUsername);
  const renameFn = useServerFn(renameGroup);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => detailFn({ data: { group_id: groupId } }),
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState<null | "members" | "add" | "rename">(null);
  const [username, setUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(false);


  async function copyInvite() {
    if (!data) return;
    const url = `${window.location.origin}/join/${encodeURIComponent(data.group.invite_token)}`;
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
    setMenuOpen(false);
  }

  async function addByUsername() {
    if (!username.trim()) return;
    setAdding(true);
    try {
      const added = await addByUsernameFn({ data: { group_id: groupId, username: username.trim() } });
      toast.success(`Added ${added?.display_name || username}`);
      setUsername("");
      setSheet(null);
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setAdding(false);
    }
  }

  async function submitRename() {
    if (!newName.trim() || newName.trim() === data?.group.name) { setSheet(null); return; }
    setRenaming(true);
    try {
      await renameFn({ data: { group_id: groupId, name: newName.trim() } });
      toast.success("Group renamed");
      setSheet(null);
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setRenaming(false);
    }
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pb-4 pt-8">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-soft text-teal text-sm font-semibold">
          {data?.group.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="flex-1 text-[20px] font-semibold">{data?.group.name}</span>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary"
            aria-label="More"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-xl border border-border bg-paper shadow-lg">
                <button
                  onClick={() => { setSheet("members"); setMenuOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-secondary"
                >
                  <Users className="h-4 w-4 text-ink-muted" /> View members
                </button>
                <button
                  onClick={() => { setSheet("add"); setMenuOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-secondary"
                >
                  <UserPlus className="h-4 w-4 text-ink-muted" /> Add by username
                </button>
                <button
                  onClick={() => { setNewName(data?.group.name ?? ""); setSheet("rename"); setMenuOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-secondary"
                >
                  <Pencil className="h-4 w-4 text-ink-muted" /> Rename group
                </button>
                <button
                  onClick={copyInvite}
                  className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-sm hover:bg-secondary"
                >
                  <Copy className="h-4 w-4 text-ink-muted" /> Copy invite link
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {sheet === "members" && (
        <SheetOverlay title={`Members · ${data?.members.length ?? 0}`} onClose={() => setSheet(null)}>
          <div className="flex flex-col gap-2">
            {(data?.members ?? []).map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-xl bg-paper p-3 ring-1 ring-border/40">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tan text-[12px] font-semibold text-ink">
                  {(m.profiles?.display_name || "?").slice(0, 2).toUpperCase()}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{m.profiles?.display_name || "Anonymous"}</span>
                  {m.profiles?.username && (
                    <span className="text-xs text-ink-muted">@{m.profiles.username}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SheetOverlay>
      )}

      {sheet === "add" && (
        <SheetOverlay title="Add by username" onClose={() => setSheet(null)}>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Username</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-cream px-3 py-2.5">
            <span className="text-sm text-ink-muted">@</span>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
              placeholder="username"
              maxLength={20}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={addByUsername}
            disabled={adding || !username.trim()}
            className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add to group"}
          </button>
        </SheetOverlay>
      )}

      {sheet === "rename" && (
        <SheetOverlay title="Rename group" onClose={() => setSheet(null)}>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Group name</label>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={60}
            placeholder="Group name"
            className="w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter") submitRename(); }}
          />
          <p className="mt-2 text-[11px] text-ink-muted">Only the group creator can rename this group.</p>
          <button
            onClick={submitRename}
            disabled={renaming || !newName.trim() || newName.trim() === data?.group.name}
            className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"
          >
            {renaming ? "Saving…" : "Save name"}
          </button>
        </SheetOverlay>
      )}
    </AppShell>
  );
}

function SheetOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-background p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
