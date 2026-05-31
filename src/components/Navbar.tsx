import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Home, Search, Plus, Heart, MessageCircle, LogOut, User, Shield, Globe } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-unread";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isVendor, isAdmin, profile, user, signOut } = useAuth();
  const unread = useUnreadCount();
  const navigate = useNavigate();

  const { data: navProfile } = useQuery({
    queryKey: ["nav-avatar", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("avatar_url, full_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">HomeLink<span className="text-primary"> Rwanda</span></span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <Link to="/search" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            {t("nav.search")}
          </Link>
          {isVendor && (
            <Link to="/post-listing" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              {t("nav.post")}
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Language">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => i18n.changeLanguage("fr")}>Français</DropdownMenuItem>
              <DropdownMenuItem onClick={() => i18n.changeLanguage("rw")}>Kinyarwanda</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isAuthenticated ? (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}>
                {t("nav.signIn")}
              </Button>
              <Button onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}>
                {t("nav.signUp")}
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary font-semibold text-sm">
                    {initials(profile?.full_name)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold">{profile?.full_name}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/saved" })}>
                  <Heart className="mr-2 h-4 w-4" /> {t("nav.saved")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/messages" })}>
                  <MessageCircle className="mr-2 h-4 w-4" /> {t("nav.messages")}
                  {unread > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </DropdownMenuItem>
                {isVendor && (
                  <>
                    <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                      <User className="mr-2 h-4 w-4" /> {t("nav.dashboard")}
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
                <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
