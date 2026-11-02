import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { fetchListings } from "@/lib/listings-query";
import { NEIGHBOURHOODS, neighbourhoodText } from "@/lib/neighbourhoods";

export const Route = createFileRoute("/neighbourhoods/$slug")({
  loader: ({ params }) => {
    const n = NEIGHBOURHOODS.find((x) => x.slug === params.slug);
    if (!n) throw notFound();
    return n;
  },
  head: ({ loaderData: n }) => ({
    meta: n
      ? [
          { title: `Living in ${n.name}, Rwanda | HomeLink Rwanda` },
          { name: "description", content: n.en.summary },
        ]
      : [],
  }),
  component: AreaPage,
});

function AreaPage() {
  const n = Route.useLoaderData();
  const { t, i18n } = useTranslation();
  const c = neighbourhoodText(n, i18n.resolvedLanguage);
  const { data, isLoading } = useQuery({
    queryKey: ["area", n.slug],
    queryFn: () => fetchListings({ filters: { q: n.search }, limit: 8 }),
  });
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <Link to="/neighbourhoods" className="text-sm font-medium text-primary hover:underline">
          {t("area.back")}
        </Link>
        <h1 className="mt-2 text-5xl font-extrabold">{n.name}</h1>
        <p className="mt-1 text-muted-foreground">
          {n.city}, {n.district}
        </p>
        <p className="mt-4 max-w-2xl text-lg">{c.summary}</p>
        <dl className="mt-6 grid max-w-3xl gap-4 border-y py-4 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">{t("area.goodFor")}</dt>
            <dd className="text-muted-foreground">{c.goodFor}</dd>
          </div>
          <div>
            <dt className="font-semibold">{t("area.nearby")}</dt>
            <dd className="text-muted-foreground">{c.nearby}</dd>
          </div>
        </dl>
        <div className="mb-5 mt-10 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">{t("area.homesIn", { name: n.name })}</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/search" search={{ q: n.search }}>
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
