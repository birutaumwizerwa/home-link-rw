import { useState } from "react";
import { Link, useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  CalendarCheck,
  Clock,
  Coins,
  CreditCard,
  Heart,
  Home,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Shield,
  User,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { RegionMenu } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useUnreadCount } from "@/hooks/use-unread";
import { formatDate, initials } from "@/lib/format";

type Item = { to: string; tab?: string; label: string; icon: typeof Home; badge?: number };
type Group = { title?: string; items: Item[] };

function useNavGroups(): Group[] {
  const { t } = useTranslation();
  const { isVendor, isAdmin } = useAuth();
  const unread = useUnreadCount();
  const groups: Group[] = [];
  if (isAdmin)
    groups.push({
      title: t("app.adminArea"),
      items: [
        { to: "/admin", tab: "overview", label: t("app.overview"), icon: Shield },
        { to: "/admin", tab: "pending", label: t("app.pendingListings"), icon: Clock },
        { to: "/admin", tab: "vendors", label: t("app.vendors"), icon: BadgeCheck },
        { to: "/admin", tab: "reports", label: t("app.reports"), icon: AlertTriangle },
        { to: "/admin", tab: "users", label: t("app.users"), icon: Users },
        { to: "/admin", tab: "subscriptions", label: t("app.subscriptions"), icon: CreditCard },
        { to: "/admin", tab: "rates", label: t("app.rates"), icon: Coins },
      ],
    });
  if (isVendor)
    groups.push({
      title: t("app.propertyArea"),
      items: [
        { to: "/dashboard", tab: "overview", label: t("app.overview"), icon: LayoutDashboard },
        { to: "/dashboard", tab: "listings", label: t("dash.tabListings"), icon: List },
        { to: "/dashboard", tab: "buildings", label: t("dash.tabBuildings"), icon: Building2 },
        { to: "/dashboard", tab: "viewings", label: t("app.viewingRequests"), icon: CalendarCheck },
        { to: "/dashboard", tab: "plan", label: t("dash.tabPlan"), icon: CreditCard },
        { to: "/dashboard", tab: "profile", label: t("app.businessProfile"), icon: BadgeCheck },
      ],
    });
  groups.push({
    title: isVendor || isAdmin ? t("app.homeSearchArea") : undefined,
    items: [
      {
        to: "/account",
        label: isVendor || isAdmin ? t("app.myHomeSearch") : t("app.overview"),
        icon: Home,
      },
      { to: "/search", label: t("nav.search"), icon: Search },
      { to: "/saved", label: t("nav.saved"), icon: Heart },
      { to: "/viewings", label: t("nav.viewings"), icon: CalendarCheck },
      { to: "/messages", label: t("nav.messages"), icon: MessageCircle, badge: unread },
    ],
  });
  return groups;
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const search = useSearch({ strict: false }) as { tab?: string };
  const groups = useNavGroups();
  return (
    <nav className="space-y-6 p-3">
      {groups.map((g, i) => (
        <div key={g.title ?? i}>
          {g.title && <p className="mb-1 px-3 text-sm font-semibold text-white/55">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active =
                pathname === item.to && (!item.tab || (search.tab ?? "overview") === item.tab);
              return (
                <li key={item.label + item.to}>
                  <Link
                    to={item.to}
                    search={(item.tab && item.tab !== "overview" ? { tab: item.tab } : {}) as never}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-white text-ink" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {!!item.badge && (
                      <span className="rounded-full bg-marigold px-1.5 text-xs font-bold text-ink">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function NotificationBell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unread, markAllRead } = useNotifications();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("notify.title")}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-sans text-sm font-semibold tracking-normal">{t("notify.title")}</h2>
          {unread > 0 && (
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={markAllRead}
            >
              {t("notify.markAll")}
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{t("notify.empty")}</p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => navigate({ href: n.link })}
                  className="flex w-full gap-2 px-4 py-3 text-left hover:bg-muted"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-primary"}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{t(`notify.${n.kind}`)}</span>
                    {n.subject && (
                      <span className="block truncate text-sm text-muted-foreground">
                        {n.subject}
                      </span>
                    )}
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(n.created_at, i18n.resolvedLanguage)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, isVendor, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const email = user?.email;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto bg-ink lg:flex">
        <div className="flex h-16 shrink-0 items-center px-5">
          <Logo tone="light" />
        </div>
        <div className="flex-1">
          <SideNav />
        </div>
        <Link
          to="/"
          className="m-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          {t("app.backToSite")}
        </Link>
      </aside>

      <div className="flex min-w-0 flex-col pb-16 md:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-card px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("nav.menu")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 overflow-y-auto border-0 bg-ink p-0 text-white"
            >
              <SheetHeader className="px-5 pt-4">
                <SheetTitle className="text-white">HomeLink Rwanda</SheetTitle>
              </SheetHeader>
              <SideNav onNavigate={() => setOpen(false)} />
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="m-3 block rounded-md px-3 py-2 text-sm font-medium text-white/70"
              >
                {t("app.backToSite")}
              </Link>
            </SheetContent>
          </Sheet>
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {isVendor && (
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/post-listing">
                  <Plus className="h-4 w-4" /> {t("dash.newListing")}
                </Link>
              </Button>
            )}
            <div className="hidden sm:block">
              <RegionMenu />
            </div>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-1" aria-label={t("nav.account")}>
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                      {initials(profile?.full_name)}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {profile?.full_name}
                  <span className="block truncate font-normal text-muted-foreground">{email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <User className="mr-2 h-4 w-4" /> {t("nav.editProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
