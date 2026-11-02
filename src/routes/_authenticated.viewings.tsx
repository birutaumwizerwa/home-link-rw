import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ViewingList } from "@/components/booking/ViewingList";

export const Route = createFileRoute("/_authenticated/viewings")({
  head: () => ({ meta: [{ title: "My viewings | HomeLink Rwanda" }] }),
  component: ViewingsPage,
});

function ViewingsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">{t("nav.viewings")}</h1>
        <ViewingList as="client" />
      </main>
      <Footer />
    </div>
  );
}
