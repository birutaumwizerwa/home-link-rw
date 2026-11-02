import { useTranslation } from "react-i18next";
import { usePrice } from "@/hooks/use-price";

export function Price({
  value,
  period,
  size = "md",
}: {
  value: number | string;
  period?: string | null;
  size?: "md" | "lg";
}) {
  const { t } = useTranslation();
  const { convert } = usePrice();
  const p = convert(value);
  const suffix =
    period === "monthly" ? t("price.perMonth") : period === "yearly" ? t("price.perYear") : "";
  return (
    <div>
      <span
        className={`font-display font-bold text-foreground ${size === "lg" ? "text-3xl" : "text-xl"}`}
      >
        {p.main}
      </span>
      {suffix && <span className="ml-1 text-sm text-muted-foreground">{suffix}</span>}
      {p.converted && <div className="text-xs text-muted-foreground">{p.rwf}</div>}
    </div>
  );
}
