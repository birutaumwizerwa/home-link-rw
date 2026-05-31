import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, MessageCircle, BedDouble, Bath, Ruler, MapPin, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice, formatPricePeriod, initials } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ListingCardData = {
  id: string;
  title: string;
  listing_type: "rent" | "sale";
  property_type: string;
  price: number;
  price_period: "monthly" | "yearly" | "fixed";
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  district: string;
  sector: string | null;
  cover_image_url: string | null;
  has_kitchen: boolean;
  has_furnished: boolean;
  has_security: boolean;
  has_parking: boolean;
  views_count?: number;
  created_at?: string;
  is_featured?: boolean;
  vendor_id: string;
  vendor?: {
    business_name: string | null;
    is_verified: boolean;
    profile?: { full_name: string; avatar_url?: string | null } | null;
  } | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: saved } = useQuery({
    queryKey: ["saved", user?.id, listing.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_listings")
        .select("id")
        .eq("user_id", user!.id)
        .eq("listing_id", listing.id)
        .maybeSingle();
      return !!data;
    },
  });

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate({ to: "/auth", search: { mode: "signup" } }); return; }
    if (saved) {
      await supabase.from("saved_listings").delete().eq("user_id", user!.id).eq("listing_id", listing.id);
    } else {
      await supabase.from("saved_listings").insert({ user_id: user!.id, listing_id: listing.id });
      toast.success("Saved");
    }
    qc.invalidateQueries({ queryKey: ["saved"] });
  };

  const amenityChips = [
    listing.has_kitchen && "Kitchen",
    listing.has_furnished && "Furnished",
    listing.has_security && "Security",
    listing.has_parking && "Parking",
  ].filter(Boolean) as string[];

  const vendorName = listing.vendor?.business_name || listing.vendor?.profile?.full_name || "Vendor";

  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {listing.cover_image_url ? (
          <img
            src={listing.cover_image_url}
            alt={listing.title}
            loading="lazy"
            className={`h-full w-full object-cover transition group-hover:scale-105 ${!isAuthenticated ? "blur-md scale-110" : ""}`}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground text-sm">No photo</div>
        )}

        {!isAuthenticated && (
          <div className="absolute inset-0 grid place-items-center bg-black/30 text-white p-4 text-center">
            <div>
              <Lock className="mx-auto h-5 w-5 mb-2" />
              <p className="text-xs font-medium">Sign in to see photos &amp; contact</p>
            </div>
          </div>
        )}

        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge className={listing.listing_type === "rent" ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}>
            {listing.listing_type === "rent" ? "For Rent" : "For Sale"}
          </Badge>
          <Badge variant="secondary" className="capitalize">{listing.property_type}</Badge>
          {listing.is_featured && (
            <Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400">⭐ Featured</Badge>
          )}
        </div>


        <Button
          variant="secondary"
          size="icon"
          aria-label="Save"
          onClick={toggleSave}
          className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/90 hover:bg-white"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : ""}`} />
        </Button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold">{listing.title}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {listing.sector ? `${listing.sector}, ` : ""}{listing.district}
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-xl font-bold text-primary">{formatPrice(listing.price)}</span>
          <span className="text-xs text-muted-foreground">{formatPricePeriod(listing.price_period)}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bed`}</span>
          <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {listing.bathrooms} bath</span>
          {listing.size_sqm ? <span className="inline-flex items-center gap-1"><Ruler className="h-3.5 w-3.5" /> {listing.size_sqm} m²</span> : null}
        </div>

        {amenityChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {amenityChips.map((a) => (
              <span key={a} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{a}</span>
            ))}
          </div>
        )}

        {(listing.views_count != null || listing.created_at) && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{listing.views_count ? `${listing.views_count} views` : ""}</span>
            <span>{listing.created_at ? new Date(listing.created_at).toLocaleDateString("en-RW", { day: "numeric", month: "short" }) : ""}</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
              {initials(vendorName)}
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-1 text-xs font-medium">
                <span className="line-clamp-1">{vendorName}</span>
                {listing.vendor?.is_verified && (
                  <span className="text-primary" title="Verified">✓</span>
                )}
              </div>
            </div>
          </div>
          <Button size="icon" variant="ghost" aria-label="Chat" onClick={(e) => { e.preventDefault(); navigate({ to: "/listing/$id", params: { id: listing.id } }); }}>
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
