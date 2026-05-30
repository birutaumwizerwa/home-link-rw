import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { MapPin, BedDouble, Bath, Ruler, Phone, MessageSquare, Flag, Check, X, Lock, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fetchListings } from "@/lib/listings-query";
import { formatPrice, formatPricePeriod, initials } from "@/lib/format";
import { AMENITIES } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("listings")
      .select("title, district, price, cover_image_url, description")
      .eq("id", params.id)
      .maybeSingle();
    return data;
  },
  head: ({ loaderData: l }) => ({
    meta: l
      ? [
          { title: `${l.title} — ${l.district} | HomeLink Rwanda` },
          { name: "description", content: l.description?.slice(0, 155) ?? `Property for rent or sale in ${l.district}, Rwanda.` },
          { property: "og:title", content: `${l.title} | HomeLink Rwanda` },
          { property: "og:description", content: l.description?.slice(0, 155) ?? `Property in ${l.district}, Rwanda.` },
          ...(l.cover_image_url ? [{ property: "og:image", content: l.cover_image_url }] : []),
          { property: "og:type", content: "article" },
        ]
      : [{ title: "Listing | HomeLink Rwanda" }],
  }),
  component: ListingDetail,
});

async function fetchListing(id: string) {
  const { data, error } = await supabase
    .from("listings")
    .select(`*,
      images:listing_images(image_url, sort_order),
      vendor:vendors!listings_vendor_id_fkey ( business_name, whatsapp_number, is_verified, created_at, profile:profiles!vendors_id_fkey ( id, full_name, avatar_url ) )
    `)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function ListingDetail() {
  const { id } = Route.useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const { data: l, isLoading } = useQuery({ queryKey: ["listing", id], queryFn: () => fetchListing(id) });

  const { data: similar } = useQuery({
    queryKey: ["similar", l?.district, l?.listing_type, id],
    enabled: !!l,
    queryFn: () => fetchListings({ filters: { district: l!.district, listingType: l!.listing_type }, limit: 5 }),
  });

  // Increment view count once on load
  useEffect(() => {
    if (!l) return;
    void supabase.from("listings").update({ views_count: (l.views_count ?? 0) + 1 }).eq("id", id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l?.id]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentImageIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const startChat = useMutation({
    mutationFn: async () => {
      if (!user || !l) throw new Error("Sign in required");
      const { data: existing } = await supabase
        .from("chats").select("id")
        .eq("client_id", user.id).eq("vendor_id", l.vendor_id).eq("listing_id", l.id).maybeSingle();
      if (existing) return existing.id;
      const { data: created, error } = await supabase
        .from("chats")
        .insert({ client_id: user.id, vendor_id: l.vendor_id, listing_id: l.id })
        .select("id").single();
      if (error) throw error;
      return created.id;
    },
    onSuccess: () => navigate({ to: "/messages" }),
  });

  const submitReport = async () => {
    if (!user || !l) return;
    await supabase.from("reports").insert({ reporter_id: user.id, listing_id: l.id, reason: "user_report", details: reportText });
    toast.success("Report submitted. Thank you.");
    setReportOpen(false); setReportText("");
  };

  if (isLoading) return <><Navbar /><div className="mx-auto max-w-5xl p-8"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div></>;
  if (!l) return <><Navbar /><div className="mx-auto max-w-5xl p-8 text-center"><h1 className="text-2xl font-bold">Listing not found</h1></div></>;

  const images = ((l.images as { image_url: string; sort_order: number }[] | null) ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.image_url);
  if (l.cover_image_url && !images.includes(l.cover_image_url)) images.unshift(l.cover_image_url);

  const vendor = (l as { vendor: { business_name: string | null; whatsapp_number: string | null; is_verified: boolean; created_at: string; profile: { id: string; full_name: string; avatar_url: string | null } | null } | null }).vendor;
  const vendorName = vendor?.business_name || vendor?.profile?.full_name || "Vendor";
  const similarListings = (similar ?? []).filter((s) => s.id !== id).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">← Back</Button>

        {/* Scam warning */}
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>Never send money before visiting the property in person. Report suspicious listings using the flag button.</span>
        </div>

        {/* Image carousel */}
        <div className="relative overflow-hidden rounded-2xl bg-muted">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {images.length > 0 ? images.map((src, i) => (
                <div key={i} className="relative h-[300px] min-w-0 flex-[0_0_100%] sm:h-[440px]">
                  <img
                    src={src}
                    alt={`${l.title} photo ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className={`h-full w-full object-cover ${!isAuthenticated ? "blur-md scale-110" : ""}`}
                  />
                </div>
              )) : (
                <div className="grid h-[300px] min-w-0 flex-[0_0_100%] place-items-center text-muted-foreground sm:h-[440px]">No photos available</div>
              )}
            </div>
          </div>

          {images.length > 1 && isAuthenticated && (
            <>
              <button onClick={() => emblaApi?.scrollPrev()} aria-label="Previous"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => emblaApi?.scrollNext()} aria-label="Next"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="absolute inset-0 grid place-items-center bg-black/40 text-white">
              <div className="text-center">
                <Lock className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">Sign in to view all photos</p>
                <Button className="mt-3" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}>Create free account</Button>
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && isAuthenticated && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button key={i} onClick={() => emblaApi?.scrollTo(i)}
                className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${i === currentImageIndex ? "border-primary" : "border-transparent"}`}>
                <img src={src} alt={`thumbnail ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge className={l.listing_type === "rent" ? "bg-primary" : "bg-foreground"}>
                {l.listing_type === "rent" ? "For Rent" : "For Sale"}
              </Badge>
              <Badge variant="secondary" className="capitalize">{l.property_type}</Badge>
              {!l.is_available && <Badge variant="destructive">Unavailable</Badge>}
            </div>
            <h1 className="text-3xl font-bold">{l.title}</h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {[l.sector, l.district].filter(Boolean).join(", ")}
            </p>
            <p className="mt-4 text-3xl font-bold text-primary">{formatPrice(l.price)} <span className="text-base font-medium text-muted-foreground">{formatPricePeriod(l.price_period)}</span></p>

            <div className="mt-6 flex flex-wrap gap-6 border-y py-4 text-sm">
              <span className="inline-flex items-center gap-2"><BedDouble className="h-4 w-4 text-primary" /> {l.bedrooms === 0 ? "Studio" : `${l.bedrooms} bedrooms`}</span>
              <span className="inline-flex items-center gap-2"><Bath className="h-4 w-4 text-primary" /> {l.bathrooms} bathrooms</span>
              {l.size_sqm && <span className="inline-flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> {l.size_sqm} m²</span>}
            </div>

            <section className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{l.description || "No description provided."}</p>
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Amenities</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {AMENITIES.map((a) => {
                  const has = !!(l as Record<string, unknown>)[a.key];
                  return (
                    <div key={a.key} className={`flex items-center gap-2 rounded-md border p-2 text-sm ${has ? "" : "opacity-40"}`}>
                      {has ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4" />} {a.label}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Location</h2>
              <div className="aspect-video overflow-hidden rounded-xl border">
                <iframe
                  title="map"
                  loading="lazy"
                  className="h-full w-full"
                  src={`https://www.google.com/maps?q=${encodeURIComponent([l.address_details, l.cell, l.sector, l.district, "Rwanda"].filter(Boolean).join(", "))}&output=embed`}
                />
              </div>
            </section>

            <button onClick={() => isAuthenticated ? setReportOpen(true) : navigate({ to: "/auth", search: { mode: "signin" } })} className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive">
              <Flag className="h-3.5 w-3.5" /> Report listing
            </button>
          </div>

          <aside className="h-fit rounded-2xl border bg-card p-5 shadow-card lg:sticky lg:top-20">
            <Link to="/vendor/$id" params={{ id: l.vendor_id }} className="flex items-center gap-3 hover:opacity-80">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary font-semibold">
                {initials(vendorName)}
              </span>
              <div>
                <div className="flex items-center gap-1 font-semibold">{vendorName} {vendor?.is_verified && <Check className="h-4 w-4 text-primary" />}</div>
                <div className="text-xs text-muted-foreground">Member since {vendor?.created_at ? new Date(vendor.created_at).getFullYear() : "—"}</div>
              </div>
            </Link>

            <div className="mt-5 space-y-2">
              {isAuthenticated ? (
                <>
                  {vendor?.whatsapp_number ? (
                    <>
                      <Button asChild className="w-full" size="lg">
                        <a href={`https://wa.me/${vendor.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                          <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                        </a>
                      </Button>
                      <Button asChild variant="outline" className="w-full" size="lg">
                        <a href={`tel:${vendor.whatsapp_number}`}><Phone className="mr-2 h-4 w-4" /> Call</a>
                      </Button>
                    </>
                  ) : (
                    <p className="rounded-md bg-muted p-3 text-center text-sm text-muted-foreground">No phone number added yet. Use in-app chat below.</p>
                  )}
                  <Button variant="secondary" className="w-full" size="lg" onClick={() => startChat.mutate()}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Chat in app
                  </Button>
                </>
              ) : (
                <>
                  <p className="rounded-md bg-muted p-3 text-center text-sm text-muted-foreground">Sign in to see vendor contact</p>
                  <Button asChild className="w-full" size="lg">
                    <Link to="/auth" search={{ mode: "signup" } as never}>Create free account</Link>
                  </Button>
                </>
              )}
            </div>
          </aside>
        </div>

        {/* Similar listings */}
        {similarListings.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-bold">Similar listings in {l.district}</h2>
            <ListingGrid listings={similarListings} empty="" />
          </section>
        )}
      </main>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report this listing</DialogTitle></DialogHeader>
          <Textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Tell us what's wrong with this listing..." rows={5} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button onClick={submitReport} disabled={reportText.length < 5}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
