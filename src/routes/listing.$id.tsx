import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useEmblaCarousel from "embla-carousel-react";
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flag,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  Ruler,
  ShieldAlert,
  Video,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ImigongoBand } from "@/components/brand/Imigongo";
import { ViewingDialog } from "@/components/booking/ViewingDialog";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Price } from "@/components/listings/Price";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AMENITIES, SITE_URL } from "@/lib/constants";
import { formatDate, initials, whatsappDigits } from "@/lib/format";
import { fetchListings } from "@/lib/listings-query";
import { addRecentlyViewed } from "@/lib/recently-viewed";

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("listings")
      .select(
        "title, district, sector, price, listing_type, bedrooms, bathrooms, cover_image_url, description",
      )
      .eq("id", params.id)
      .maybeSingle();
    return data;
  },
  head: ({ loaderData: l, params }) => ({
    meta: l
      ? [
          { title: `${l.title}, ${l.district} | HomeLink Rwanda` },
          {
            name: "description",
            content: l.description?.slice(0, 155) ?? `Property in ${l.district}, Rwanda.`,
          },
          { property: "og:title", content: `${l.title} | HomeLink Rwanda` },
          {
            property: "og:description",
            content: l.description?.slice(0, 155) ?? `Property in ${l.district}, Rwanda.`,
          },
          ...(l.cover_image_url ? [{ property: "og:image", content: l.cover_image_url }] : []),
          { property: "og:type", content: "article" },
          {
            "script:ld+json": {
              "@context": "https://schema.org",
              "@type": "Accommodation",
              name: l.title,
              description: l.description ?? undefined,
              url: `${SITE_URL}/listing/${params.id}`,
              image: l.cover_image_url ?? undefined,
              numberOfBedrooms: l.bedrooms,
              numberOfBathroomsTotal: l.bathrooms,
              address: {
                "@type": "PostalAddress",
                addressLocality: l.sector ?? l.district,
                addressRegion: l.district,
                addressCountry: "RW",
              },
            },
          },
        ]
      : [{ title: "Listing | HomeLink Rwanda" }],
    links: [{ rel: "canonical", href: `${SITE_URL}/listing/${params.id}` }],
  }),
  component: ListingDetail,
});

async function fetchListing(id: string, withContact: boolean) {
  const contact = withContact ? "whatsapp_number," : "";
  const { data, error } = await supabase
    .from("listings")
    .select(
      `*,
      images:listing_images(image_url, sort_order),
      building:buildings(id, name),
      vendor:vendors!listings_vendor_id_fkey ( business_name, ${contact} is_verified, created_at, profile:profiles!vendors_id_fkey ( id, full_name, avatar_url ) )
    `,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ListingRow | null;
}

type ListingRow = Record<string, unknown> & {
  id: string;
  title: string;
  description: string | null;
  listing_type: "rent" | "sale";
  property_type: string;
  price: number;
  price_period: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  district: string;
  sector: string | null;
  cell: string | null;
  address_details: string | null;
  is_available: boolean;
  is_approved: boolean;
  cover_image_url: string | null;
  vendor_id: string;
  min_stay_months: number | null;
  available_from: string | null;
  deposit_months: number | null;
  utilities_included: boolean;
  english_lease: boolean;
  video_url: string | null;
  unit_label: string | null;
  images: { image_url: string; sort_order: number }[] | null;
  building: { id: string; name: string } | null;
  vendor: {
    business_name: string | null;
    whatsapp_number?: string | null;
    is_verified: boolean;
    created_at: string;
    profile: { id: string; full_name: string; avatar_url: string | null } | null;
  } | null;
};

function ListingDetail() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const { data: l, isLoading } = useQuery({
    queryKey: ["listing", id, isAuthenticated],
    queryFn: () => fetchListing(id, isAuthenticated),
  });

  const { data: similar } = useQuery({
    queryKey: ["similar", l?.district, l?.listing_type, id],
    enabled: !!l,
    queryFn: () =>
      fetchListings({ filters: { district: l!.district, listingType: l!.listing_type }, limit: 5 }),
  });

  useEffect(() => {
    if (!l) return;
    addRecentlyViewed(id);
    void supabase.rpc("record_listing_view", { _listing_id: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l?.id]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentImageIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const startChat = useMutation({
    mutationFn: async () => {
      if (!user || !l) throw new Error("Sign in required");
      const { data: existing } = await supabase
        .from("chats")
        .select("id")
        .eq("client_id", user.id)
        .eq("vendor_id", l.vendor_id)
        .eq("listing_id", l.id)
        .maybeSingle();
      if (existing) return existing.id;
      const { data: created, error } = await supabase
        .from("chats")
        .insert({ client_id: user.id, vendor_id: l.vendor_id, listing_id: l.id })
        .select("id")
        .single();
      if (error) throw error;
      return created.id;
    },
    onSuccess: () => navigate({ to: "/messages" }),
    onError: (e: Error) => toast.error(e.message),
  });

  const submitReport = async () => {
    if (!user || !l) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      listing_id: l.id,
      reason: "user_report",
      details: reportText,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("listing.reportSent"));
    setReportOpen(false);
    setReportText("");
  };

  if (isLoading)
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-6xl p-8">
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </div>
      </>
    );
  if (!l)
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-lg p-12 text-center">
          <h1 className="text-2xl font-bold">{t("listing.notFound")}</h1>
          <p className="mt-2 text-muted-foreground">{t("listing.notFoundBody")}</p>
          <Button asChild className="mt-5">
            <Link to="/search">{t("listing.searchHomes")}</Link>
          </Button>
        </div>
      </>
    );

  const images = [...(l.images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.image_url);
  if (l.cover_image_url && !images.includes(l.cover_image_url)) images.unshift(l.cover_image_url);

  const vendor = l.vendor;
  const vendorName = vendor?.business_name || vendor?.profile?.full_name || t("listing.vendor");
  const similarListings = (similar ?? []).filter((s) => s.id !== id).slice(0, 4);
  const isOwner = user?.id === l.vendor_id;
  const openViewing = () =>
    isAuthenticated ? setViewingOpen(true) : navigate({ to: "/auth", search: { mode: "signup" } });

  const terms = [
    l.min_stay_months
      ? { icon: CalendarDays, text: t("card.minStay", { count: l.min_stay_months }) }
      : null,
    l.available_from
      ? {
          icon: CalendarCheck,
          text: t("listing.availableFrom", {
            date: formatDate(l.available_from, i18n.resolvedLanguage),
          }),
        }
      : null,
    l.deposit_months != null
      ? { icon: Wallet, text: t("listing.deposit", { count: Number(l.deposit_months) }) }
      : null,
    l.utilities_included ? { icon: Check, text: t("listing.utilitiesIncluded") } : null,
    l.english_lease ? { icon: FileText, text: t("listing.englishLease") } : null,
  ].filter(Boolean) as { icon: typeof Check; text: string }[];

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <nav aria-label={t("location.breadcrumb")} className="mb-3 text-sm text-muted-foreground">
          <Link to="/locations" className="hover:text-primary">
            {t("location.allRwanda")}
          </Link>
          {" / "}
          <Link
            to="/locations/$district"
            params={{ district: l.district.toLowerCase() }}
            className="hover:text-primary"
          >
            {l.district}
          </Link>
          {l.sector && (
            <>
              {" / "}
              <Link
                to="/search"
                search={{ district: l.district, sector: l.sector }}
                className="hover:text-primary"
              >
                {l.sector}
              </Link>
            </>
          )}
        </nav>
        {!l.is_approved && (
          <p className="mb-4 rounded-md border bg-card p-3 text-sm">{t("listing.pendingNotice")}</p>
        )}

        <div className="relative overflow-hidden rounded-lg bg-muted">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {images.length > 0 ? (
                images.map((src, i) => (
                  <div
                    key={src}
                    className="relative h-[280px] min-w-0 flex-[0_0_100%] sm:h-[480px]"
                  >
                    <img
                      src={src}
                      alt={t("listing.photoAlt", { title: l.title, n: i + 1 })}
                      loading={i === 0 ? "eager" : "lazy"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="grid h-[280px] min-w-0 flex-[0_0_100%] place-items-center text-muted-foreground sm:h-[480px]">
                  {t("card.noPhoto")}
                </div>
              )}
            </div>
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={() => emblaApi?.scrollPrev()}
                aria-label={t("listing.prevPhoto")}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-ink/70 p-2 text-white hover:bg-ink"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                aria-label={t("listing.nextPhoto")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-ink/70 p-2 text-white hover:bg-ink"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-sm text-white">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">
              {l.listing_type === "rent" ? t("home.filterRent") : t("home.filterSale")},{" "}
              {t(`property.${l.property_type}`)}
              {!l.is_available && (
                <span className="ml-2 text-destructive">{t("listing.unavailable")}</span>
              )}
            </p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{l.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {[l.sector, l.district].filter(Boolean).join(", ")}
            </p>
            {l.building && (
              <Link
                to="/building/$id"
                params={{ id: l.building.id }}
                className="mt-1 flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <Building2 className="h-4 w-4" /> {l.building.name}
                {l.unit_label ? `, ${l.unit_label}` : ""}
              </Link>
            )}

            <div className="mt-5 flex flex-wrap gap-6 border-y py-4">
              <span className="inline-flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-primary" />{" "}
                {l.bedrooms === 0 ? t("card.studio") : t("card.beds", { count: l.bedrooms })}
              </span>
              <span className="inline-flex items-center gap-2">
                <Bath className="h-5 w-5 text-primary" /> {t("card.baths", { count: l.bathrooms })}
              </span>
              {l.size_sqm && (
                <span className="inline-flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-primary" /> {l.size_sqm} m²
                </span>
              )}
            </div>

            {terms.length > 0 && (
              <section className="mt-6">
                <h2 className="mb-3 text-xl font-bold">{t("listing.stayTerms")}</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {terms.map((x) => (
                    <li key={x.text} className="flex items-center gap-2">
                      <x.icon className="h-4 w-4 shrink-0 text-primary" /> {x.text}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-6">
              <h2 className="mb-3 text-xl font-bold">{t("listing.description")}</h2>
              <p className="max-w-[70ch] whitespace-pre-line leading-relaxed text-muted-foreground">
                {l.description || t("listing.noDescription")}
              </p>
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-xl font-bold">{t("listing.amenities")}</h2>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AMENITIES.filter((a) => l[a.key]).map((a) => (
                  <li key={a.key} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> {t(`amenity.${a.key}`)}
                  </li>
                ))}
              </ul>
            </section>

            {l.video_url && (
              <section className="mt-6">
                <h2 className="mb-3 text-xl font-bold">{t("listing.videoTour")}</h2>
                <Button asChild variant="outline">
                  <a href={l.video_url} target="_blank" rel="noreferrer nofollow">
                    <Video className="h-4 w-4" /> {t("listing.watchTour")}
                  </a>
                </Button>
              </section>
            )}

            <section className="mt-6">
              <h2 className="mb-3 text-xl font-bold">{t("listing.location")}</h2>
              <div className="aspect-video overflow-hidden rounded-lg border">
                <iframe
                  title={t("listing.mapTitle")}
                  loading="lazy"
                  className="h-full w-full"
                  src={`https://www.google.com/maps?q=${encodeURIComponent([l.cell, l.sector, l.district, "Rwanda"].filter(Boolean).join(", "))}&output=embed`}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t("listing.mapNote")}</p>
            </section>

            <button
              onClick={() =>
                isAuthenticated
                  ? setReportOpen(true)
                  : navigate({ to: "/auth", search: { mode: "signin" } })
              }
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
            >
              <Flag className="h-3.5 w-3.5" /> {t("listing.report")}
            </button>
          </div>

          <aside className="h-fit overflow-hidden rounded-lg border bg-card lg:sticky lg:top-20">
            <ImigongoBand />
            <div className="p-5">
              <Price value={l.price} period={l.price_period} size="lg" />
              <Link
                to="/vendor/$id"
                params={{ id: l.vendor_id }}
                className="mt-4 flex items-center gap-3 border-t pt-4 hover:opacity-80"
              >
                {vendor?.profile?.avatar_url ? (
                  <img
                    src={vendor.profile.avatar_url}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary font-semibold text-secondary-foreground">
                    {initials(vendorName)}
                  </span>
                )}
                <span>
                  <span className="flex items-center gap-1 font-semibold">
                    {vendorName}{" "}
                    {vendor?.is_verified && (
                      <BadgeCheck
                        className="h-4 w-4 text-primary"
                        aria-label={t("card.verified")}
                      />
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("listing.memberSince", {
                      year: vendor?.created_at ? new Date(vendor.created_at).getFullYear() : "",
                    })}
                  </span>
                </span>
              </Link>

              {!isOwner && (
                <div className="mt-4 space-y-2">
                  {l.listing_type === "rent" || l.is_available ? (
                    <Button className="w-full" size="lg" onClick={openViewing}>
                      <CalendarCheck className="h-4 w-4" /> {t("listing.requestViewing")}
                    </Button>
                  ) : null}
                  {isAuthenticated ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={() => startChat.mutate()}
                        disabled={startChat.isPending}
                      >
                        <MessageSquare className="h-4 w-4" /> {t("listing.message")}
                      </Button>
                      {vendor?.whatsapp_number && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button asChild variant="outline">
                            <a
                              href={`https://wa.me/${whatsappDigits(vendor.whatsapp_number)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              WhatsApp
                            </a>
                          </Button>
                          <Button asChild variant="outline">
                            <a href={`tel:${vendor.whatsapp_number}`}>
                              <Phone className="h-4 w-4" /> {t("listing.call")}
                            </a>
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Button asChild variant="outline" className="w-full" size="lg">
                      <Link to="/auth" search={{ mode: "signup" }}>
                        <Lock className="h-4 w-4" /> {t("listing.signInContact")}
                      </Link>
                    </Button>
                  )}
                </div>
              )}
              <p className="mt-4 flex items-start gap-2 border-t pt-4 text-sm text-muted-foreground">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {t("listing.scamWarning")}
              </p>
            </div>
          </aside>
        </div>

        {similarListings.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-bold">
              {t("listing.similar", { district: l.district })}
            </h2>
            <ListingGrid listings={similarListings} empty="" />
          </section>
        )}
      </main>

      <ViewingDialog
        open={viewingOpen}
        onOpenChange={setViewingOpen}
        listingId={l.id}
        vendorId={l.vendor_id}
      />

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("listing.reportTitle")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            aria-label={t("listing.reportTitle")}
            placeholder={t("listing.reportPlaceholder")}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitReport} disabled={reportText.length < 5}>
              {t("listing.reportSend")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
