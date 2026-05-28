import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [loading, isAuthenticated, navigate]);
  if (loading || !isAuthenticated) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  return <Outlet />;
}
