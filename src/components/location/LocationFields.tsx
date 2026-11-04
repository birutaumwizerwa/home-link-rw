import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { districtsOf, PROVINCES, provinceOf, sectorsOf } from "@/lib/rwanda-locations";

type Value = { district: string; sector: string; cell?: string };

function Field({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
  error,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value || undefined} disabled={disabled} onValueChange={onChange}>
        <SelectTrigger aria-label={label} aria-invalid={error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Linked province, district, sector and cell pickers for forms. */
export function LocationFields({
  value,
  onChange,
  withCell,
  error,
}: {
  value: Value;
  onChange: (v: Value) => void;
  withCell?: boolean;
  error?: boolean;
}) {
  const { t } = useTranslation();
  const [province, setProvince] = useState(provinceOf(value.district)?.id ?? "");
  const [cells, setCells] = useState<Record<string, Record<string, string[]>> | null>(null);

  useEffect(() => {
    const p = provinceOf(value.district)?.id;
    if (p) setProvince(p);
  }, [value.district]);

  useEffect(() => {
    if (withCell) void import("@/data/rwanda-cells.json").then((m) => setCells(m.default as never));
  }, [withCell]);

  const sectors = sectorsOf(value.district);
  const cellOptions = cells?.[value.district]?.[value.sector] ?? [];
  const toOptions = (l: string[]) => l.map((x) => ({ value: x, label: x }));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field
        label={t("location.province")}
        value={province}
        placeholder={t("location.chooseProvince")}
        options={PROVINCES.map((p) => ({ value: p.id, label: t(`location.provinces.${p.id}`) }))}
        onChange={(v) => {
          setProvince(v);
          onChange({ district: "", sector: "", cell: "" });
        }}
      />
      <Field
        label={t("search.district")}
        value={value.district}
        placeholder={t("auth.selectDistrict")}
        disabled={!province}
        error={error}
        options={toOptions(districtsOf(province))}
        onChange={(v) => onChange({ district: v, sector: "", cell: "" })}
      />
      <Field
        label={t("form.sector")}
        value={sectors.includes(value.sector) ? value.sector : ""}
        placeholder={t("location.chooseSector")}
        disabled={!value.district}
        options={toOptions(sectors)}
        onChange={(v) => onChange({ ...value, sector: v, cell: "" })}
      />
      {withCell && (
        <Field
          label={t("location.cell")}
          value={cellOptions.includes(value.cell ?? "") ? (value.cell as string) : ""}
          placeholder={t("location.chooseCell")}
          disabled={!value.sector}
          options={toOptions(cellOptions)}
          onChange={(v) => onChange({ ...value, cell: v })}
        />
      )}
    </div>
  );
}
