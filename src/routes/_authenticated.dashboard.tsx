import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Copy, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ViewingList } from "@/components/booking/ViewingList";
import { BuildingsTab } from "@/components/dashboard/BuildingsTab";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FREE_POST_LIMIT, MOMO_PAYMENT_NUMBER, PLANS, SUPPORT_WHATSAPP } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/format";
import { fetchListings } from "@/lib/listings-query";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: z.object({ tab: z.string().optional() }),
  head: () => ({ meta: [{ title: "Dashboard | HomeLink Rwanda" }] }),
  component: DashboardPage,
});

function BusinessProfile() {
  const { t } = useTranslation();
  const { user, profile, refresh } = useAuth();
  const { data: vendor, refetch } = useQuery({
    queryKey: ["vendor", user?.id, "profile"],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("vendors")
          .select("business_name, whatsapp_number, bio, languages, vendor_type")
          .eq("id", user!.id)
          .maybeSingle()
      ).data,
  });
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    business_name: "",
    whatsapp_number: "",
    bio: "",
    languages: "",
    vendor_type: "individual",
  });
  useEffect(() => {
    setForm({
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      business_name: vendor?.business_name ?? "",
      whatsapp_number: vendor?.whatsapp_number ?? "",
      bio: vendor?.bio ?? "",
      languages: (vendor?.languages ?? []).join(", "),
      vendor_type: vendor?.vendor_type ?? "individual",
    });
  }, [profile, vendor]);
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    const [a, b] = await Promise.all([
      supabase
        .from("profiles")
        .update({ full_name: form.full_name, phone: form.phone || null })
        .eq("id", user!.id),
      supabase
        .from("vendors")
        .update({
          business_name: form.business_name || null,
          whatsapp_number: form.whatsapp_number || null,
          bio: form.bio || null,
          languages: form.languages
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          vendor_type: form.vendor_type,
        })
        .eq("id", user!.id),
    ]);
    if (a.error || b.error) {
      toast.error((a.error ?? b.error)!.message);
      return;
    }
    toast.success(t("form.saved"));
    refetch();
    refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-lg border bg-card p-5">
        <div>
          <Label htmlFor="fn">{t("auth.fullName")}</Label>
          <Input id="fn" value={form.full_name} onChange={set("full_name")} />
        </div>
        <div>
          <Label htmlFor="ph">{t("auth.phone")}</Label>
          <Input id="ph" value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <Label htmlFor="bn">{t("dash.businessName")}</Label>
          <Input id="bn" value={form.business_name} onChange={set("business_name")} />
        </div>
        <div>
          <Label>{t("dash.accountType")}</Label>
          <Select
            value={form.vendor_type}
            onValueChange={(v) => setForm({ ...form, vendor_type: v })}
          >
            <SelectTrigger aria-label={t("dash.accountType")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["individual", "agency", "apartment_operator"].map((x) => (
                <SelectItem key={x} value={x}>
                  {t(`vendor.type.${x}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="wa">{t("dash.whatsapp")}</Label>
          <Input id="wa" value={form.whatsapp_number} onChange={set("whatsapp_number")} />
          <p className="mt-1 text-sm text-muted-foreground">{t("dash.whatsappHint")}</p>
        </div>
        <div>
          <Label htmlFor="lang">{t("dash.languages")}</Label>
          <Input
            id="lang"
            placeholder="Kinyarwanda, English, Français"
            value={form.languages}
            onChange={set("languages")}
          />
        </div>
        <div>
          <Label htmlFor="bio">{t("dash.bio")}</Label>
          <Textarea id="bio" rows={3} maxLength={600} value={form.bio} onChange={set("bio")} />
        </div>
        <Button onClick={save}>{t("form.saveChanges")}</Button>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { tab = "overview" } = Route.useSearch();
  const navigate = useNavigate({ from: "/dashboard" });
  const { user, isVendor } = useAuth();
  const qc = useQueryClient();

  const { data: vendor } = useQuery({
    queryKey: ["vendor", user?.id, "plan"],
    enabled: !!user && isVendor,
    queryFn: async () =>
      (
        await supabase
          .from("vendors")
          .select(
            "is_verified, free_posts_used, subscription_status, subscription_expires_at, whatsapp_number",
          )
          .eq("id", user!.id)
          .maybeSingle()
      ).data,
  });
  const { data: listings, isLoading } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user && isVendor,
    queryFn: () => fetchListings({ vendorId: user!.id, onlyApproved: false }),
  });

  if (!isVendor) {
    return (
      <div className="flex flex-col">
        <main className="mx-auto max-w-xl flex-1 p-8 text-center">
          <h1 className="text-2xl font-bold">{t("post.listTitle")}</h1>
          <Button asChild className="mt-4">
            <Link to="/post-listing">{t("post.becomeVendor")}</Link>
          </Button>
        </main>
      </div>
    );
  }

  const all = listings ?? [];
  const free = vendor?.subscription_status === "free";
  const used = vendor?.free_posts_used ?? 0;

  const toggleAvailable = async (id: string, value: boolean) => {
    const { error } = await supabase.from("listings").update({ is_available: value }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["my-listings"] });
  };
  const remove = async (id: string) => {
    if (!confirm(t("dash.confirmDelete"))) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("dash.deleted"));
    qc.invalidateQueries({ queryKey: ["my-listings"] });
  };

  return (
    <div className="flex flex-col">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">{t("nav.dashboard")}</h1>
          <Button asChild className="sm:hidden">
            <Link to="/post-listing">
              <Plus className="h-4 w-4" /> {t("dash.newListing")}
            </Link>
          </Button>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => navigate({ search: v === "overview" ? {} : { tab: v } })}
          className="mt-6"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start lg:hidden">
            <TabsTrigger value="overview">{t("app.overview")}</TabsTrigger>
            <TabsTrigger value="listings">{t("dash.tabListings")}</TabsTrigger>
            <TabsTrigger value="buildings">{t("dash.tabBuildings")}</TabsTrigger>
            <TabsTrigger value="viewings">{t("dash.tabViewings")}</TabsTrigger>
            <TabsTrigger value="plan">{t("dash.tabPlan")}</TabsTrigger>
            <TabsTrigger value="profile">{t("dash.tabProfile")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              listings={all}
              whatsapp={!!vendor?.whatsapp_number}
              verified={!!vendor?.is_verified}
            />
          </TabsContent>
          <TabsContent value="listings">
            {all.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">
                {t("dash.noListings")}
              </div>
            ) : (
              <ul className="divide-y rounded-lg border bg-card">
                {all.map((l) => (
                  <li key={l.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/listing/$id"
                        params={{ id: l.id }}
                        className="font-semibold hover:text-primary"
                      >
                        {l.title}
                        {l.unit_label ? `, ${l.unit_label}` : ""}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(l.price)},{" "}
                        {l.is_approved ? t("dash.statusApproved") : t("dash.statusReview")},{" "}
                        {t("dash.viewCount", { count: l.views_count ?? 0 })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAvailable(l.id, !l.is_available)}
                      >
                        {l.is_available ? t("dash.markTaken") : t("dash.markVacant")}
                      </Button>
                      <Button asChild size="icon" variant="ghost" aria-label={t("dash.view")}>
                        <Link to="/listing/$id" params={{ id: l.id }}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild size="icon" variant="ghost" aria-label={t("dash.edit")}>
                        <Link to="/edit-listing/$id" params={{ id: l.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild size="icon" variant="ghost" aria-label={t("dash.duplicate")}>
                        <Link to="/post-listing" search={{ duplicate: l.id }}>
                          <Copy className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("common.delete")}
                        onClick={() => remove(l.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="buildings">
            <BuildingsTab listings={all} />
          </TabsContent>
          <TabsContent value="viewings">
            <ViewingList as="vendor" />
          </TabsContent>
          <TabsContent value="plan">
            <div className="rounded-lg border bg-card p-5">
              {free ? (
                <>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-semibold">{t("dash.freePlan")}</span>
                    <span className="text-muted-foreground">
                      {t("dash.postsUsed", { used, total: FREE_POST_LIMIT })}
                    </span>
                  </div>
                  <Progress value={(used / FREE_POST_LIMIT) * 100} />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {Object.entries(PLANS).map(([key, p]) => (
                      <div key={key} className="rounded-lg border p-4">
                        <div className="flex items-baseline justify-between">
                          <h3 className="text-lg font-bold">{p.name}</h3>
                          <span className="font-bold">
                            {formatPrice(p.price_rwf)}
                            <span className="text-sm font-normal text-muted-foreground">
                              {" "}
                              {t("dash.per30")}
                            </span>
                          </span>
                        </div>
                        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                          <li>{key === "basic" ? t("dash.planBasic") : t("dash.planPro")}</li>
                        </ul>
                        <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                          <a
                            href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Activate ${p.name} plan. My vendor ID: ${user?.id}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("dash.activate", { plan: p.name })}
                          </a>
                        </Button>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t("dash.momo", {
                            number: MOMO_PAYMENT_NUMBER,
                            reference: user?.id?.slice(0, 8),
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p>
                  <span className="font-semibold capitalize">{vendor?.subscription_status}</span>
                  {vendor?.subscription_expires_at
                    ? `, ${t("dash.expires", { date: formatDate(vendor.subscription_expires_at, i18n.resolvedLanguage) })}`
                    : ""}
                </p>
              )}
            </div>
            {!vendor?.is_verified && (
              <div className="mt-4 rounded-lg border bg-card p-5">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  <BadgeCheck className="h-5 w-5 text-primary" /> {t("dash.verifyTitle")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("dash.verifyBody")}</p>
                <Button asChild variant="outline" className="mt-3">
                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`I would like to request verification. My vendor ID: ${user?.id}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("dash.verifyCta")}
                  </a>
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="profile">
            <BusinessProfile />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
