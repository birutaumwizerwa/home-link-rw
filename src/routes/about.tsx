import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How HomeLink Rwanda works" },
      {
        name: "description",
        content:
          "How renters, buyers, landlords and apartment operators use HomeLink Rwanda to find and fill homes safely.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold">{t("about.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("about.subtitle")}</p>
        <ol className="mt-8 space-y-6">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="grid grid-cols-[2.5rem_1fr] gap-2">
              <span className="font-display text-2xl font-bold text-primary">{n}</span>
              <div>
                <h2 className="text-xl font-bold">{t(`about.step${n}Title`)}</h2>
                <p className="mt-1 text-muted-foreground">{t(`about.step${n}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
        <section className="mt-10 border-t pt-6">
          <h2 className="text-2xl font-bold">{t("about.verifiedTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("about.verifiedBody")}</p>
        </section>
        <Button asChild className="mt-8">
          <Link to="/search">{t("listing.searchHomes")}</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
