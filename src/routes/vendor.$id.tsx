import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Stars } from "@/components/Stars";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, initials } from "@/lib/format";
import { fetchListings } from "@/lib/listings-query";

export const Route = createFileRoute("/vendor/$id")({
  head: () => ({ meta: [{ title: "Landlord profile | HomeLink Rwanda" }] }),
  component: VendorProfile,
});

function VendorProfile() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: vendor } = useQuery({
    queryKey: ["vendor-profile", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors")
        .select(
          "business_name, is_verified, bio, languages, vendor_type, created_at, profile:profiles!vendors_id_fkey(full_name, avatar_url)",
        )
        .eq("id", id)
        .maybeSingle();
      return data as unknown as {
        business_name: string | null;
        is_verified: boolean;
        bio: string | null;
        languages: string[];
        vendor_type: string;
        created_at: string;
        profile: { full_name: string; avatar_url: string | null } | null;
      } | null;
    },
  });
  const { data: listings, isLoading } = useQuery({
    queryKey: ["vendor-listings", id],
    queryFn: () => fetchListings({ vendorId: id }),
  });
  const { data: buildings } = useQuery({
    queryKey: ["vendor-buildings", id],
    queryFn: async () =>
      (await supabase.from("buildings").select("id, name, district").eq("vendor_id", id)).data ??
      [],
  });
  const { data: reviews } = useQuery({
    queryKey: ["vendor-reviews", id],
    queryFn: async () =>
      (
        await supabase
          .from("reviews")
          .select(
            "id, rating, comment, created_at, reviewer_id, reviewer:profiles!reviews_reviewer_id_fkey(full_name)",
          )
          .eq("vendor_id", id)
          .order("created_at", { ascending: false })
      ).data as unknown as
        | {
            id: string;
            rating: number;
            comment: string | null;
            created_at: string;
            reviewer_id: string;
            reviewer: { full_name: string } | null;
          }[]
        | null,
  });
  const { data: canReview } = useQuery({
    queryKey: ["can-review", id, user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.rpc("can_review_vendor", { _vendor_id: id })).data ?? false,
  });

  const name = vendor?.business_name || vendor?.profile?.full_name || t("listing.vendor");
  const average = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const reviewed = reviews?.some((r) => r.reviewer_id === user?.id);

  const submitReview = async () => {
    const { error } = await supabase
      .from("reviews")
      .insert({ vendor_id: id, reviewer_id: user!.id, rating, comment: comment.trim() || null });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("vendor.reviewPosted"));
    setComment("");
    qc.invalidateQueries({ queryKey: ["vendor-reviews", id] });
  };

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {vendor?.profile?.avatar_url ? (
            <img
              src={vendor.profile.avatar_url}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-2xl font-semibold text-secondary-foreground">
              {initials(name)}
            </span>
          )}
          <div>
            <h1 className="text-3xl font-bold">{name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {vendor?.is_verified && (
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                  <BadgeCheck className="h-4 w-4" /> {t("card.verified")}
                </span>
              )}
              <span>{t(`vendor.type.${vendor?.vendor_type ?? "individual"}`)}</span>
              <span>
                {t("listing.memberSince", {
                  year: vendor?.created_at ? new Date(vendor.created_at).getFullYear() : "",
                })}
              </span>
              {reviews && reviews.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Stars value={average} /> {average.toFixed(1)} ({reviews.length})
                </span>
              )}
            </p>
            {vendor?.languages && vendor.languages.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("vendor.speaks", { languages: vendor.languages.join(", ") })}
              </p>
            )}
          </div>
        </div>
        {vendor?.bio && (
          <p className="mt-5 max-w-[70ch] leading-relaxed text-muted-foreground">{vendor.bio}</p>
        )}

        {buildings && buildings.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-bold">{t("vendor.buildings")}</h2>
            <ul className="flex flex-wrap gap-2">
              {buildings.map((b) => (
                <li key={b.id}>
                  <a
                    href={`/building/${b.id}`}
                    className="block rounded-md border bg-card px-4 py-2 font-medium hover:border-primary"
                  >
                    {b.name}, {b.district}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <h2 className="mb-5 mt-10 text-2xl font-bold">{t("vendor.listings", { name })}</h2>
        {isLoading ? (
          <ListingGridSkeleton count={4} />
        ) : (
          <ListingGrid listings={listings ?? []} empty={t("vendor.noListings")} />
        )}

        <section className="mt-10 max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold">{t("vendor.reviews")}</h2>
          {canReview && !reviewed && (
            <div className="mb-6 rounded-lg border bg-card p-4">
              <p className="font-semibold">{t("vendor.leaveReview")}</p>
              <div className="my-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    aria-pressed={rating === n}
                    variant={rating === n ? "default" : "outline"}
                    onClick={() => setRating(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
              <Textarea
                rows={3}
                maxLength={1000}
                value={comment}
                aria-label={t("vendor.leaveReview")}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button className="mt-2" onClick={submitReview}>
                {t("vendor.postReview")}
              </Button>
            </div>
          )}
          {reviews && reviews.length > 0 ? (
            <ul className="divide-y border-y">
              {reviews.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Stars value={r.rating} />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(r.created_at, i18n.resolvedLanguage)}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1">{r.comment}</p>}
                  <p className="mt-1 text-sm text-muted-foreground">{r.reviewer?.full_name}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">{t("vendor.noReviews")}</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
