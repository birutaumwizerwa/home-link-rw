import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, Heart, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-unread";

export function BottomNav() {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const unread = useUnreadCount();

  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/search", icon: Search, label: "Search" },
    ...(isAuthenticated
      ? [
          { to: "/saved", icon: Heart, label: "Saved" },
          { to: "/messages", icon: MessageCircle, label: "Messages", badge: unread },
          { to: "/dashboard", icon: User, label: "Profile" },
        ]
      : [{ to: "/auth", icon: User, label: "Sign in" }]),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t bg-background/95 backdrop-blur-md md:hidden">
      {items.map(({ to, icon: Icon, label, badge }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${active ? "text-primary" : "text-muted-foreground"}`}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {badge && badge > 0 ? (
                <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
