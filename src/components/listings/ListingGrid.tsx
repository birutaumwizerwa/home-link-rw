import { ListingCard, type ListingCardData } from "./ListingCard";
import { Skeleton } from "@/components/ui/skeleton";

export function ListingGrid({ listings, empty }: { listings: ListingCardData[]; empty?: React.ReactNode }) {
  if (listings.length === 0) {
    return <div className="rounded-xl border bg-muted/30 p-10 text-center text-muted-foreground">{empty ?? "No listings yet."}</div>;
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
