import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CONTACT_EMAIL } from "@/lib/constants";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of use | HomeLink Rwanda" }] }),
  component: Terms,
});

const SECTIONS: [string, string][] = [
  [
    "What HomeLink does",
    "HomeLink Rwanda is a marketplace that connects people looking for property with landlords, brokers and apartment operators. We are not a party to any lease or sale, and we do not own or manage the properties listed.",
  ],
  [
    "Your account",
    "You must give accurate information and keep your password private. You are responsible for what happens under your account. We may suspend accounts that break these terms.",
  ],
  [
    "Listings",
    "Vendors must have the right to advertise a property and must describe it honestly, including its price and availability. Listings are reviewed before they appear, and we may remove any listing. Review does not guarantee that a listing is accurate.",
  ],
  [
    "Staying safe",
    "See a property, in person or on a live video call, and confirm who owns or manages it before you pay anything. Report suspicious listings using the report link on the listing.",
  ],
  [
    "Prices and currencies",
    "Prices are set by vendors in Rwandan francs. Amounts shown in other currencies are estimates for your convenience, and the amount you pay is agreed with the vendor.",
  ],
  [
    "Paid plans",
    "Paid plans give vendors extra listings and visibility for the period shown when you buy. Fees are shown before you pay.",
  ],
  [
    "Acceptable use",
    "Do not post false, unlawful or discriminatory content, harass other users, or try to get around the platform's security.",
  ],
  [
    "Liability",
    "We provide HomeLink as it is. To the extent the law allows, we are not responsible for disputes or losses between users.",
  ],
  ["Governing law", "These terms are governed by the laws of the Republic of Rwanda."],
  ["Contact", `Questions about these terms can be sent to ${CONTACT_EMAIL}.`],
];

function Terms() {
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold">Terms of use</h1>
        {SECTIONS.map(([h, p]) => (
          <section key={h} className="mt-6">
            <h2 className="text-xl font-bold">{h}</h2>
            <p className="mt-1 leading-relaxed text-muted-foreground">{p}</p>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
