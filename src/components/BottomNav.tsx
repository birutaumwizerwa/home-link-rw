import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, Heart, MessageCircle, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { homePath } from "@/lib/roles";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-unread";

export function BottomNav() {
  const { t } = useTranslation();
  const { isAuthenticated, roles } = useAuth();
  const { pathname } = useLocation();
  const unread = useUnreadCount();

  const items = [
    { to: isAuthenticated ? homePath(roles) : "/", icon: Home, label: t("nav.home") },
    { to: "/search", icon: Search, label: t("nav.search") },
    ...(isAuthenticated
      ? [
          { to: "/saved", icon: Heart, label: t("nav.saved") },
          { to: "/messages", icon: MessageCircle, label: t("nav.messages"), badge: unread },
          { to: "/profile", icon: User, label: t("nav.profile") },
        ]
      : [{ to: "/auth", icon: User, label: t("nav.signIn") }]),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card md:hidden">
      {items.map(({ to, icon: Icon, label, badge }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${active ? "text-primary" : "text-muted-foreground"}`}
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
