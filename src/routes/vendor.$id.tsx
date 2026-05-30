import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, MessageSquare } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchListings } from "@/lib/listings-query";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/vendor/$id")({
  head: () => ({ meta: [{ title: "Vendor profile — HomeLink Rwanda" }] }),
  component: VendorProfile,
});

function VendorProfile() {
  const { id } = Route.useParams();

  const { data: vendor } = useQuery({
    queryKey: ["vendor-profile", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors")
        .select(`*, profile:profiles!vendors_id_fkey(full_name, avatar_url, created_at)`)
        .eq("id", id)
        .maybeSingle();
      return data as { business_name: string | null; whatsapp_number: string | null; is_verified: boolean; profile: { full_name: string; created_at: string } | null } | null;
    },
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["vendor-listings", id],
    queryFn: () => fetchListings({ vendorId: id }),
  });

  const name = vendor?.business_name || vendor?.profile?.full_name || "Vendor";

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-col items-start gap-5 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-2xl font-semibold text-primary">
            {initials(name)}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{name}</h1>
              {vendor?.is_verified && (
                <Badge className="gap-1"><Check className="h-3 w-3" /> Verified vendor</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since {vendor?.profile?.created_at ? new Date(vendor.profile.created_at).getFullYear() : "—"}
            </p>
            <p className="text-sm text-muted-foreground">{listings?.length ?? 0} active listings</p>
          </div>
          {vendor?.whatsapp_number && (
            <Button asChild>
              <a href={`https://wa.me/${vendor.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          )}
        </div>

        <h2 className="mb-5 mt-10 text-xl font-bold">All listings by {name}</h2>
        {isLoading ? <ListingGridSkeleton count={4} /> : <ListingGrid listings={listings ?? []} empty="No active listings yet." />}
      </main>
      <Footer />
    </div>
  );
}
