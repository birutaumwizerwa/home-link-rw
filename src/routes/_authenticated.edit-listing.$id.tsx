import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ListingForm, type ExistingListing } from "@/components/listings/ListingForm";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/edit-listing/$id")({
  head: () => ({ meta: [{ title: "Edit listing | HomeLink Rwanda" }] }),
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["listing-edit", id],
    queryFn: async () =>
      (
        await supabase
          .from("listings")
          .select("*, images:listing_images(image_url, sort_order)")
          .eq("id", id)
          .eq("vendor_id", user!.id)
          .maybeSingle()
      ).data as unknown as ExistingListing | null,
  });
  return (
    <div className="flex flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">{t("form.editTitle")}</h1>
        {isLoading ? (
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        ) : data ? (
          <ListingForm key={data.id} mode="edit" existing={data} />
        ) : (
          <p>{t("listing.notFound")}</p>
        )}
      </main>
    </div>
  );
}
