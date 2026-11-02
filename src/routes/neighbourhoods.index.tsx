import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { NEIGHBOURHOODS, neighbourhoodText } from "@/lib/neighbourhoods";

export const Route = createFileRoute("/neighbourhoods/")({
  head: () => ({
    meta: [
      { title: "Where to live in Rwanda: neighbourhood guides | HomeLink Rwanda" },
      {
        name: "description",
        content:
          "Guides to Kigali neighbourhoods and towns across Rwanda: who each area suits and what is nearby.",
      },
    ],
  }),
  component: NeighbourhoodsPage,
});

function NeighbourhoodsPage() {
  const { t, i18n } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold">{t("area.title")}</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{t("area.subtitle")}</p>
        <ul className="mt-8 divide-y border-y">
          {NEIGHBOURHOODS.map((n) => {
            const c = neighbourhoodText(n, i18n.resolvedLanguage);
            return (
              <li key={n.slug}>
                <Link
                  to="/neighbourhoods/$slug"
                  params={{ slug: n.slug }}
                  className="grid gap-1 py-4 hover:text-primary md:grid-cols-[220px_1fr]"
                >
                  <span>
                    <span className="block font-display text-xl font-bold">{n.name}</span>
                    <span className="text-sm text-muted-foreground">{n.city}</span>
                  </span>
                  <span className="text-muted-foreground">{c.summary}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
