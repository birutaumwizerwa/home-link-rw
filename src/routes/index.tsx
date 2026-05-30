import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchListings } from "@/lib/listings-query";
import heroImg from "@/assets/hero-kigali.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeLink Rwanda — Rentals & properties for sale" },
      { name: "description", content: "Browse verified rentals and properties for sale across all 30 Rwandan districts." },
    ],
  }),
  component: Index,
});

const CATEGORIES = [
  { label: "Houses", value: "house", emoji: "🏠" },
  { label: "Apartments", value: "apartment", emoji: "🏢" },
  { label: "Studios", value: "studio", emoji: "🛏️" },
  { label: "Rooms", value: "room", emoji: "🚪" },
  { label: "Villas", value: "villa", emoji: "🏡" },
  { label: "Commercial", value: "commercial", emoji: "🏪" },
];

const STATS = [
  { n: "500+", label: "Active listings" },
  { n: "30", label: "Districts covered" },
  { n: "1,200+", label: "Registered users" },
  { n: "Free", label: "To join & browse" },
];

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
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />

      <section className="relative overflow-hidden text-primary-foreground">
        <img src={heroImg} alt="Kigali, Rwanda at golden hour" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28 sm:px-6">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">🇷🇼 Rwanda's #1 property platform</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">{t("home.heroTitle")}</h1>
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
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-4 sm:px-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-primary sm:text-3xl">{s.n}</div>
              <div className="text-xs text-muted-foreground sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6">
        {/* Categories */}
        <section className="mb-12">
          <h2 className="mb-5 text-2xl font-bold">Browse by type</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {CATEGORIES.map((c) => (
              <Link key={c.value} to="/search" search={{ property: c.value } as never}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition hover:border-primary hover:shadow-card">
                <span className="text-3xl">{c.emoji}</span>
                <span className="text-sm font-medium">{c.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-bold">{t("home.featured")}</h2>
            <Link to="/search" className="text-sm font-medium text-primary hover:underline">View all <ArrowRight className="inline h-3 w-3" /></Link>
          </div>
          {featured.isLoading ? <ListingGridSkeleton count={4} /> : (
            <ListingGrid listings={featured.data ?? []} empty="No featured listings yet." />
          )}
        </section>

        <section className="mb-12">
          <h2 className="mb-5 text-2xl font-bold">{t("home.latest")}</h2>
          {latest.isLoading ? <ListingGridSkeleton count={8} /> : (
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
