import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/constants";
import { NEIGHBOURHOODS } from "@/lib/neighbourhoods";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data } = await supabase
          .from("listings")
          .select("id, updated_at")
          .eq("is_approved", true)
          .eq("is_available", true)
          .limit(5000);
        const pages = [
          "",
          "/search",
          "/neighbourhoods",
          "/guide",
          "/for-apartments",
          "/about",
          ...NEIGHBOURHOODS.map((n) => `/neighbourhoods/${n.slug}`),
        ];
        const urls = [
          ...pages.map((p) => `<url><loc>${SITE_URL}${p}</loc></url>`),
          ...(data ?? []).map(
            (l) =>
              `<url><loc>${SITE_URL}/listing/${l.id}</loc><lastmod>${l.updated_at.slice(0, 10)}</lastmod></url>`,
          ),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
        return new Response(xml, {
          headers: { "content-type": "application/xml", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
