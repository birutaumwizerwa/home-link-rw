import { ListingCard, type ListingCardData } from "./ListingCard";
import { Skeleton } from "@/components/ui/skeleton";

export function ListingGrid({ listings, empty }: { listings: ListingCardData[]; empty?: React.ReactNode }) {
  if (listings.length === 0) {
    if (empty === "") return null;
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-4xl">🏠</div>
        <h3 className="text-lg font-semibold">No listings found</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{empty ?? "No listings match your search. Try adjusting your filters."}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
