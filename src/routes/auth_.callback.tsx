import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { homePath, safeNext } from "@/lib/roles";

export const Route = createFileRoute("/auth_/callback")({
  validateSearch: z.object({ next: z.string().optional() }),
  head: () => ({
    meta: [{ title: "Signing you in | HomeLink Rwanda" }, { name: "robots", content: "noindex" }],
  }),
  component: Callback,
});

/** Google sign-in and email confirmation links land here, then go to the right home. */
function Callback() {
  const { next } = Route.useSearch();
  const { user, loading, roles, rolesLoaded } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) {
      const timer = setTimeout(() => navigate({ to: "/auth", search: { mode: "signin" } }), 2500);
      return () => clearTimeout(timer);
    }
    if (rolesLoaded) navigate({ to: safeNext(next) ?? homePath(roles), replace: true });
  }, [loading, user, rolesLoaded, roles, next, navigate]);
  return (
    <div className="grid min-h-screen place-items-center text-muted-foreground">Signing you in</div>
  );
}
