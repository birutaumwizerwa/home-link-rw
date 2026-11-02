import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/BottomNav";
import { CompareBar } from "@/components/CompareBar";
import { AuthProvider } from "@/hooks/use-auth";
import i18n, { applySavedLanguage } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This address has no page. It may have moved, or the listing may have been removed.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HomeLink Rwanda: homes for rent and sale" },
      {
        name: "description",
        content:
          "Find homes, apartments and medium to long-stay rentals across Rwanda. Compare listings, book viewings and contact landlords directly.",
      },
      { property: "og:title", content: "HomeLink Rwanda" },
      {
        property: "og:description",
        content: "Find homes, apartments and medium to long-stay rentals across Rwanda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Figtree:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClientPreferences />
        <CacheInvalidator queryClient={queryClient} />
        <Outlet />
        <BottomNav />
        <CompareBar />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function ClientPreferences() {
  const hydrate = useAppStore((s) => s.hydrate);
  useEffect(() => {
    // Wait for lazy route chunks to hydrate before changing any rendered text.
    const timer = setTimeout(() => {
      hydrate();
      applySavedLanguage();
    }, 150);
    const setLang = (lng: string) => {
      document.documentElement.lang = lng;
    };
    setLang(i18n.resolvedLanguage ?? "en");
    i18n.on("languageChanged", setLang);
    return () => {
      clearTimeout(timer);
      i18n.off("languageChanged", setLang);
    };
  }, [hydrate]);
  return null;
}

function CacheInvalidator({ queryClient }: { queryClient: QueryClient }) {
  const router = useRouter();
  useEffect(() => {
    // Lazy import to avoid SSR window issues
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        router.invalidate();
        queryClient.invalidateQueries();
      });
      return () => subscription.unsubscribe();
    });
  }, [router, queryClient]);
  return null;
}
