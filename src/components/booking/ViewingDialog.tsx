import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function ViewingDialog({
  open,
  onOpenChange,
  listingId,
  vendorId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  listingId: string;
  vendorId: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"in_person" | "video">("in_person");
  const [when, setWhen] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [months, setMonths] = useState("");
  const [message, setMessage] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("viewing_requests").insert({
        listing_id: listingId,
        client_id: user!.id,
        vendor_id: vendorId,
        preferred_at: new Date(when).toISOString(),
        mode,
        move_in_date: moveIn || null,
        stay_months: months ? Number(months) : null,
        message: message.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("viewing.sent"));
      qc.invalidateQueries({ queryKey: ["viewings"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("viewing.title")}</DialogTitle>
          <DialogDescription>{t("viewing.body")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["in_person", "video"] as const).map((m) => (
              <Button
                key={m}
                type="button"
                aria-pressed={mode === m}
                variant={mode === m ? "default" : "outline"}
                onClick={() => setMode(m)}
              >
                {t(`viewing.mode.${m}`)}
              </Button>
            ))}
          </div>
          <div>
            <Label htmlFor="when">{t("viewing.when")}</Label>
            <Input
              id="when"
              type="datetime-local"
              min={minDate}
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="movein">{t("viewing.moveIn")}</Label>
              <Input
                id="movein"
                type="date"
                value={moveIn}
                onChange={(e) => setMoveIn(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="months">{t("viewing.months")}</Label>
              <Input
                id="months"
                type="number"
                min={1}
                value={months}
                onChange={(e) => setMonths(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="note">{t("viewing.message")}</Label>
            <Textarea
              id="note"
              rows={3}
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!when || submit.isPending} onClick={() => submit.mutate()}>
            {t("viewing.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
