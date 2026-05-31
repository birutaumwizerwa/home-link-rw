import { supabase } from "@/integrations/supabase/client";
import type { ListingCardData } from "@/components/listings/ListingCard";
import type { SearchFilters } from "@/store/app-store";

export const LISTING_CARD_SELECT = `
  id, title, listing_type, property_type, price, price_period, bedrooms, bathrooms, size_sqm,
  district, sector, cover_image_url, views_count, created_at, is_available, is_featured,
  has_kitchen, has_furnished, has_security, has_parking,
  vendor_id,
  vendor:vendors!listings_vendor_id_fkey ( business_name, is_verified, profile:profiles!vendors_id_fkey ( full_name, avatar_url ) )
`;
const SELECT = LISTING_CARD_SELECT;

export async function fetchListings(opts: {
  featured?: boolean;
  limit?: number;
  offset?: number;
  filters?: Partial<SearchFilters>;
  vendorId?: string;
  onlyApproved?: boolean;
}): Promise<ListingCardData[]> {
  let q = supabase.from("listings").select(SELECT).order("created_at", { ascending: false });
  if (opts.onlyApproved !== false && !opts.vendorId) {
    q = q.eq("is_approved", true).eq("is_available", true);
  }
  if (opts.featured) q = q.eq("is_featured", true);
  if (opts.vendorId) q = q.eq("vendor_id", opts.vendorId);
  const f = opts.filters;
  if (f) {
    if (f.q) q = q.ilike("title", `%${f.q}%`);
    if (f.listingType) q = q.eq("listing_type", f.listingType);
    if (f.district) q = q.eq("district", f.district);
    if (f.propertyType) q = q.eq("property_type", f.propertyType as "apartment" | "commercial" | "house" | "room" | "studio" | "villa");
    if (f.minPrice != null) q = q.gte("price", f.minPrice);
    if (f.maxPrice != null) q = q.lte("price", f.maxPrice);
    if (f.bedrooms != null) q = f.bedrooms >= 4 ? q.gte("bedrooms", 4) : q.eq("bedrooms", f.bedrooms);
    if (f.amenities?.length) {
      for (const a of f.amenities) q = q.eq(a, true);
    }
  }
  if (opts.offset != null) q = q.range(opts.offset, opts.offset + (opts.limit ?? 20) - 1);
  else if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ListingCardData[];
}
