import { useEffect, useRef } from "react";
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { t } = useTranslation();
  const { loading, isAuthenticated, profile, signOut } = useAuth();
  const navigate = useNavigate();
  // The page the visitor asked for, kept steady while the redirect runs.
  const requested = useRef(useLocation().href);

  useEffect(() => {
    if (!loading && !isAuthenticated)
      navigate({ to: "/auth", search: { mode: "signin", next: requested.current } });
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated)
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        {t("common.loading")}
      </div>
    );

  if (profile?.is_banned)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">{t("auth.suspendedTitle")}</h1>
          <p className="mt-2 max-w-md text-muted-foreground">{t("auth.suspendedBody")}</p>
          <Button variant="outline" className="mt-4" onClick={() => signOut()}>
            {t("nav.signOut")}
          </Button>
        </div>
      </div>
    );

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
