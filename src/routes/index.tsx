import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Building2, CalendarCheck, Globe2, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ImigongoBand, ImigongoPanel } from "@/components/brand/Imigongo";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";
import { LocationSearch } from "@/components/location/LocationSearch";
import { fetchListings } from "@/lib/listings-query";
import { PROVINCES } from "@/lib/rwanda-locations";
import { NEIGHBOURHOODS, neighbourhoodText } from "@/lib/neighbourhoods";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeLink Rwanda: homes for a few months or for good" },
      {
        name: "description",
        content:
          "Find apartments, houses and furnished medium to long-stay rentals across Rwanda. Book viewings in person or by video, compare homes and contact landlords directly.",
      },
    ],
  }),
  component: Index,
});

type Stay = "short" | "medium" | "long" | "buy";
const STAYS: Stay[] = ["short", "medium", "long", "buy"];

function Index() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [stay, setStay] = useState<Stay>("medium");

  const featured = useQuery({
    queryKey: ["listings", "featured"],
    queryFn: () => fetchListings({ featured: true, limit: 4 }),
  });
  const latest = useQuery({
    queryKey: ["listings", "latest"],
    queryFn: () => fetchListings({ limit: 8 }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/search",
      search: { q: q || undefined, ...(stay === "buy" ? { type: "sale" as const } : { stay }) },
    });
  };

  const features = (featured.data?.length ?? 0) > 0;
  const promises = [
    {
      icon: CalendarCheck,
      title: t("home.promiseViewingTitle"),
      body: t("home.promiseViewingBody"),
    },
    { icon: ShieldCheck, title: t("home.promiseTrustTitle"), body: t("home.promiseTrustBody") },
    { icon: Globe2, title: t("home.promiseGlobalTitle"), body: t("home.promiseGlobalBody") },
  ];

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl items-stretch lg:grid-cols-[1fr_400px]">
          <div className="px-4 py-12 sm:px-6 sm:py-16 lg:py-24 lg:pr-12">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/80">{t("home.heroSubtitle")}</p>
            <form
              onSubmit={submit}
              className="mt-8 max-w-2xl rounded-lg bg-card p-3 text-foreground sm:p-4"
            >
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">{t("home.stayQuestion")}</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STAYS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={stay === s}
                      onClick={() => setStay(s)}
                      className={`rounded-md border px-2 py-2 text-sm font-medium ${stay === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
                    >
                      {t(`home.stay.${s}`)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <LocationSearch
                  value={q}
                  onChange={setQ}
                  onPick={(p) =>
                    navigate({
                      to: "/search",
                      search: {
                        district: p.district,
                        sector: p.sector,
                        ...(stay === "buy" ? { type: "sale" as const } : { stay }),
                      },
                    })
                  }
                />
                <Button type="submit" className="h-11 px-8">
                  {t("home.searchBtn")}
                </Button>
              </div>
            </form>
          </div>
          <div className="relative hidden lg:block">
            <ImigongoPanel className="imigongo-reveal absolute inset-0 h-full w-full" />
          </div>
        </div>
        <ImigongoBand className="lg:hidden" />
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6">
        <section className="grid gap-6 border-b pb-10 md:grid-cols-3">
          {promises.map((p) => (
            <div key={p.title}>
              <p.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-2 text-lg font-bold">{p.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold">{t("home.whereTitle")}</h2>
            <Link
              to="/neighbourhoods"
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              {t("home.allAreas")}
            </Link>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {NEIGHBOURHOODS.slice(0, 6).map((n) => (
              <li key={n.slug} className="border-t py-3">
                <Link
                  to="/neighbourhoods/$slug"
                  params={{ slug: n.slug }}
                  className="block hover:text-primary"
                >
                  <span className="font-display text-lg font-bold">{n.name}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {neighbourhoodText(n, i18n.resolvedLanguage).goodFor}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold">{t("home.provincesTitle")}</h2>
            <Link
              to="/locations"
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              {t("home.allDistricts")}
            </Link>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {PROVINCES.map((p) => (
              <Link
                key={p.id}
                to="/search"
                search={{ province: p.id }}
                className="bg-card p-4 hover:bg-accent"
              >
                <span className="block font-display text-lg font-bold leading-tight">
                  {t(`location.provinces.${p.id}`)}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {t("location.districtCount", { count: p.districts.length })}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {features && (
          <section className="mt-12">
            <h2 className="mb-5 text-3xl font-bold">{t("home.featured")}</h2>
            <ListingGrid listings={featured.data ?? []} empty="" />
          </section>
        )}

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold">{t("home.latest")}</h2>
            <Link
              to="/search"
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              {t("home.viewAll")}
            </Link>
          </div>
          {latest.isLoading ? (
            <ListingGridSkeleton count={8} />
          ) : (
            <ListingGrid listings={latest.data ?? []} empty={t("home.noListings")} />
          )}
        </section>

        <section className="mt-14 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-2">
          <div className="bg-primary p-8 text-primary-foreground">
            <Building2 className="h-7 w-7" />
            <h2 className="mt-3 text-2xl font-bold">{t("home.apartmentsTitle")}</h2>
            <p className="mt-2 text-white/85">{t("home.apartmentsBody")}</p>
            <Button asChild variant="secondary" className="mt-5">
              <Link to="/for-apartments">{t("home.apartmentsCta")}</Link>
            </Button>
          </div>
          <div className="bg-card p-8">
            <Globe2 className="h-7 w-7 text-primary" />
            <h2 className="mt-3 text-2xl font-bold">{t("home.movingTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("home.movingBody")}</p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/guide">{t("home.movingCta")}</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
