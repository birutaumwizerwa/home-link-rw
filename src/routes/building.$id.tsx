import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { supabase } from "@/integrations/supabase/client";
import { fetchListings } from "@/lib/listings-query";

export const Route = createFileRoute("/building/$id")({
  loader: async ({ params }) =>
    (
      await supabase
        .from("buildings")
        .select("name, district, description")
        .eq("id", params.id)
        .maybeSingle()
    ).data,
  head: ({ loaderData: b }) => ({
    meta: b
      ? [
          { title: `${b.name}, ${b.district} | HomeLink Rwanda` },
          {
            name: "description",
            content:
              b.description?.slice(0, 155) ??
              `Available apartments at ${b.name}, ${b.district}, Rwanda.`,
          },
        ]
      : [{ title: "Building | HomeLink Rwanda" }],
  }),
  component: BuildingPage,
});

function BuildingPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { data: b, isLoading: loadingBuilding } = useQuery({
    queryKey: ["building", id],
    queryFn: async () =>
      (
        await supabase
          .from("buildings")
          .select("*, vendor:vendors!buildings_vendor_id_fkey(business_name, is_verified)")
          .eq("id", id)
          .maybeSingle()
      ).data as unknown as {
        name: string;
        description: string | null;
        district: string;
        sector: string | null;
        cover_image_url: string | null;
        total_units: number | null;
        vendor_id: string;
        vendor: { business_name: string | null } | null;
      } | null,
  });
  const { data: units, isLoading } = useQuery({
    queryKey: ["building-units", id],
    queryFn: () => fetchListings({ buildingId: id }),
  });

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {!loadingBuilding && !b ? (
          <h1 className="text-2xl font-bold">{t("building.notFound")}</h1>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-[1fr_380px] md:items-center">
              <div>
                <h1 className="text-4xl font-bold">{b?.name}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />{" "}
                  {[b?.sector, b?.district].filter(Boolean).join(", ")}
                </p>
                {b?.vendor?.business_name && (
                  <p className="mt-1 text-sm">
                    {t("building.managedBy")}{" "}
                    <Link
                      to="/vendor/$id"
                      params={{ id: b.vendor_id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {b.vendor.business_name}
                    </Link>
                  </p>
                )}
                {b?.description && (
                  <p className="mt-4 max-w-[70ch] whitespace-pre-line leading-relaxed text-muted-foreground">
                    {b.description}
                  </p>
                )}
              </div>
              {b?.cover_image_url && (
                <img
                  src={b.cover_image_url}
                  alt={b.name}
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
              )}
            </div>
            <h2 className="mb-5 mt-10 text-2xl font-bold">
              {t("building.availableUnits", { count: units?.length ?? 0 })}
            </h2>
            {isLoading ? (
              <ListingGridSkeleton count={4} />
            ) : (
              <ListingGrid listings={units ?? []} empty={t("building.noUnits")} />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
