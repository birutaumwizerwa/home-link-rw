import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthFrame } from "@/components/brand/AuthFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Forgot password | HomeLink Rwanda" }, { name: "robots", content: "noindex" }],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!z.string().email().safeParse(email.trim()).success) {
      toast.error(t("auth.invalidEmail"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthFrame>
      {sent ? (
        <div>
          <MailCheck className="h-8 w-8 text-primary" />
          <h1 className="mt-3 text-3xl font-bold">{t("auth.checkEmail")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("auth.resetSentTo", { email: email.trim() })}
          </p>
          <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>
            {t("auth.useAnotherEmail")}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{t("auth.forgotTitle")}</h1>
            <p className="mt-1 text-muted-foreground">{t("auth.forgotBody")}</p>
          </div>
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {t("auth.sendResetLink")}
          </Button>
        </form>
      )}
      <Link
        to="/auth"
        search={{ mode: "signin" }}
        className="mt-6 text-sm font-medium text-primary hover:underline"
      >
        {t("auth.backToSignIn")}
      </Link>
    </AuthFrame>
  );
}
