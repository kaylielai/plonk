import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { IdeaDetailSheet } from "@/components/passport/IdeaDetailSheet";
import { AppShell } from "@/components/passport/BottomNav";

export const Route = createFileRoute("/_authenticated/ideas/$ideaId")({
  head: () => ({
    meta: [
      { title: "Hangout details — plonk" },
      { name: "description", content: "See who's in, when it's happening, and what's next." },
    ],
  }),
  component: IdeaDetailPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="px-5 pt-10 text-center text-sm text-ink-muted">{error.message}</div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="px-5 pt-10 text-center text-sm text-ink-muted">Idea not found.</div>
    </AppShell>
  ),
});

function IdeaDetailPage() {
  const { ideaId } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();

  function handleClose() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  }

  return (
    <AppShell>
      <div className="min-h-[60vh]" />
      <IdeaDetailSheet ideaId={ideaId} onClose={handleClose} />
    </AppShell>
  );
}
