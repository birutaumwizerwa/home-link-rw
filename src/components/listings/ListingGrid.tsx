import { ListingCard, type ListingCardData } from "./ListingCard";

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
