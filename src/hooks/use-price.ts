import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, formatPrice } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

/** Prices are stored in RWF. Other currencies are a display-only conversion. */
export function usePrice() {
  const currency = useAppStore((s) => s.currency);
  const { data: rates } = useQuery({
    queryKey: ["exchange-rates"],
    staleTime: 60 * 60 * 1000,
    enabled: currency !== "RWF",
    queryFn: async () =>
      (await supabase.from("exchange_rates").select("currency, rwf_per_unit")).data ?? [],
  });

  const convert = useCallback(
    (rwf: number | string): { main: string; rwf: string; converted: boolean } => {
      const amount = Number(rwf);
      const rate = rates?.find((r) => r.currency === currency)?.rwf_per_unit;
      if (currency === "RWF" || !rate)
        return { main: formatPrice(amount), rwf: formatPrice(amount), converted: false };
      return {
        main: `≈ ${formatMoney(amount / Number(rate), currency)}`,
        rwf: formatPrice(amount),
        converted: true,
      };
    },
    [rates, currency],
  );

  return { convert, currency };
}
