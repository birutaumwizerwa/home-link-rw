import { supabase } from "@/integrations/supabase/client";
import type { ListingCardData } from "@/components/listings/ListingCard";
import { STAY_OPTIONS } from "@/lib/constants";
import type { SearchFilters } from "@/store/app-store";

export const LISTING_CARD_SELECT = `
  id, title, listing_type, property_type, price, price_period, bedrooms, bathrooms, size_sqm,
  district, sector, cover_image_url, views_count, created_at, is_available, is_approved, is_featured,
  has_kitchen, has_furnished, has_security, has_parking, has_wifi,
  min_stay_months, available_from, utilities_included, building_id, unit_label,
  vendor_id,
  vendor:vendors!listings_vendor_id_fkey!inner ( business_name, is_verified, profile:profiles!vendors_id_fkey ( full_name, avatar_url ) )
`;

export const PAGE_SIZE = 24;

/** Keeps user text from breaking out of a PostgREST or() filter. */
function safeTerm(value: string) {
  return value.replace(/[%_,()*\\"]/g, " ").trim();
}

export async function fetchListings(opts: {
  featured?: boolean;
  limit?: number;
  offset?: number;
  filters?: Partial<SearchFilters>;
  vendorId?: string;
  buildingId?: string;
  ids?: string[];
  onlyApproved?: boolean;
}): Promise<ListingCardData[]> {
  const f = opts.filters;
  const sort = f?.sort ?? "newest";
  let q = supabase
    .from("listings")
    .select(LISTING_CARD_SELECT)
    .order(sort === "newest" ? "created_at" : "price", { ascending: sort === "price_asc" });

  if (opts.onlyApproved !== false) q = q.eq("is_approved", true).eq("is_available", true);
  if (opts.featured) q = q.eq("is_featured", true);
  if (opts.vendorId) q = q.eq("vendor_id", opts.vendorId);
  if (opts.buildingId) q = q.eq("building_id", opts.buildingId);
  if (opts.ids) q = q.in("id", opts.ids);

  if (f) {
    const term = f.q ? safeTerm(f.q) : "";
    if (term) {
      const like = `*${term}*`;
      q = q.or(
        `title.ilike.${like},district.ilike.${like},sector.ilike.${like},cell.ilike.${like},description.ilike.${like}`,
      );
    }
    if (f.listingType) q = q.eq("listing_type", f.listingType);
    if (f.district) q = q.eq("district", f.district);
    if (f.propertyType)
      q = q.eq(
        "property_type",
        f.propertyType as "apartment" | "commercial" | "house" | "room" | "studio" | "villa",
      );
    if (f.minPrice != null) q = q.gte("price", f.minPrice);
    if (f.maxPrice != null) q = q.lte("price", f.maxPrice);
    if (f.bedrooms != null)
      q = f.bedrooms >= 4 ? q.gte("bedrooms", 4) : q.eq("bedrooms", f.bedrooms);
    for (const a of f.amenities ?? []) q = q.eq(a, true);
    if (f.stay) {
      q = q.eq("listing_type", "rent");
      const limit = STAY_OPTIONS.find((s) => s.value === f.stay)?.maxMinStay;
      if (limit) q = q.or(`min_stay_months.is.null,min_stay_months.lte.${limit}`);
    }
    if (f.availableBy) q = q.or(`available_from.is.null,available_from.lte.${f.availableBy}`);
    if (f.verifiedOnly) q = q.eq("vendor.is_verified", true);
    if (f.utilitiesIncluded) q = q.eq("utilities_included", true);
    if (f.englishLease) q = q.eq("english_lease", true);
  }

  if (opts.offset != null) q = q.range(opts.offset, opts.offset + (opts.limit ?? PAGE_SIZE) - 1);
  else if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ListingCardData[];
}
