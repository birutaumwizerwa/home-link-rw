import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { fetchListings } from "@/lib/listings-query";
import { PROVINCES } from "@/lib/rwanda-locations";

export const Route = createFileRoute("/locations/$district")({
  loader: ({ params }) => {
    for (const province of PROVINCES) {
      const district = province.districts.find(
        (d) => d.name.toLowerCase() === params.district.toLowerCase(),
      );
      if (district)
        return { province: province.id, name: district.name, sectors: district.sectors };
    }
    throw notFound();
  },
  head: ({ loaderData: d }) => ({
    meta: d
      ? [
          { title: `Homes in ${d.name} district, Rwanda | HomeLink Rwanda` },
          {
            name: "description",
            content: `Homes for rent and sale in ${d.name}, across its ${d.sectors.length} sectors.`,
          },
        ]
      : [],
  }),
  component: DistrictPage,
});

function DistrictPage() {
  const d = Route.useLoaderData();
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["district", d.name],
    queryFn: () => fetchListings({ filters: { district: d.name }, limit: 12 }),
  });
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <nav aria-label={t("location.breadcrumb")} className="text-sm text-muted-foreground">
          <Link to="/locations" className="hover:text-primary">
            {t("location.allRwanda")}
          </Link>{" "}
          / {t(`location.provinces.${d.province}`)}
        </nav>
        <h1 className="mt-2 text-5xl font-extrabold">{d.name}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("location.sectorCount", { count: d.sectors.length })}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {d.sectors.map((s) => (
            <Link
              key={s}
              to="/search"
              search={{ district: d.name, sector: s }}
              className="rounded-md border bg-card px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
            >
              {s}
            </Link>
          ))}
        </div>
        <div className="mb-5 mt-10 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">{t("area.homesIn", { name: d.name })}</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/search" search={{ district: d.name }}>
              {t("home.viewAll")}
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <ListingGridSkeleton count={4} />
        ) : (
          <ListingGrid listings={data ?? []} empty={t("area.noHomes")} />
        )}
      </main>
      <Footer />
    </div>
  );
}
