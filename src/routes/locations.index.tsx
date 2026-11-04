import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { PROVINCES } from "@/lib/rwanda-locations";

export const Route = createFileRoute("/locations/")({
  head: () => ({
    meta: [
      { title: "Homes in every district of Rwanda | HomeLink Rwanda" },
      {
        name: "description",
        content: "Browse homes across Rwanda's 5 provinces, 30 districts and 416 sectors.",
      },
    ],
  }),
  component: LocationsPage,
});

function LocationsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const { data: counts } = useQuery({
    queryKey: ["district-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("district")
        .eq("is_approved", true)
        .eq("is_available", true)
        .limit(5000);
      const m: Record<string, number> = {};
      for (const l of data ?? []) m[l.district] = (m[l.district] ?? 0) + 1;
      return m;
    },
  });

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold">{t("location.title")}</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{t("location.subtitle")}</p>
        <Input
          className="mt-5 h-11 max-w-md"
          aria-label={t("location.filter")}
          placeholder={t("location.filter")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {PROVINCES.map((p) => {
          const districts = p.districts.filter(
            (d) =>
              !term ||
              d.name.toLowerCase().includes(term) ||
              d.sectors.some((s) => s.toLowerCase().includes(term)),
          );
          if (!districts.length) return null;
          return (
            <section key={p.id} className="mt-10">
              <h2 className="mb-3 border-b pb-2 text-2xl font-bold">
                {t(`location.provinces.${p.id}`)}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {districts.map((d) => (
                  <li key={d.name}>
                    <Link
                      to="/locations/$district"
                      params={{ district: d.name.toLowerCase() }}
                      className="block rounded-lg border bg-card p-4 hover:border-primary"
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-display text-lg font-bold">{d.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {t("search.results", { count: counts?.[d.name] ?? 0 })}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {t("location.sectorCount", { count: d.sectors.length })}
                      </span>
                      {term && (
                        <span className="mt-1 block text-sm">
                          {d.sectors.filter((s) => s.toLowerCase().includes(term)).join(", ")}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
      <Footer />
    </div>
  );
}
