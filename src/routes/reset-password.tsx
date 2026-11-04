import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AuthFrame } from "@/components/brand/AuthFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { homePath } from "@/lib/roles";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password | HomeLink Rwanda" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function strength(p: string) {
  return [
    p.length >= 8,
    p.length >= 12,
    /[A-Z]/.test(p) && /[a-z]/.test(p),
    /\d|[^A-Za-z]/.test(p),
  ].filter(Boolean).length;
}

function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, roles } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const score = strength(password);
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("auth.passwordUpdated"));
    navigate({ to: homePath(roles) });
  };

  return (
    <AuthFrame>
      {!loading && !user ? (
        <div>
          <h1 className="text-3xl font-bold">{t("auth.linkExpiredTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("auth.resetLinkInvalid")}</p>
          <Button asChild className="mt-5">
            <Link to="/forgot-password">{t("auth.sendResetLink")}</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <h1 className="text-3xl font-bold">{t("auth.newPasswordTitle")}</h1>
          <div>
            <Label htmlFor="password">{t("auth.newPassword")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              className="h-11"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="mt-2 grid grid-cols-4 gap-1" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={`h-1 rounded-full ${score >= n ? "bg-primary" : "bg-border"}`}
                />
              ))}
            </div>
            {password && (
              <p className="mt-1 text-sm text-muted-foreground">{t(`auth.strength${score}`)}</p>
            )}
          </div>
          <div>
            <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              className="h-11"
              required
              aria-invalid={mismatch}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {mismatch && (
              <p className="mt-1 text-sm text-destructive">{t("auth.passwordMismatch")}</p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={busy || password.length < 8 || password !== confirm}
          >
            {t("auth.savePassword")}
          </Button>
        </form>
      )}
    </AuthFrame>
  );
}
