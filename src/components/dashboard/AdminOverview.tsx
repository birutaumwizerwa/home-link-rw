import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DailyBars, RankedBars } from "@/components/charts/ViewsChart";
import { supabase } from "@/integrations/supabase/client";

export function AdminCharts() {
  const { data } = useQuery({
    queryKey: ["admin", "growth"],
    queryFn: async () =>
      (
        await supabase
          .from("listings")
          .select("district, created_at")
          .order("created_at", { ascending: false })
          .limit(5000)
      ).data ?? [],
  });
  const weekly = useMemo(() => {
    const week = 7 * 864e5;
    return Array.from({ length: 12 }, (_, i) => {
      const end = Date.now() - (11 - i) * week;
      const start = end - week;
      return {
        label: new Date(end).toLocaleDateString("en", { day: "numeric", month: "short" }),
        value: (data ?? []).filter((l) => {
          const c = new Date(l.created_at).getTime();
          return c > start && c <= end;
        }).length,
      };
    });
  }, [data]);
  const districts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of data ?? []) m.set(l.district, (m.get(l.district) ?? 0) + 1);
    return [...m]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [data]);
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-bold">New listings per week</h2>
        <DailyBars data={weekly} name="New listings" />
      </section>
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-bold">Listings by district</h2>
        {districts.length ? (
          <RankedBars rows={districts} />
        ) : (
          <p className="text-muted-foreground">No listings yet.</p>
        )}
      </section>
    </div>
  );
}
