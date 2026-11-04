import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle } from "lucide-react";
import { DailyBars, RankedBars } from "@/components/charts/ViewsChart";
import type { ListingCardData } from "@/components/listings/ListingCard";
import { ViewingList } from "@/components/booking/ViewingList";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FREE_POST_LIMIT } from "@/lib/constants";

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-card p-4">
      <div className="font-display text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {note && <div className="mt-1 text-sm">{note}</div>}
    </div>
  );
}

export function OverviewTab({
  listings,
  whatsapp,
  verified,
}: {
  listings: ListingCardData[];
  whatsapp: boolean;
  verified: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [range, setRange] = useState<7 | 30>(30);

  const { data: days } = useQuery({
    queryKey: ["view-days", user?.id, listings.length],
    enabled: listings.length > 0,
    queryFn: async () => {
      const since = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("listing_view_days")
        .select("listing_id, day, views")
        .in(
          "listing_id",
          listings.map((l) => l.id),
        )
        .gte("day", since);
      return data ?? [];
    },
  });
  const { data: pendingViewings } = useQuery({
    queryKey: ["viewings", "pending-count", user?.id],
    queryFn: async () =>
      (
        await supabase
          .from("viewing_requests")
          .select("id", { count: "exact", head: true })
          .eq("vendor_id", user!.id)
          .eq("status", "pending")
      ).count ?? 0,
  });
  const { data: rating } = useQuery({
    queryKey: ["my-rating", user?.id],
    queryFn: async () =>
      (
        await supabase
          .from("vendor_ratings")
          .select("average_rating, review_count")
          .eq("vendor_id", user!.id)
          .maybeSingle()
      ).data,
  });

  const series = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of days ?? []) totals.set(d.day, (totals.get(d.day) ?? 0) + d.views);
    return Array.from({ length: range }, (_, i) => {
      const date = new Date(Date.now() - (range - 1 - i) * 864e5);
      const key = date.toISOString().slice(0, 10);
      return {
        label: date.toLocaleDateString(
          i18n.resolvedLanguage === "rw" ? "en" : i18n.resolvedLanguage,
          { day: "numeric", month: "short" },
        ),
        value: totals.get(key) ?? 0,
      };
    });
  }, [days, range, i18n.resolvedLanguage]);

  const periodViews = series.reduce((s, d) => s + d.value, 0);
  const prior = useMemo(() => {
    const start = Date.now() - 2 * range * 864e5,
      end = Date.now() - range * 864e5;
    return (days ?? [])
      .filter((d) => {
        const t2 = new Date(d.day).getTime();
        return t2 >= start && t2 < end;
      })
      .reduce((s, d) => s + d.views, 0);
  }, [days, range]);
  const change = prior > 0 ? Math.round(((periodViews - prior) / prior) * 100) : null;

  const live = listings.filter((l) => l.is_approved && l.is_available).length;
  const review = listings.filter((l) => !l.is_approved).length;
  const vacancy = listings.length
    ? Math.round((listings.filter((l) => l.is_available).length / listings.length) * 100)
    : 0;
  const top = [...listings]
    .sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0))
    .slice(0, 5)
    .map((l) => ({ label: l.title, value: l.views_count ?? 0 }));

  const steps = [
    { done: whatsapp, label: t("dash.startWhatsapp"), tab: "profile" },
    {
      done: listings.length > 0,
      label: t("dash.startListing", { count: FREE_POST_LIMIT }),
      to: "/post-listing",
    },
    { done: verified, label: t("dash.startVerify"), tab: "plan" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      {doneCount < steps.length && (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-bold">{t("dash.startTitle")}</h2>
          <Progress value={(doneCount / steps.length) * 100} className="mt-2" />
          <ul className="mt-3 space-y-2">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                {s.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {s.done ? (
                  <span className="text-muted-foreground line-through">{s.label}</span>
                ) : (
                  <Link
                    to={s.to ?? "/dashboard"}
                    search={(s.tab ? { tab: s.tab } : {}) as never}
                    className="font-medium hover:text-primary"
                  >
                    {s.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
        <Stat
          label={t("dash.live")}
          value={String(live)}
          note={review ? t("dash.reviewNote", { count: review }) : undefined}
        />
        <Stat
          label={t("dash.viewsPeriod", { days: range })}
          value={periodViews.toLocaleString()}
          note={
            change === null
              ? undefined
              : t("dash.change", { value: `${change > 0 ? "+" : ""}${change}%` })
          }
        />
        <Stat label={t("dash.viewingRequests")} value={String(pendingViewings ?? 0)} />
        <Stat
          label={t("dash.rating")}
          value={rating ? String(rating.average_rating) : "–"}
          note={rating ? t("dash.reviewCount", { count: rating.review_count }) : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t("dash.viewsOverTime")}</h2>
            <div className="flex gap-1">
              {([7, 30] as const).map((r) => (
                <Button
                  key={r}
                  size="sm"
                  aria-pressed={range === r}
                  variant={range === r ? "default" : "outline"}
                  onClick={() => setRange(r)}
                >
                  {t("dash.days", { days: r })}
                </Button>
              ))}
            </div>
          </div>
          {periodViews === 0 ? (
            <p className="grid h-[220px] place-items-center text-center text-muted-foreground">
              {t("dash.noViews")}
            </p>
          ) : (
            <DailyBars data={series} name={t("dash.views")} />
          )}
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-lg font-bold">{t("dash.topListings")}</h2>
          {top.length ? (
            <RankedBars rows={top} />
          ) : (
            <p className="text-muted-foreground">{t("dash.noListings")}</p>
          )}
          {listings.length > 0 && (
            <p className="mt-4 border-t pt-3 text-sm text-muted-foreground">
              {t("dash.vacancy", { value: vacancy })}
            </p>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("app.viewingRequests")}</h2>
        <ViewingList as="vendor" limit={4} />
      </section>
    </div>
  );
}
