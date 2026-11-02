import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CalendarClock, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

type Viewing = {
  id: string;
  preferred_at: string;
  mode: string;
  status: string;
  message: string | null;
  stay_months: number | null;
  move_in_date: string | null;
  vendor_id: string;
  listing_id: string;
  listing: { title: string } | null;
  client: { full_name: string } | null;
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-marigold/25 text-ink",
  confirmed: "bg-accent text-accent-foreground",
  declined: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export function ViewingList({ as }: { as: "client" | "vendor" }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["viewings", as, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("viewing_requests")
        .select(
          "*, listing:listings(title), client:profiles!viewing_requests_client_id_fkey(full_name)",
        )
        .eq(as === "client" ? "client_id" : "vendor_id", user!.id)
        .order("preferred_at", { ascending: false });
      return (data ?? []) as unknown as Viewing[];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("viewing_requests").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t(`viewing.status.${status}`));
    qc.invalidateQueries({ queryKey: ["viewings"] });
  };

  if (isLoading) return <div className="h-32 animate-pulse rounded-lg bg-muted" />;
  if (!data?.length)
    return (
      <div className="rounded-lg border border-dashed bg-card p-8 text-center text-muted-foreground">
        {as === "client" ? t("viewing.emptyClient") : t("viewing.emptyVendor")}
      </div>
    );

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {data.map((v) => (
        <li
          key={v.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <Link
              to="/listing/$id"
              params={{ id: v.listing_id }}
              className="font-semibold hover:text-primary"
            >
              {v.listing?.title}
            </Link>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              {v.mode === "video" ? (
                <Video className="h-4 w-4" />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
              {formatDate(v.preferred_at, i18n.resolvedLanguage, true)},{" "}
              {t(`viewing.mode.${v.mode}`)}
            </p>
            {as === "vendor" && (
              <p className="text-sm text-muted-foreground">
                {v.client?.full_name}
                {v.stay_months ? `, ${t("compare.months", { count: v.stay_months })}` : ""}
                {v.move_in_date
                  ? `, ${t("viewing.movingIn", { date: formatDate(v.move_in_date, i18n.resolvedLanguage) })}`
                  : ""}
              </p>
            )}
            {as === "vendor" && v.message && <p className="mt-1 text-sm">{v.message}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded px-2 py-1 text-sm font-medium ${STATUS_CLASS[v.status]}`}>
              {t(`viewing.status.${v.status}`)}
            </span>
            {as === "vendor" && v.status === "pending" && (
              <>
                <Button size="sm" onClick={() => setStatus(v.id, "confirmed")}>
                  {t("viewing.confirm")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(v.id, "declined")}>
                  {t("viewing.decline")}
                </Button>
              </>
            )}
            {as === "client" && ["pending", "confirmed"].includes(v.status) && (
              <Button size="sm" variant="outline" onClick={() => setStatus(v.id, "cancelled")}>
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
