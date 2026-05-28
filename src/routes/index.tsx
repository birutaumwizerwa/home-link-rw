import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchListings } from "@/lib/listings-query";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeLink Rwanda — Rentals & properties for sale" },
      { name: "description", content: "Browse verified rentals and properties for sale across all 30 Rwandan districts." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const featured = useQuery({ queryKey: ["listings", "featured"], queryFn: () => fetchListings({ featured: true, limit: 4 }) });
  const latest = useQuery({ queryKey: ["listings", "latest"], queryFn: () => fetchListings({ limit: 8 }) });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q } as never });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">{t("home.heroTitle")}</h1>
            <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">{t("home.heroSubtitle")}</p>
            <form onSubmit={submitSearch} className="mt-8 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-card-hover sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("home.searchPlaceholder")}
                  className="border-0 bg-transparent pl-9 text-foreground focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-xl">{t("home.searchBtn")}</Button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { l: t("home.filterRent"), s: { type: "rent" } },
                { l: t("home.filterSale"), s: { type: "sale" } },
                { l: "Apartments", s: { property: "apartment" } },
                { l: "Houses", s: { property: "house" } },
                { l: "Studios", s: { property: "studio" } },
              ].map((c) => (
                <Link key={c.l} to="/search" search={c.s as never} className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium hover:bg-white/25">
                  {c.l}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6">
        <section className="mb-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-bold">{t("home.featured")}</h2>
            <Link to="/search" className="text-sm font-medium text-primary hover:underline">View all <ArrowRight className="inline h-3 w-3" /></Link>
          </div>
          {featured.isLoading ? <div className="h-64 animate-pulse rounded-xl bg-muted" /> : (
            <ListingGrid listings={featured.data ?? []} empty="No featured listings yet." />
          )}
        </section>

        <section className="mb-12">
          <h2 className="mb-5 text-2xl font-bold">{t("home.latest")}</h2>
          {latest.isLoading ? <div className="h-64 animate-pulse rounded-xl bg-muted" /> : (
            <ListingGrid listings={latest.data ?? []} empty="Be the first to post a listing!" />
          )}
        </section>

        <section className="rounded-2xl bg-primary p-8 text-primary-foreground sm:p-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold sm:text-3xl">{t("home.ctaTitle")}</h3>
              <p className="mt-2 max-w-xl text-white/90">{t("home.ctaSubtitle")}</p>
            </div>
            <Button asChild size="lg" variant="secondary" className="rounded-xl">
              <Link to="/auth" search={{ mode: "signup" } as never}>{t("home.ctaBtn")}</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
