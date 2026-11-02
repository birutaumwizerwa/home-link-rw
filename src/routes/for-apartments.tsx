import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Building2,
  CalendarCheck,
  Copy,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/for-apartments")({
  head: () => ({
    meta: [
      { title: "For apartment buildings and agencies | HomeLink Rwanda" },
      {
        name: "description",
        content:
          "Manage every building and unit in one account. Publish vacancies, handle viewing requests and message tenants on HomeLink Rwanda.",
      },
    ],
  }),
  component: ForApartments,
});

function ForApartments() {
  const { t } = useTranslation();
  const { isVendor } = useAuth();
  const items = [
    { icon: Building2, key: "buildings" },
    { icon: Copy, key: "units" },
    { icon: CalendarCheck, key: "viewings" },
    { icon: MessageSquare, key: "messages" },
    { icon: BarChart3, key: "stats" },
    { icon: ShieldCheck, key: "trust" },
  ];
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            {t("apartments.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/85">{t("apartments.subtitle")}</p>
          <Button asChild variant="secondary" size="lg" className="mt-6">
            {isVendor ? (
              <Link to="/dashboard">{t("apartments.openDashboard")}</Link>
            ) : (
              <Link to="/auth" search={{ mode: "signup" }}>
                {t("apartments.start")}
              </Link>
            )}
          </Button>
        </div>
      </section>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {items.map((i) => (
            <div key={i.key} className="flex gap-3">
              <i.icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-bold">{t(`apartments.${i.key}Title`)}</h2>
                <p className="mt-1 text-muted-foreground">{t(`apartments.${i.key}Body`)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
