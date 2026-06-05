import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Home, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { DISTRICTS } from "@/lib/constants";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — HomeLink Rwanda" }] }),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Name too short").max(100),
  phone: z.string().trim().min(7).max(20),
  location: z.string().min(1, "Pick a district"),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  is_vendor: z.boolean(),
});
const signinSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

// Email Verification Modal Component
function EmailVerificationModal({ isOpen, onClose, email }: { isOpen: boolean; onClose: () => void; email: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
          <p className="text-muted-foreground mb-3">
            We sent a verification link to:
          </p>
          <p className="font-medium text-primary mb-6">{email}</p>
          <p className="text-sm text-muted-foreground">
                Click the link in your email to confirm your account.
                After verification, you can sign in.
          </p>
          <Button onClick={onClose} className="w-full mt-6">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuthPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Home className="h-4 w-4" /></span>
            HomeLink <span className="text-primary">Rwanda</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold">{mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Welcome back to HomeLink Rwanda." : "Find or list properties across Rwanda."}</p>

          <Button variant="outline" className="mt-6 w-full" onClick={async () => {
            const r = await supabase.auth.signInWithOAuth({ 
              provider: 'google',
              options: { redirectTo: window.location.origin }
            });
            if (r.error) toast.error(r.error.message);
          }}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-0.8 3-3.3 5-7.3 5-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C34.7 5.9 29.7 3 24 3 12.9 3 4 12 4 23s8.9 20 20 20 20-8.9 20-20c0-1.7-0.2-3.4-0.4-5z" />
              <path fill="#FF3D00" d="M6.3 14.6l6.8 5c1.6-2.9 4.1-5.1 8-5.1 3.5 0 6.7 1.5 8.8 4.1l6.4-6.4C34.2 8.7 29.5 6 24 6c-6.5 0-12.2 3.2-15.6 8.1z" />
              <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.2 14.2-6.1l-6.5-5.5c-2 1.4-4.6 2.3-7.7 2.3-4.4 0-8.2-2.5-10-6.5l-6.8 5.2C11.8 39.7 17.5 44 24 44z" />
              <path fill="#1976D2" d="M44 24c0-1.1-0.1-2.2-0.3-3.3H24v8h11.3c-0.5 2.1-1.7 3.9-3.3 5.2l6.5 5.5C42.1 36.7 44 30.7 44 24z" />
            </svg>
            {t("auth.withGoogle")}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          {mode === "signin" ? <SignInForm /> : <SignUpForm />}

          <button type="button" className="mt-6 w-full text-center text-sm text-primary hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? t("auth.switchToSignUp") : t("auth.switchToSignIn")}
          </button>
        </div>
      </main>
    </div>
  );
}

function SignInForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof signinSchema>>({ resolver: zodResolver(signinSchema), defaultValues: { email: "", password: "" } });

  const submit = async (v: z.infer<typeof signinSchema>) => {
    const { error } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
    if (error) { toast.error(error.message); return; }

    const uid = (await supabase.auth.getUser()).data.user?.id;
    let roles: string[] = [];
    if (uid) {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      roles = (data ?? []).map((r) => r.role as string);
    }

    toast.success("Welcome back!");
    if (roles.includes("admin")) navigate({ to: "/admin" });
    else if (roles.includes("vendor")) navigate({ to: "/dashboard" });
    else navigate({ to: "/" });
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div>
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email && <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{t("auth.submitSignIn")}</Button>
    </form>
  );
}

function SignUpForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", phone: "", location: "", email: "", password: "", is_vendor: false },
  });

  const submit = async (v: z.infer<typeof signupSchema>) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: v.email,
        password: v.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { full_name: v.full_name, phone: v.phone, location: v.location, is_vendor: v.is_vendor ? "true" : "false" },
        },
      });
      
      if (authError) {
        toast.error(authError.message);
        return;
      }

      const userId = authData.user?.id;
      
      // Show verification modal
      setRegisteredEmail(v.email);
      setShowVerificationModal(true);
      
      // Create profile and roles in background (don't block UI)
      if (userId) {
        await supabase.from("profiles").upsert({
          id: userId,
          full_name: v.full_name,
          phone: v.phone,
          location: v.location,
          avatar_url: null,
          is_banned: false,
        });
        
        await supabase.from("user_roles").delete().eq("user_id", userId);
        
        const role = v.is_vendor ? "vendor" : "client";
        await supabase.from("user_roles").insert({ user_id: userId, role: role });
        
        if (v.is_vendor) {
          await supabase.from("vendors").upsert({
            id: userId,
            business_name: null,
            whatsapp_number: null,
            is_verified: false,
            subscription_status: "free",
            free_posts_used: 0,
          });
        }
      }
      
      // Clear form
      form.reset();
      
    } catch (err) {
      console.error("Signup error:", err);
      setRegisteredEmail(v.email);
      setShowVerificationModal(true);
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <div>
          <Label htmlFor="full_name">{t("auth.fullName")}</Label>
          <Input id="full_name" {...form.register("full_name")} />
          {form.formState.errors.full_name && <p className="mt-1 text-xs text-destructive">{form.formState.errors.full_name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <Input id="phone" type="tel" placeholder="07XXXXXXXX" {...form.register("phone")} />
          </div>
          <div>
            <Label>{t("auth.location")}</Label>
            <Select value={form.watch("location")} onValueChange={(v) => form.setValue("location", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
          {form.formState.errors.password && <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>}
        </div>
        <div>
          <Label className="mb-2 block">I am a...</Label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => form.setValue("is_vendor", false)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition ${
                !form.watch("is_vendor")
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              }`}>
              <span className="text-2xl">🏠</span>
              <span className="text-sm font-semibold">Looking for a home</span>
              <span className="text-xs text-muted-foreground">Browse, save and contact landlords</span>
            </button>
            <button type="button" onClick={() => form.setValue("is_vendor", true)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition ${
                form.watch("is_vendor")
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              }`}>
              <span className="text-2xl">🏢</span>
              <span className="text-sm font-semibold">Landlord / Broker</span>
              <span className="text-xs text-muted-foreground">Post listings and find tenants</span>
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{t("auth.submitSignUp")}</Button>
      </form>
      
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={registeredEmail}
      />
    </>
  );
}