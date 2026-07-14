import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Calendar, Stamp, User } from "lucide-react";

const tabs = [
  { to: "/", label: "home", icon: Home },
  { to: "/groups", label: "groups", icon: Users },
  { to: "/calendar", label: "calendar", icon: Calendar },
  { to: "/stamps", label: "stamps", icon: Stamp },
  { to: "/profile", label: "profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-[430px] items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-2">
        {tabs.map((t) => {
          const active = pathname === t.to;
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                active ? "text-teal" : "text-ink-muted"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[430px] pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
