import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ListingForm, type ExistingListing } from "@/components/listings/ListingForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FREE_POST_LIMIT } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/post-listing")({
  validateSearch: z.object({ duplicate: z.string().optional() }),
  head: () => ({ meta: [{ title: "Post a listing | HomeLink Rwanda" }] }),
  component: PostListingPage,
});

function PostListingPage() {
  const { t } = useTranslation();
  const { duplicate } = Route.useSearch();
  const { user, isVendor, refresh } = useAuth();
  const [upgrading, setUpgrading] = useState(false);

  const { data: vendor } = useQuery({
    queryKey: ["vendor", user?.id],
    enabled: !!user && isVendor,
    queryFn: async () =>
      (
        await supabase
          .from("vendors")
          .select("free_posts_used, subscription_status")
          .eq("id", user!.id)
          .maybeSingle()
      ).data,
  });
  const { data: source, isLoading } = useQuery({
    queryKey: ["listing-copy", duplicate],
    enabled: !!duplicate,
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("*, images:listing_images(image_url, sort_order)")
        .eq("id", duplicate!)
        .maybeSingle();
      if (!data) return null;
      const {
        views_count: _v,
        is_approved: _a,
        is_featured: _f,
        ...rest
      } = data as Record<string, unknown>;
      return { ...rest, unit_label: "" } as unknown as ExistingListing;
    },
  });

  const becomeVendor = async () => {
    setUpgrading(true);
    const { error } = await supabase.rpc("become_vendor");
    setUpgrading(false);
    if (error) {
      toast.error(t("post.upgradeFailed"));
      return;
    }
    await refresh();
    toast.success(t("post.upgraded"));
  };

  const overLimit =
    vendor?.subscription_status === "free" && (vendor.free_posts_used ?? 0) >= FREE_POST_LIMIT;

  return (
    <div className="flex flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {!isVendor ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <h1 className="text-2xl font-bold">{t("post.listTitle")}</h1>
            <p className="mt-2 text-muted-foreground">
              {t("post.listBody", { count: FREE_POST_LIMIT })}
            </p>
            <Button className="mt-5" size="lg" disabled={upgrading} onClick={becomeVendor}>
              {t("post.becomeVendor")}
            </Button>
          </div>
        ) : (
          <>
            <h1 className="mb-6 text-3xl font-bold">
              {duplicate ? t("post.duplicateTitle") : t("post.title")}
            </h1>
            {overLimit ? (
              <div className="rounded-lg border bg-card p-6">
                <p>{t("post.limit", { count: FREE_POST_LIMIT })}</p>
                <Button asChild className="mt-4">
                  <Link to="/dashboard">{t("post.seePlans")}</Link>
                </Button>
              </div>
            ) : duplicate && isLoading ? (
              <div className="h-96 animate-pulse rounded-lg bg-muted" />
            ) : (
              <ListingForm
                key={source?.id ?? "new"}
                mode={duplicate ? "duplicate" : "create"}
                existing={source ?? undefined}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
