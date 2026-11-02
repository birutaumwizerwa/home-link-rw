import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CONTACT_EMAIL } from "@/lib/constants";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy policy | HomeLink Rwanda" }] }),
  component: Privacy,
});

const SECTIONS: [string, string][] = [
  [
    "What we collect",
    "Your name, email address, phone number and district; the listings, messages, viewing requests and reviews you create; and basic technical data needed to run the service.",
  ],
  [
    "How we use it",
    "To run your account, show your listings, connect you with other users, keep the platform safe, and respond to support requests.",
  ],
  [
    "What other people see",
    "Your name and photo can appear to other users. A vendor's WhatsApp number is shown to signed-in users. Your own phone number is not shown publicly. When you request a viewing, the vendor sees the details you enter.",
  ],
  [
    "Who we share it with",
    "Service providers that host our database, sign-in and maps. We do not sell your personal data. We may disclose data when the law requires it.",
  ],
  [
    "Keeping it",
    "We keep your data while your account is active and as long as needed to meet legal obligations.",
  ],
  [
    "Your rights",
    `You can ask to see, correct or delete your personal data by writing to ${CONTACT_EMAIL}. Rwanda's Law No. 058/2021 on the protection of personal data and privacy applies to how we handle your data.`,
  ],
  [
    "Browser storage",
    "We store your language, currency and comparison list in your browser so the site remembers your choices, and we use a session token to keep you signed in.",
  ],
];

function Privacy() {
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold">Privacy policy</h1>
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
