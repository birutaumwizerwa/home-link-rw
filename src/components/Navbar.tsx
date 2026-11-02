import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  CalendarCheck,
  Globe,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-unread";
import { CURRENCIES, type Currency } from "@/lib/constants";
import { initials } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "rw", label: "Kinyarwanda" },
];

const PUBLIC_LINKS = [
  { to: "/search", key: "nav.search" },
  { to: "/neighbourhoods", key: "nav.neighbourhoods" },
  { to: "/guide", key: "nav.guide" },
  { to: "/for-apartments", key: "nav.forApartments" },
] as const;

function RegionMenu() {
  const { t, i18n } = useTranslation();
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" aria-label={t("nav.region")}>
          <Globe className="h-4 w-4" />
          <span>
            {(i18n.resolvedLanguage ?? "en").toUpperCase()} / {currency}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("nav.language")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={i18n.resolvedLanguage}
          onValueChange={(v) => i18n.changeLanguage(v)}
        >
          {LANGUAGES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code}>
              {l.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("nav.currency")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
          {CURRENCIES.map((c) => (
            <DropdownMenuRadioItem key={c} value={c}>
              {c}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const { t } = useTranslation();
  const { isAuthenticated, isVendor, isAdmin, profile, signOut } = useAuth();
  const unread = useUnreadCount();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label={t("nav.main")}>
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <RegionMenu />
          </div>
          {!isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
              >
                {t("nav.signIn")}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
              >
                {t("nav.signUp")}
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-1.5" aria-label={t("nav.account")}>
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
                <DropdownMenuLabel>{profile?.full_name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <User className="mr-2 h-4 w-4" /> {t("nav.editProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/saved" })}>
                  <Heart className="mr-2 h-4 w-4" /> {t("nav.saved")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/viewings" })}>
                  <CalendarCheck className="mr-2 h-4 w-4" /> {t("nav.viewings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/messages" })}>
                  <MessageCircle className="mr-2 h-4 w-4" /> {t("nav.messages")}
                  {unread > 0 && (
                    <span className="ml-auto rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </DropdownMenuItem>
                {isVendor && (
                  <>
                    <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> {t("nav.dashboard")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/post-listing" })}>
                      <Plus className="mr-2 h-4 w-4" /> {t("nav.post")}
                    </DropdownMenuItem>
                  </>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <Shield className="mr-2 h-4 w-4" /> {t("nav.admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
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
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("nav.menu")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{t("nav.menu")}</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1 px-2">
                {PUBLIC_LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 font-medium hover:bg-muted"
                  >
                    {t(l.key)}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Link
                    to="/auth"
                    search={{ mode: "signin" }}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 font-medium hover:bg-muted"
                  >
                    {t("nav.signIn")}
                  </Link>
                )}
              </nav>
              <div className="mt-3 px-2 sm:hidden">
                <RegionMenu />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
