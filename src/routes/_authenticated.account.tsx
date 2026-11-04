import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CalendarCheck, Heart, MessageCircle, Search, Video } from "lucide-react";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-unread";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { fetchListings } from "@/lib/listings-query";
import { getRecentlyViewed } from "@/lib/recently-viewed";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My home search | HomeLink Rwanda" }] }),
  component: AccountHome,
});

function AccountHome() {
  const { t, i18n } = useTranslation();
  const { user, profile, isVendor } = useAuth();
  const unread = useUnreadCount();

  const { data: savedDistricts } = useQuery({
    queryKey: ["saved-districts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_listings")
        .select("listing:listings(district)")
        .eq("user_id", user!.id);
      return ((data ?? []) as unknown as { listing: { district: string } | null }[])
        .map((r) => r.listing?.district)
        .filter(Boolean) as string[];
    },
  });
  const { data: viewings } = useQuery({
    queryKey: ["viewings", "next", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("viewing_requests")
        .select(
          "id, preferred_at, mode, status, listing_id, listing:listings(title, district, sector)",
        )
        .eq("client_id", user!.id)
        .in("status", ["pending", "confirmed"])
        .gte("preferred_at", new Date().toISOString())
        .order("preferred_at");
      return (data ?? []) as unknown as {
        id: string;
        preferred_at: string;
        mode: string;
        status: string;
        listing_id: string;
        listing: { title: string; district: string; sector: string | null } | null;
      }[];
    },
  });
  const { data: searches } = useQuery({
    queryKey: ["saved-searches", user?.id],
    queryFn: async () =>
      (
        await supabase
          .from("saved_searches")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(4)
      ).data ?? [],
  });

  const topDistrict = savedDistricts?.length
    ? Object.entries(
        savedDistricts.reduce<Record<string, number>>(
          (m, d) => ({ ...m, [d]: (m[d] ?? 0) + 1 }),
          {},
        ),
      ).sort((a, b) => b[1] - a[1])[0][0]
    : null;
  const { data: suggested, isLoading } = useQuery({
    queryKey: ["suggested", topDistrict],
    enabled: savedDistricts !== undefined,
    queryFn: () =>
      fetchListings({ filters: topDistrict ? { district: topDistrict } : {}, limit: 4 }),
  });
  const recentIds = typeof window === "undefined" ? [] : getRecentlyViewed();
  const { data: recent } = useQuery({
    queryKey: ["recent", recentIds.join()],
    enabled: recentIds.length > 0,
    queryFn: () => fetchListings({ ids: recentIds, limit: 4 }),
  });

  const next = viewings?.[0];
  const first = profile?.full_name?.split(" ")[0];
  const stats = [
    { icon: Heart, label: t("nav.saved"), value: savedDistricts?.length ?? 0, to: "/saved" },
    {
      icon: CalendarCheck,
      label: t("account.upcoming"),
      value: viewings?.length ?? 0,
      to: "/viewings",
    },
    { icon: MessageCircle, label: t("account.unread"), value: unread, to: "/messages" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {first ? t("account.hello", { name: first }) : t("app.overview")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("account.subtitle")}</p>
        </div>
        <Button asChild>
          <Link to="/search">
            <Search className="h-4 w-4" /> {t("nav.search")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="flex items-center gap-3 bg-card p-4 hover:bg-muted"
          >
            <s.icon className="h-5 w-5 text-primary" />
            <span>
              <span className="block font-display text-2xl font-bold">{s.value}</span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </span>
          </Link>
        ))}
      </div>

      {next ? (
        <section className="flex flex-col gap-3 rounded-lg bg-ink p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/70">{t(`viewing.status.${next.status}`)}</p>
            <h2 className="mt-1 text-xl font-bold">{next.listing?.title}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-white/80">
              {next.mode === "video" ? (
                <Video className="h-4 w-4" />
              ) : (
                <CalendarCheck className="h-4 w-4" />
              )}
              {formatDate(next.preferred_at, i18n.resolvedLanguage, true)}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/viewings">{t("account.manageViewings")}</Link>
          </Button>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed bg-card p-5">
          <h2 className="text-lg font-bold">{t("account.noViewingTitle")}</h2>
          <p className="mt-1 text-muted-foreground">{t("account.noViewingBody")}</p>
        </section>
      )}

      {searches && searches.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">{t("saved.searches")}</h2>
          <div className="flex flex-wrap gap-2">
            {searches.map((s) => (
              <Link
                key={s.id}
                to="/search"
                search={s.filters as never}
                className="rounded-md border bg-card px-3 py-2 text-sm font-medium hover:border-primary"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">
          {topDistrict
            ? t("account.suggestedIn", { district: topDistrict })
            : t("account.suggested")}
        </h2>
        {isLoading ? (
          <ListingGridSkeleton count={4} />
        ) : (
          <ListingGrid withSidebar listings={suggested ?? []} empty={t("home.noListings")} />
        )}
      </section>

      {recent && recent.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">{t("account.recent")}</h2>
          <ListingGrid withSidebar listings={recent} empty="" />
        </section>
      )}

      {!isVendor && (
        <section className="flex flex-col gap-3 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("account.ownTitle")}</h2>
            <p className="text-muted-foreground">{t("account.ownBody")}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/post-listing">{t("post.becomeVendor")}</Link>
          </Button>
        </section>
      )}
    </main>
  );
}
