import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LocationFields } from "@/components/location/LocationFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { ListingCardData } from "@/components/listings/ListingCard";

type Draft = {
  name: string;
  district: string;
  sector: string;
  total_units: string;
  description: string;
};
const EMPTY: Draft = { name: "", district: "", sector: "", total_units: "", description: "" };

export function BuildingsTab({ listings }: { listings: ListingCardData[] }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const { data } = useQuery({
    queryKey: ["my-buildings", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("buildings").select("*").eq("vendor_id", user!.id).order("created_at"))
        .data ?? [],
  });

  const save = async () => {
    const { error } = await supabase.from("buildings").insert({
      vendor_id: user!.id,
      name: draft.name.trim(),
      district: draft.district,
      sector: draft.sector.trim() || null,
      total_units: draft.total_units ? Number(draft.total_units) : null,
      description: draft.description.trim() || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("building.added"));
    setDraft(EMPTY);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["my-buildings"] });
  };

  const remove = async (id: string) => {
    if (!confirm(t("building.confirmDelete"))) return;
    const { error } = await supabase.from("buildings").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["my-buildings"] });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("building.intro")}</p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> {t("building.add")}
        </Button>
      </div>
      {!data?.length ? (
        <div className="rounded-lg border border-dashed bg-card p-8 text-center text-muted-foreground">
          {t("building.empty")}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {data.map((b) => {
            const units = listings.filter((l) => l.building_id === b.id);
            const vacant = units.filter((u) => u.is_available).length;
            return (
              <li
                key={b.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    to="/building/$id"
                    params={{ id: b.id }}
                    className="font-semibold hover:text-primary"
                  >
                    {b.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {[b.sector, b.district].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-sm">
                    {t("building.occupancy", { vacant, listed: units.length })}
                    {b.total_units ? `, ${t("building.totalUnits", { count: b.total_units })}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/post-listing">{t("building.addUnit")}</Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t("common.delete")}
                    onClick={() => remove(b.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("building.add")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="bname">{t("building.name")}</Label>
              <Input
                id="bname"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <LocationFields
              value={{ district: draft.district, sector: draft.sector }}
              onChange={(v) => setDraft({ ...draft, district: v.district, sector: v.sector })}
            />
            <div>
              <Label htmlFor="bunits">{t("building.unitsField")}</Label>
              <Input
                id="bunits"
                type="number"
                min={1}
                value={draft.total_units}
                onChange={(e) => setDraft({ ...draft, total_units: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bdesc">{t("listing.description")}</Label>
              <Textarea
                id="bdesc"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={draft.name.trim().length < 2 || !draft.district} onClick={save}>
              {t("building.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
