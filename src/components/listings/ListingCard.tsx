import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Columns3,
  Heart,
  MapPin,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { MAX_COMPARE, useAppStore } from "@/store/app-store";
import { Price } from "./Price";

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
  has_wifi?: boolean;
  min_stay_months?: number | null;
  available_from?: string | null;
  utilities_included?: boolean;
  building_id?: string | null;
  unit_label?: string | null;
  views_count?: number;
  created_at?: string;
  is_featured?: boolean;
  is_available?: boolean;
  is_approved?: boolean;
  vendor_id: string;
  vendor?: {
    business_name: string | null;
    is_verified: boolean;
    profile?: { full_name: string; avatar_url?: string | null } | null;
  } | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const compare = useAppStore((s) => s.compare);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const comparing = compare.includes(listing.id);

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
    if (!isAuthenticated) {
      navigate({ to: "/auth", search: { mode: "signup" } });
      return;
    }
    if (saved) {
      await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user!.id)
        .eq("listing_id", listing.id);
    } else {
      await supabase.from("saved_listings").insert({ user_id: user!.id, listing_id: listing.id });
      toast.success(t("card.saved"));
    }
    qc.invalidateQueries({ queryKey: ["saved"] });
    qc.invalidateQueries({ queryKey: ["saved-listings"] });
  };

  const onCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!toggleCompare(listing.id)) toast.error(t("compare.limit", { count: MAX_COMPARE }));
  };

  const place = [listing.sector, listing.district].filter(Boolean).join(", ");
  const facts = [
    listing.has_furnished && t("amenity.has_furnished"),
    listing.utilities_included && t("listing.utilitiesIncluded"),
    listing.has_wifi && t("amenity.has_wifi"),
  ].filter(Boolean) as string[];

  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {listing.cover_image_url ? (
          <img
            src={listing.cover_image_url}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
            {t("card.noPhoto")}
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1 text-xs font-semibold">
          <span
            className={`rounded px-2 py-1 ${listing.listing_type === "rent" ? "bg-primary text-primary-foreground" : "bg-ink text-white"}`}
          >
            {listing.listing_type === "rent" ? t("home.filterRent") : t("home.filterSale")}
          </span>
          {listing.is_featured && (
            <span className="rounded bg-marigold px-2 py-1 text-ink">{t("card.featured")}</span>
          )}
        </div>
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            type="button"
            aria-label={t("compare.add")}
            aria-pressed={comparing}
            onClick={onCompare}
            className={`grid h-9 w-9 place-items-center rounded-full ${comparing ? "bg-primary text-primary-foreground" : "bg-white/95 text-ink hover:bg-white"}`}
          >
            <Columns3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={t("card.save")}
            aria-pressed={!!saved}
            onClick={toggleSave}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink hover:bg-white"
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Price value={listing.price} period={listing.price_period} />
        <h3 className="line-clamp-1 font-sans text-base font-semibold tracking-normal">
          {listing.title}
        </h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="line-clamp-1">{place}</span>
        </p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-4 w-4" />{" "}
            {listing.bedrooms === 0
              ? t("card.studio")
              : t("card.beds", { count: listing.bedrooms })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-4 w-4" /> {t("card.baths", { count: listing.bathrooms })}
          </span>
          {listing.size_sqm ? (
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-4 w-4" /> {listing.size_sqm} m²
            </span>
          ) : null}
        </div>

        {facts.length > 0 && <p className="text-sm text-foreground">{facts.join(", ")}</p>}

        <div className="mt-auto space-y-1 border-t pt-3 text-sm">
          {listing.min_stay_months ? (
            <p className="flex items-center gap-1 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />{" "}
              {t("card.minStay", { count: listing.min_stay_months })}
            </p>
          ) : null}
          {listing.building_id ? (
            <p className="flex items-center gap-1 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> {t("card.inBuilding")}
            </p>
          ) : null}
          {listing.vendor?.is_verified && (
            <p className="flex items-center gap-1 font-medium text-primary">
              <BadgeCheck className="h-4 w-4" /> {t("card.verified")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
