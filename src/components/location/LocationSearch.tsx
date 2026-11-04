import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchPlaces, type Place } from "@/lib/rwanda-locations";

/** A search box that suggests matching districts and sectors while typing. */
export function LocationSearch({
  value,
  onChange,
  onPick,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (p: Place) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const places = open ? searchPlaces(value) : [];

  const pick = (p: Place) => {
    onChange(p.label);
    setOpen(false);
    setActive(-1);
    onPick(p);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!places.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % places.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? places.length - 1 : a - 1));
    }
    if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(places[active]);
    }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        role="combobox"
        aria-expanded={places.length > 0}
        aria-controls={id}
        aria-autocomplete="list"
        autoComplete="off"
        aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
        aria-label={t("home.searchPlaceholder")}
        placeholder={t("home.searchPlaceholder")}
        className="h-11 pl-9"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {places.length > 0 && (
        <ul
          id={id}
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border bg-popover py-1 text-foreground shadow-card-hover"
        >
          {places.map((p, i) => (
            <li
              key={`${p.district}-${p.sector ?? ""}`}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 ${i === active ? "bg-accent" : "hover:bg-muted"}`}
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block font-medium">{p.label}</span>
                <span className="block truncate text-sm text-muted-foreground">{p.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
