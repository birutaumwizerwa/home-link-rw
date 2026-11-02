import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard, type ListingCardData } from "./ListingCard";

export function ListingGrid({
  listings,
  empty,
  withSidebar,
}: {
  listings: ListingCardData[];
  empty?: React.ReactNode;
  withSidebar?: boolean;
}) {
  const { t } = useTranslation();
  if (listings.length === 0) {
    if (empty === "") return null;
    return (
      <div className="rounded-lg border border-dashed bg-card px-6 py-14 text-center">
        <h3 className="text-lg font-semibold">{t("grid.emptyTitle")}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {empty ?? t("grid.emptyBody")}
        </p>
      </div>
    );
  }
  return (
    <div
      className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${withSidebar ? "xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"}`}
    >
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border bg-card">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
