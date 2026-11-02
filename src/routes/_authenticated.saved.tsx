import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ListingGrid } from "@/components/listings/ListingGrid";
import type { ListingCardData } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LISTING_CARD_SELECT } from "@/lib/listings-query";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({ meta: [{ title: "Saved | HomeLink Rwanda" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["saved-listings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_listings")
        .select(`listing:listings(${LISTING_CARD_SELECT})`)
        .eq("user_id", user!.id);
      return ((data ?? []) as unknown as { listing: ListingCardData | null }[])
        .map((r) => r.listing)
        .filter(Boolean) as ListingCardData[];
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
      ).data ?? [],
  });
  const removeSearch = async (id: string) => {
    await supabase.from("saved_searches").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["saved-searches"] });
  };

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">{t("nav.saved")}</h1>
        {searches && searches.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-bold">{t("saved.searches")}</h2>
            <ul className="flex flex-wrap gap-2">
              {searches.map((s) => (
                <li key={s.id} className="flex items-center rounded-md border bg-card">
                  <Link
                    to="/search"
                    search={s.filters as never}
                    className="px-3 py-2 text-sm font-medium hover:text-primary"
                  >
                    {s.name}
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t("common.delete")}
                    onClick={() => removeSearch(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <h2 className="mb-3 text-xl font-bold">{t("saved.homes")}</h2>
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        ) : (
          <ListingGrid listings={data ?? []} empty={t("saved.empty")} />
        )}
      </main>
      <Footer />
    </div>
  );
}
