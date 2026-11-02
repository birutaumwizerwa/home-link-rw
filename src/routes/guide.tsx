import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Moving to Rwanda: a practical housing guide | HomeLink Rwanda" },
      {
        name: "description",
        content:
          "What to know before renting in Rwanda for a few months or longer: leases, deposits, prepaid electricity, mobile money and everyday life.",
      },
    ],
  }),
  component: GuidePage,
});

const EN = [
  {
    h: "Before you arrive",
    p: [
      "Decide on your stay length first. It decides which homes suit you, because many landlords set a minimum stay.",
      "Ask for a video viewing if you are still abroad. On HomeLink you can request one from any listing.",
      "Check entry and residence rules with the Directorate General of Immigration and Emigration at migration.gov.rw, because requirements depend on your nationality and purpose.",
    ],
  },
  {
    h: "Choosing a home",
    p: [
      "Ask whether the rent covers water, electricity, internet, security and cleaning. These costs change the real monthly price.",
      "Check how much water pressure and storage the home has, and whether there is a backup tank.",
      "Visit at different times of day if you can, so you can judge noise and traffic.",
    ],
  },
  {
    h: "Signing a lease",
    p: [
      "Always get a written lease that names the rent, deposit, notice period, and who pays for repairs.",
      "Never send money before you have seen the home in person or on a live video call and confirmed who owns or manages it.",
      "Pay through a method that leaves a record, such as bank transfer or mobile money, and keep the receipts.",
    ],
  },
  {
    h: "Settling in",
    p: [
      "Electricity in most homes is prepaid. You buy tokens, often called Cash Power, through mobile money or a bank app.",
      "Mobile money is widely used for everyday payments. To register a SIM card you will need identification such as your passport.",
      "Many government services are available through Irembo at irembo.gov.rw.",
      "Single-use plastic bags are banned in Rwanda, so bring reusable bags when you shop.",
      "Umuganda, a national community work morning, takes place on the last Saturday of each month. Expect shops and roads to be quiet until around midday.",
    ],
  },
];
const FR = [
  {
    h: "Avant votre arrivée",
    p: [
      "Décidez d'abord de la durée de votre séjour. Elle détermine les logements adaptés, car de nombreux propriétaires fixent une durée minimale.",
      "Demandez une visite vidéo si vous êtes encore à l'étranger. Sur HomeLink, vous pouvez en demander une depuis chaque annonce.",
      "Vérifiez les règles d'entrée et de séjour auprès de la Direction générale de l'immigration et de l'émigration sur migration.gov.rw, car elles dépendent de votre nationalité et de votre motif de séjour.",
    ],
  },
  {
    h: "Choisir un logement",
    p: [
      "Demandez si le loyer comprend l'eau, l'électricité, internet, la sécurité et le ménage. Ces frais changent le coût mensuel réel.",
      "Vérifiez la pression de l'eau et la présence d'un réservoir de secours.",
      "Visitez à différents moments de la journée si possible, pour juger du bruit et de la circulation.",
    ],
  },
  {
    h: "Signer un bail",
    p: [
      "Obtenez toujours un bail écrit qui précise le loyer, la caution, le préavis et la prise en charge des réparations.",
      "N'envoyez jamais d'argent avant d'avoir vu le logement en personne ou par appel vidéo en direct et d'avoir confirmé qui le possède ou le gère.",
      "Payez par un moyen qui laisse une trace, comme un virement ou le mobile money, et conservez les reçus.",
    ],
  },
  {
    h: "Vous installer",
    p: [
      "Dans la plupart des logements, l'électricité est prépayée. Vous achetez des crédits, souvent appelés Cash Power, par mobile money ou application bancaire.",
      "Le mobile money est très utilisé au quotidien. Pour enregistrer une carte SIM, vous aurez besoin d'une pièce d'identité comme votre passeport.",
      "De nombreux services publics sont disponibles sur Irembo : irembo.gov.rw.",
      "Les sacs plastiques à usage unique sont interdits au Rwanda : prévoyez des sacs réutilisables.",
      "L'Umuganda, matinée nationale de travaux communautaires, a lieu le dernier samedi de chaque mois. Les commerces et les routes restent calmes jusqu'à midi environ.",
    ],
  },
];

function GuidePage() {
  const { t, i18n } = useTranslation();
  const sections = i18n.resolvedLanguage === "fr" ? FR : EN;
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold">{t("guide.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("guide.subtitle")}</p>
        {sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="text-2xl font-bold">{s.h}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground">
              {s.p.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>
        ))}
        <Button asChild className="mt-8">
          <Link to="/search" search={{ stay: "medium" }}>
            {t("guide.cta")}
          </Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
