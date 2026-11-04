import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BookmarkPlus, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { LocationSearch } from "@/components/location/LocationSearch";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AMENITIES, BEDROOM_OPTIONS, PROPERTY_TYPES } from "@/lib/constants";
import { fetchListings, PAGE_SIZE } from "@/lib/listings-query";
import { districtsOf, PROVINCES, sectorsOf } from "@/lib/rwanda-locations";
import { EMPTY_FILTERS, type SearchFilters } from "@/store/app-store";
import type { Json } from "@/integrations/supabase/types";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["rent", "sale"]).optional(),
  property: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  beds: z.coerce.number().optional(),
  amenities: z.string().optional(),
  stay: z.enum(["short", "medium", "long"]).optional(),
  by: z.string().optional(),
  verified: z.boolean().optional(),
  utilities: z.boolean().optional(),
  english: z.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
});
type Params = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Homes for rent and sale in Rwanda | HomeLink Rwanda" },
      {
        name: "description",
        content:
          "Search apartments, houses and furnished rentals across all 30 districts of Rwanda by stay length, price and amenities.",
      },
    ],
  }),
  component: SearchPage,
});

function toFilters(p: Params): SearchFilters {
  return {
    ...EMPTY_FILTERS,
    q: p.q ?? "",
    listingType: p.type ?? null,
    propertyType: p.property ?? null,
    province: p.province ?? null,
    district: p.district ?? null,
    sector: p.sector ?? null,
    minPrice: p.min ?? null,
    maxPrice: p.max ?? null,
    bedrooms: p.beds ?? null,
    amenities: p.amenities ? p.amenities.split(",") : [],
    stay: p.stay ?? null,
    availableBy: p.by ?? null,
    verifiedOnly: !!p.verified,
    utilitiesIncluded: !!p.utilities,
    englishLease: !!p.english,
    sort: p.sort ?? "newest",
  };
}

function FilterSelect({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  allLabel: string;
  options: { value: string; label: string }[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Select value={value ?? "all"} onValueChange={(v) => onChange(v === "all" ? undefined : v)}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterPanel({
  params,
  update,
  onClear,
}: {
  params: Params;
  update: (p: Partial<Params>) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const amenities = params.amenities ? params.amenities.split(",") : [];
  const toggleAmenity = (k: string) => {
    const next = amenities.includes(k) ? amenities.filter((a) => a !== k) : [...amenities, k];
    update({ amenities: next.length ? next.join(",") : undefined });
  };
  const [min, setMin] = useState(params.min?.toString() ?? "");
  const [max, setMax] = useState(params.max?.toString() ?? "");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {(["rent", "sale"] as const).map((v) => (
          <Button
            key={v}
            type="button"
            size="sm"
            aria-pressed={params.type === v}
            variant={params.type === v ? "default" : "outline"}
            onClick={() => update({ type: params.type === v ? undefined : v })}
          >
            {v === "rent" ? t("home.filterRent") : t("home.filterSale")}
          </Button>
        ))}
      </div>

      <div>
        <Label className="mb-1.5 block">{t("search.stay")}</Label>
        <Select
          value={params.stay ?? "any"}
          onValueChange={(v) => update({ stay: v === "any" ? undefined : (v as Params["stay"]) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("search.anyStay")}</SelectItem>
            {(["short", "medium", "long"] as const).map((s) => (
              <SelectItem key={s} value={s}>
                {t(`home.stay.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="by" className="mb-1.5 block">
          {t("search.moveInBy")}
        </Label>
        <Input
          id="by"
          type="date"
          value={params.by ?? ""}
          onChange={(e) => update({ by: e.target.value || undefined })}
        />
      </div>

      <FilterSelect
        label={t("location.province")}
        value={params.province}
        allLabel={t("location.allProvinces")}
        options={PROVINCES.map((p) => ({ value: p.id, label: t(`location.provinces.${p.id}`) }))}
        onChange={(v) => update({ province: v, district: undefined, sector: undefined })}
      />
      <FilterSelect
        label={t("search.district")}
        value={params.district}
        allLabel={t("search.allDistricts")}
        options={districtsOf(params.province).map((d) => ({ value: d, label: d }))}
        onChange={(v) => update({ district: v, sector: undefined })}
      />
      {params.district && (
        <FilterSelect
          label={t("form.sector")}
          value={params.sector}
          allLabel={t("location.allSectors")}
          options={sectorsOf(params.district).map((s) => ({ value: s, label: s }))}
          onChange={(v) => update({ sector: v })}
        />
      )}

      <div>
        <Label className="mb-1.5 block">{t("search.type")}</Label>
        <Select
          value={params.property ?? "all"}
          onValueChange={(v) => update({ property: v === "all" ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("search.allTypes")}</SelectItem>
            {PROPERTY_TYPES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {t(`property.${p.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="min" className="mb-1.5 block">
            {t("search.minPrice")}
          </Label>
          <Input
            id="min"
            type="number"
            min={0}
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={() => update({ min: min ? Number(min) : undefined })}
          />
        </div>
        <div>
          <Label htmlFor="max" className="mb-1.5 block">
            {t("search.maxPrice")}
          </Label>
          <Input
            id="max"
            type="number"
            min={0}
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={() => update({ max: max ? Number(max) : undefined })}
          />
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block">{t("search.bedrooms")}</Label>
        <div className="flex flex-wrap gap-1.5">
          {BEDROOM_OPTIONS.map((b) => (
            <button
              key={b.value}
              type="button"
              aria-pressed={params.beds === b.value}
              onClick={() => update({ beds: params.beds === b.value ? undefined : b.value })}
              className={`min-w-10 rounded-md border px-3 py-1.5 text-sm ${params.beds === b.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
            >
              {b.value === 0 ? t("card.studio") : b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="block">{t("search.trust")}</Label>
        {(
          [
            ["verified", t("search.verifiedOnly")],
            ["utilities", t("listing.utilitiesIncluded")],
            ["english", t("listing.englishLease")],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!params[key]}
              onCheckedChange={(c) => update({ [key]: c ? true : undefined })}
            />{" "}
            {label}
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="block">{t("search.amenities")}</Label>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {AMENITIES.map((a) => (
            <label key={a.key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={amenities.includes(a.key)}
                onCheckedChange={() => toggleAmenity(a.key)}
              />{" "}
              {t(`amenity.${a.key}`)}
            </label>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setMin("");
          setMax("");
          onClear();
        }}
      >
        <X className="h-4 w-4" /> {t("search.clearFilters")}
      </Button>
    </div>
  );
}

function SearchPage() {
  const { t } = useTranslation();
  const params = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState(params.q ?? "");

  const update = (patch: Partial<Params>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.q ?? "") !== text) update({ q: text || undefined });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const filters = useMemo(() => toFilters(params), [params]);
  const query = useInfiniteQuery({
    queryKey: ["listings", "search", filters],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchListings({ filters, limit: PAGE_SIZE, offset: pageParam }),
    getNextPageParam: (last, pages) =>
      last.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
  });
  const listings = query.data?.pages.flat() ?? [];

  const saveSearch = async () => {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "signup" } });
      return;
    }
    const name =
      [params.q, params.sector, params.district, params.stay && t(`home.stay.${params.stay}`)]
        .filter(Boolean)
        .join(", ") || t("search.allHomes");
    const { error } = await supabase
      .from("saved_searches")
      .insert({ user_id: user.id, name, filters: params as unknown as Json });
    if (error) {
      toast.error(t("search.saveFailed"));
      return;
    }
    toast.success(t("search.searchSaved"));
    qc.invalidateQueries({ queryKey: ["saved-searches"] });
  };

  const clear = () => {
    setText("");
    navigate({ search: {}, replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-5 text-3xl font-bold">{t("search.title")}</h1>
        <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
          <aside className="hidden h-fit rounded-lg border bg-card p-5 lg:block">
            <FilterPanel params={params} update={update} onClear={clear} />
          </aside>
          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <LocationSearch
                value={text}
                onChange={setText}
                onPick={(p) => {
                  setText("");
                  update({
                    q: undefined,
                    province: undefined,
                    district: p.district,
                    sector: p.sector,
                  });
                }}
              />
              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex-1 lg:hidden">
                      <SlidersHorizontal className="h-4 w-4" /> {t("search.filters")}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>{t("search.filters")}</SheetTitle>
                    </SheetHeader>
                    <div className="p-4">
                      <FilterPanel params={params} update={update} onClear={clear} />
                    </div>
                  </SheetContent>
                </Sheet>
                <Select
                  value={params.sort ?? "newest"}
                  onValueChange={(v) =>
                    update({ sort: v === "newest" ? undefined : (v as Params["sort"]) })
                  }
                >
                  <SelectTrigger className="h-10 w-44" aria-label={t("search.sort")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("search.sortNewest")}</SelectItem>
                    <SelectItem value="price_asc">{t("search.sortLow")}</SelectItem>
                    <SelectItem value="price_desc">{t("search.sortHigh")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {query.isLoading
                  ? t("search.searching")
                  : t("search.results", { count: listings.length })}
              </p>
              <Button variant="ghost" size="sm" onClick={saveSearch}>
                <BookmarkPlus className="h-4 w-4" /> {t("search.saveSearch")}
              </Button>
            </div>
            {query.isError ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="font-semibold">{t("search.errorTitle")}</p>
                <Button variant="outline" className="mt-3" onClick={() => query.refetch()}>
                  {t("common.tryAgain")}
                </Button>
              </div>
            ) : query.isLoading ? (
              <ListingGridSkeleton count={6} />
            ) : (
              <ListingGrid
                withSidebar
                listings={listings}
                empty={
                  <>
                    {t("search.noResults")}{" "}
                    <Link
                      to="/search"
                      search={{}}
                      onClick={clear}
                      className="font-medium text-primary underline"
                    >
                      {t("search.clearFilters")}
                    </Link>
                  </>
                }
              />
            )}
            {query.hasNextPage && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                >
                  {t("search.loadMore")}
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
