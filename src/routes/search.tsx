import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store/app-store";
import { fetchListings } from "@/lib/listings-query";
import { DISTRICTS, PROPERTY_TYPES, AMENITIES, BEDROOM_OPTIONS } from "@/lib/constants";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["rent", "sale"]).optional(),
  property: z.string().optional(),
  district: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search properties — HomeLink Rwanda" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { t } = useTranslation();
  const params = Route.useSearch();
  const { filters, setFilters, resetFilters } = useAppStore();

  useEffect(() => {
    setFilters({
      q: params.q ?? "",
      listingType: params.type ?? null,
      propertyType: params.property ?? null,
      district: params.district ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["listings", "search", filters],
    queryFn: () => fetchListings({ filters }),
  });

  const toggleAmenity = (k: string) => {
    const has = filters.amenities.includes(k);
    setFilters({ amenities: has ? filters.amenities.filter((a) => a !== k) : [...filters.amenities, k] });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">{t("search.title")}</h1>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-5 rounded-xl border bg-card p-5 h-fit lg:sticky lg:top-20">
            <div>
              <Input placeholder={t("home.searchPlaceholder")} value={filters.q} onChange={(e) => setFilters({ q: e.target.value })} />
            </div>

            <div className="flex gap-2">
              {(["rent", "sale"] as const).map((v) => (
                <Button key={v} type="button" size="sm" variant={filters.listingType === v ? "default" : "outline"} className="flex-1" onClick={() => setFilters({ listingType: filters.listingType === v ? null : v })}>
                  {v === "rent" ? t("home.filterRent") : t("home.filterSale")}
                </Button>
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">{t("search.district")}</label>
              <Select value={filters.district ?? "all"} onValueChange={(v) => setFilters({ district: v === "all" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="All districts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All districts</SelectItem>
                  {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">{t("search.type")}</label>
              <Select value={filters.propertyType ?? "all"} onValueChange={(v) => setFilters({ propertyType: v === "all" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {PROPERTY_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium">{t("search.minPrice")}</label>
                <Input type="number" value={filters.minPrice ?? ""} onChange={(e) => setFilters({ minPrice: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">{t("search.maxPrice")}</label>
                <Input type="number" value={filters.maxPrice ?? ""} onChange={(e) => setFilters({ maxPrice: e.target.value ? Number(e.target.value) : null })} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">{t("search.bedrooms")}</label>
              <div className="flex flex-wrap gap-1.5">
                {BEDROOM_OPTIONS.map((b) => (
                  <button key={b.value} type="button" onClick={() => setFilters({ bedrooms: filters.bedrooms === b.value ? null : b.value })}
                    className={`rounded-md border px-3 py-1 text-xs ${filters.bedrooms === b.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium">{t("search.amenities")}</label>
              <div className="space-y-2">
                {AMENITIES.map((a) => (
                  <label key={a.key} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={filters.amenities.includes(a.key)} onCheckedChange={() => toggleAmenity(a.key)} />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={resetFilters}>{t("search.clearFilters")}</Button>
          </aside>

          <section>
            <p className="mb-4 text-sm text-muted-foreground">{t("search.results", { count: data?.length ?? 0 })}</p>
            {isLoading ? <div className="h-64 animate-pulse rounded-xl bg-muted" /> : (
              <ListingGrid listings={data ?? []} empty={t("search.noResults")} />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
