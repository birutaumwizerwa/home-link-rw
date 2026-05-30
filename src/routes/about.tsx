import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Search, ShieldCheck, MessageSquare, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How it works — HomeLink Rwanda" },
      { name: "description", content: "Learn how HomeLink Rwanda connects renters, buyers, landlords and brokers across all 30 districts — safely and directly." },
      { property: "og:title", content: "How it works — HomeLink Rwanda" },
      { property: "og:description", content: "Rwanda's first trusted real estate platform. Search, contact verified vendors, and find your home." },
    ],
    links: [{ rel: "canonical", href: "https://home-link-rw.lovable.app/about" }],
  }),
  component: AboutPage,
});

const steps = [
  { icon: Search, title: "Search & filter", desc: "Browse listings across all 30 Rwanda districts. Filter by price, bedrooms, location and amenities." },
  { icon: ShieldCheck, title: "Trust verified vendors", desc: "Every vendor is reviewed. The verified badge means the vendor has been manually confirmed by our team." },
  { icon: MessageSquare, title: "Contact directly", desc: "Chat in-app or contact via WhatsApp. No middlemen. No hidden fees. Just you and the landlord." },
  { icon: Building2, title: "Find your home", desc: "Rent or buy with confidence. Save favourites, compare options, and move when you're ready." },
];

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        <section className="text-center">
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Rwanda's first trusted<br />real estate platform</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            HomeLink Rwanda connects renters, buyers, landlords and brokers across the country — safely, directly, and for free.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="mb-8 text-center text-2xl font-bold">How it works</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.title} className="rounded-2xl border bg-card p-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Are you a landlord or broker?</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            Post your first 3 listings for free. Reach thousands of verified renters and buyers across Rwanda. No setup fees.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6 rounded-xl">
            <Link to="/auth" search={{ mode: "signup" } as never}>Start posting for free</Link>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
