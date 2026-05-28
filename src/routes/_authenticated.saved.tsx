import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { ListingCardData } from "@/components/listings/ListingCard";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({ meta: [{ title: "Saved listings" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["saved-listings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_listings")
        .select(`listing:listings(
          id, title, listing_type, property_type, price, price_period, bedrooms, bathrooms, size_sqm,
          district, sector, cover_image_url, has_kitchen, has_furnished, has_security, has_parking,
          vendor_id, vendor:vendors!listings_vendor_id_fkey(business_name, is_verified, profile:profiles!vendors_id_fkey(full_name))
        )`)
        .eq("user_id", user!.id);
      return ((data ?? []).map((r: { listing: ListingCardData }) => r.listing).filter(Boolean)) as ListingCardData[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">Saved listings</h1>
        {isLoading ? <div className="h-64 animate-pulse rounded-xl bg-muted" /> : <ListingGrid listings={data ?? []} empty="Save listings from the heart icon to find them here." />}
      </main>
      <Footer />
    </div>
  );
}
