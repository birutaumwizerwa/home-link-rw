// ADMIN CREDENTIALS (platform owner)
// Email: umwizerwaedvin@gmail.com
// Password: Edvin@12345
// The admin role is granted automatically on signup via a database trigger.
// If needed manually, run in the backend SQL editor:
// UPDATE user_roles SET role = 'admin'
// WHERE user_id = (SELECT id FROM auth.users WHERE email = 'umwizerwaedvin@gmail.com');

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DISTRICTS } from "@/lib/constants";
import { initials } from "@/lib/format";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Edit profile — HomeLink Rwanda" }] }),
  component: ProfilePage,
});

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  business_name: z.string().max(100).optional().or(z.literal("")),
  whatsapp_number: z.string().max(20).optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

function ProfilePage() {
  const { t } = useTranslation();
  const { user, isVendor } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, location, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: vendor, refetch: refetchVendor } = useQuery({
    queryKey: ["vendor-profile-edit", user?.id],
    enabled: !!user && isVendor,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors")
        .select("business_name, whatsapp_number")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      location: profile?.location ?? "",
      business_name: vendor?.business_name ?? "",
      whatsapp_number: vendor?.whatsapp_number ?? "",
    },
  });

  const saveProfile = useMutation({
    mutationFn: async (v: ProfileForm) => {
      await supabase.from("profiles").update({
        full_name: v.full_name,
        phone: v.phone || null,
        location: v.location || null,
      }).eq("id", user!.id);
      if (isVendor) {
        await supabase.from("vendors").update({
          business_name: v.business_name || null,
          whatsapp_number: v.whatsapp_number || null,
        }).eq("id", user!.id);
      }
    },
    onSuccess: () => {
      toast.success(t("profile.saved"));
      refetch();
      refetchVendor();
      qc.invalidateQueries({ queryKey: ["vendor", user?.id] });
      qc.invalidateQueries({ queryKey: ["nav-avatar", user?.id] });
    },
    onError: () => toast.error("Failed to update profile. Please try again."),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be smaller than 3MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      toast.success("Profile photo updated");
      refetch();
      qc.invalidateQueries({ queryKey: ["nav-avatar", user.id] });
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    toast.success("Profile photo removed");
    refetch();
    qc.invalidateQueries({ queryKey: ["nav-avatar", user.id] });
  };

  const name = profile?.full_name || user?.email || "User";

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">{t("profile.title")}</h1>

        {/* Avatar */}
        <div className="mb-6 flex items-center gap-4 rounded-2xl border bg-card p-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
              <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">{initials(name)}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-60"
              aria-label={t("profile.changePhoto")}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {profile?.avatar_url && (
              <button type="button" onClick={removeAvatar} className="mt-1 text-xs text-destructive hover:underline">
                {t("profile.removePhoto")}
              </button>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{t("profile.avatarHint")}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit((v) => saveProfile.mutate(v))} className="space-y-5 rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">{t("profile.personalInfo")}</h2>

          <div>
            <Label>{t("profile.fullName")} *</Label>
            <Input className="mt-1.5" {...form.register("full_name")} />
            {form.formState.errors.full_name && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.full_name.message}</p>
            )}
          </div>

          <div>
            <Label>{t("profile.phone")}</Label>
            <Input className="mt-1.5" {...form.register("phone")} placeholder="07XXXXXXXX" />
          </div>

          <div>
            <Label>{t("profile.district")}</Label>
            <Select value={form.watch("location") || undefined} onValueChange={(v) => form.setValue("location", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select district" /></SelectTrigger>
              <SelectContent>
                {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("profile.email")}</Label>
            <Input className="mt-1.5" value={user?.email ?? ""} disabled />
            <p className="mt-1 text-xs text-muted-foreground">{t("profile.emailReadOnly")}</p>
          </div>

          {isVendor && (
            <>
              <Separator />
              <h2 className="text-lg font-semibold">{t("profile.vendorInfo")}</h2>
              <div>
                <Label>{t("profile.businessName")}</Label>
                <Input className="mt-1.5" {...form.register("business_name")} />
              </div>
              <div>
                <Label>{t("profile.whatsappNumber")} *</Label>
                <Input className="mt-1.5" {...form.register("whatsapp_number")} placeholder="07XXXXXXXX" />
                <p className="mt-1 text-xs text-muted-foreground">{t("profile.whatsappHint")}</p>
              </div>
            </>
          )}

          <Button type="submit" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? t("profile.saving") : t("profile.saveBtn")}
          </Button>
        </form>

        {/* Password */}
        <div className="mt-6 rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">{t("profile.passwordTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("profile.passwordDesc")}</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={async () => {
              if (!user?.email) return;
              await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/auth?mode=reset`,
              });
              toast.success("Password reset link sent to " + user.email);
            }}
          >
            {t("profile.sendReset")}
          </Button>
        </div>

        {/* Danger zone */}
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">{t("profile.dangerZone")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("profile.deleteDesc")}</p>
          <Button
            variant="destructive"
            className="mt-3"
            onClick={() => {
              const confirmed = window.confirm("Are you sure you want to delete your account? This cannot be undone.");
              if (confirmed) toast.error("Account deletion — contact support@homelink.rw to proceed.");
            }}
          >
            {t("profile.deleteBtn")}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
