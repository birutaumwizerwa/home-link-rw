import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, Minus, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Price } from "@/components/listings/Price";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AMENITIES } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [{ title: "Compare homes | HomeLink Rwanda" }, { name: "robots", content: "noindex" }],
  }),
  component: ComparePage,
});

type Row = Record<string, unknown> & {
  id: string;
  title: string;
  price: number;
  price_period: string;
  district: string;
  sector: string | null;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  min_stay_months: number | null;
  deposit_months: number | null;
  cover_image_url: string | null;
};

function ComparePage() {
  const { t } = useTranslation();
  const ids = useAppStore((s) => s.compare);
  const toggle = useAppStore((s) => s.toggleCompare);
  const { data } = useQuery({
    queryKey: ["compare", ids],
    enabled: ids.length > 0,
    queryFn: async () =>
      ((await supabase.from("listings").select("*").in("id", ids)).data ?? []) as unknown as Row[],
  });
  const rows = data ?? [];
  const facts: { label: string; value: (r: Row) => React.ReactNode }[] = [
    { label: t("compare.price"), value: (r) => <Price value={r.price} period={r.price_period} /> },
    {
      label: t("listing.location"),
      value: (r) => [r.sector, r.district].filter(Boolean).join(", "),
    },
    {
      label: t("search.bedrooms"),
      value: (r) => (r.bedrooms === 0 ? t("card.studio") : r.bedrooms),
    },
    { label: t("compare.bathrooms"), value: (r) => r.bathrooms },
    { label: t("compare.size"), value: (r) => (r.size_sqm ? `${r.size_sqm} m²` : "") },
    {
      label: t("compare.minStay"),
      value: (r) => (r.min_stay_months ? t("compare.months", { count: r.min_stay_months }) : ""),
    },
    {
      label: t("compare.deposit"),
      value: (r) =>
        r.deposit_months != null ? t("compare.months", { count: Number(r.deposit_months) }) : "",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">{t("compare.title")}</h1>
        {ids.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-10 text-center">
            <p className="text-muted-foreground">{t("compare.empty")}</p>
            <Button asChild className="mt-4">
              <Link to="/search">{t("listing.searchHomes")}</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <th scope="col" className="w-40 p-3 text-left font-semibold">
                    <span className="sr-only">{t("compare.feature")}</span>
                  </th>
                  {rows.map((r) => (
                    <th key={r.id} scope="col" className="p-3 text-left align-top font-normal">
                      {r.cover_image_url && (
                        <img
                          src={r.cover_image_url}
                          alt=""
                          className="mb-2 aspect-[4/3] w-full rounded object-cover"
                        />
                      )}
                      <Link
                        to="/listing/$id"
                        params={{ id: r.id }}
                        className="font-semibold hover:text-primary"
                      >
                        {r.title}
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggle(r.id)}
                        className="mt-1 flex items-center gap-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" /> {t("compare.remove")}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facts.map((f) => (
                  <tr key={f.label} className="border-t">
                    <th scope="row" className="p-3 text-left font-medium text-muted-foreground">
                      {f.label}
                    </th>
                    {rows.map((r) => (
                      <td key={r.id} className="p-3">
                        {f.value(r) || (
                          <Minus
                            className="h-4 w-4 text-muted-foreground"
                            aria-label={t("compare.notStated")}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {AMENITIES.map((a) => (
                  <tr key={a.key} className="border-t">
                    <th scope="row" className="p-3 text-left font-medium text-muted-foreground">
                      {t(`amenity.${a.key}`)}
                    </th>
                    {rows.map((r) => (
                      <td key={r.id} className="p-3">
                        {r[a.key] ? (
                          <Check className="h-4 w-4 text-primary" aria-label={t("compare.yes")} />
                        ) : (
                          <Minus
                            className="h-4 w-4 text-muted-foreground"
                            aria-label={t("compare.no")}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
