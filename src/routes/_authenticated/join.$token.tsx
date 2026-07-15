import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { joinGroupByToken } from "@/lib/groups.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/join/$token")({
  component: JoinPage,
});

function JoinPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const joinFn = useServerFn(joinGroupByToken);
  useEffect(() => {
    joinFn({ data: { token } })
      .then((g) => {
        toast.success(`Joined ${g.name}`);
        navigate({ to: "/" });
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Invalid invite");
        navigate({ to: "/" });
      });
  }, [token, joinFn, navigate]);
  return <div className="min-h-screen bg-background flex items-center justify-center text-sm text-ink-muted">Joining…</div>;
}
