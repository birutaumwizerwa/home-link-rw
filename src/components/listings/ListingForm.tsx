import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { LocationFields } from "@/components/location/LocationFields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  AMENITIES,
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  LISTING_TYPES,
  PRICE_PERIODS,
  PROPERTY_TYPES,
} from "@/lib/constants";
import {
  compressImage,
  formatBytes,
  LISTING_PHOTO,
  MAX_ORIGINAL_BYTES,
} from "@/lib/compress-image";
import { stripPhoneNumbers } from "@/lib/format";

const emptyToNull = (v: unknown) => (v === "" || v == null ? null : Number(v));

const schema = z.object({
  title: z.string().trim().min(5).max(120),
  listing_type: z.enum(["rent", "sale"]),
  property_type: z.enum(["house", "villa", "apartment", "studio", "room", "commercial"]),
  bedrooms: z.coerce.number().min(0).max(20),
  bathrooms: z.coerce.number().min(1).max(20),
  size_sqm: z.preprocess(emptyToNull, z.number().min(1).nullable()),
  price: z.coerce.number().min(1),
  price_period: z.enum(["monthly", "yearly", "fixed"]),
  district: z.string().min(1),
  sector: z.string().trim().max(80).optional(),
  cell: z.string().trim().max(80).optional(),
  address_details: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  is_available: z.boolean(),
  amenities: z.record(z.string(), z.boolean()),
  building_id: z.string().nullable(),
  unit_label: z.string().trim().max(40).optional(),
  min_stay_months: z.preprocess(emptyToNull, z.number().int().min(1).nullable()),
  deposit_months: z.preprocess(emptyToNull, z.number().min(0).nullable()),
  available_from: z.string().optional(),
  utilities_included: z.boolean(),
  english_lease: z.boolean(),
  video_url: z.string().trim().url().max(300).optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;

const MAX_IMAGES = 10;

export type ExistingListing = Partial<Values> &
  Record<string, unknown> & {
    id: string;
    cover_image_url?: string | null;
    images?: { image_url: string; sort_order: number }[];
  };

export function ListingForm({
  existing,
  mode,
}: {
  existing?: ExistingListing;
  mode: "create" | "edit" | "duplicate";
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [kept, setKept] = useState<string[]>(() =>
    [...(existing?.images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.image_url),
  );

  const { data: buildings } = useQuery({
    queryKey: ["my-buildings", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("buildings")
          .select("id, name, district, sector, cell")
          .eq("vendor_id", user!.id)
          .order("name")
      ).data ?? [],
  });

  const defaults = useMemo<Values>(() => {
    const textFields = [
      "sector",
      "cell",
      "address_details",
      "description",
      "unit_label",
      "available_from",
      "video_url",
    ] as const;
    const clean = { ...(existing as Partial<Values> | undefined) };
    for (const f of textFields) if (clean[f] == null) delete clean[f];
    return {
      title: "",
      listing_type: "rent",
      property_type: "apartment",
      bedrooms: 1,
      bathrooms: 1,
      size_sqm: null,
      price: 0,
      price_period: "monthly",
      district: "",
      sector: "",
      cell: "",
      address_details: "",
      description: "",
      is_available: true,
      building_id: null,
      unit_label: "",
      min_stay_months: null,
      deposit_months: null,
      available_from: "",
      utilities_included: false,
      english_lease: false,
      video_url: "",
      ...clean,
      amenities: Object.fromEntries(AMENITIES.map((a) => [a.key, !!existing?.[a.key]])),
    };
  }, [existing]);

  const form = useForm<Values>({ resolver: zodResolver(schema) as never, defaultValues: defaults });
  const err = form.formState.errors;
  const { register, watch, setValue } = form;

  const onFiles = (selected: FileList | null) => {
    if (!selected) return;
    const all = Array.from(selected);
    const ok = all.filter(
      (f) => /^image\/(png|jpeg|jpg|webp)$/.test(f.type) && f.size <= MAX_ORIGINAL_BYTES,
    );
    if (ok.length < all.length) toast.error(t("form.photoRejected"));
    setFiles((prev) => [...prev, ...ok].slice(0, MAX_IMAGES - kept.length));
  };

  const chooseBuilding = (id: string) => {
    const buildingId = id === "none" ? null : id;
    setValue("building_id", buildingId);
    const b = buildings?.find((x) => x.id === buildingId);
    if (b) {
      setValue("district", b.district, { shouldValidate: true });
      setValue("sector", b.sector ?? "");
      setValue("cell", b.cell ?? "");
    }
  };

  const submit = async (v: Values) => {
    if (!user) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      let before = 0;
      let after = 0;
      for (const [i, original] of files.entries()) {
        setProgress(t("form.compressing", { current: i + 1, total: files.length }));
        const f = await compressImage(original, LISTING_PHOTO);
        before += original.size;
        after += f.size;
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name}`;
        const { error } = await supabase.storage
          .from("listing-images")
          .upload(path, f, { contentType: f.type, upsert: false });
        if (error) throw error;
        uploaded.push(supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl);
      }
      setProgress(null);
      if (files.length > 0)
        toast.success(
          t("form.compressed", { before: formatBytes(before), after: formatBytes(after) }),
        );
      const gallery = [...kept, ...uploaded];
      const payload = {
        vendor_id: user.id,
        title: stripPhoneNumbers(v.title),
        description: stripPhoneNumbers(v.description ?? ""),
        listing_type: v.listing_type,
        property_type: v.property_type,
        price: v.price,
        price_period: v.listing_type === "sale" ? ("fixed" as const) : v.price_period,
        bedrooms: v.bedrooms,
        bathrooms: v.bathrooms,
        size_sqm: v.size_sqm,
        district: v.district,
        sector: v.sector || null,
        cell: v.cell || null,
        address_details: v.address_details || null,
        is_available: v.is_available,
        cover_image_url: gallery[0] ?? null,
        building_id: v.building_id,
        unit_label: v.unit_label || null,
        min_stay_months: v.min_stay_months,
        deposit_months: v.deposit_months,
        available_from: v.available_from || null,
        utilities_included: v.utilities_included,
        english_lease: v.english_lease,
        video_url: v.video_url || null,
        ...Object.fromEntries(AMENITIES.map((a) => [a.key, !!v.amenities[a.key]])),
      };

      let listingId = existing?.id;
      if (mode === "edit" && listingId) {
        const { error } = await supabase.from("listings").update(payload).eq("id", listingId);
        if (error) throw error;
        await supabase.from("listing_images").delete().eq("listing_id", listingId);
      } else {
        const { data, error } = await supabase
          .from("listings")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        listingId = data.id;
      }
      if (gallery.length > 0) {
        const { error } = await supabase
          .from("listing_images")
          .insert(
            gallery.map((url, i) => ({ listing_id: listingId!, image_url: url, sort_order: i })),
          );
        if (error) throw error;
      }
      toast.success(mode === "edit" ? t("form.saved") : t("form.submitted"));
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      qc.invalidateQueries({ queryKey: ["vendor"] });
      navigate({ to: "/dashboard", search: { tab: "listings" } });
    } catch (e) {
      const message = (e as Error).message;
      toast.error(message.includes("limit") ? t("form.limitReached") : message);
    } finally {
      setProgress(null);
      setBusy(false);
    }
  };

  const type = watch("listing_type");

  return (
    <form
      onSubmit={form.handleSubmit(submit, () => toast.error(t("form.fixErrors")))}
      className="space-y-8 rounded-lg border bg-card p-5 sm:p-6"
    >
      {(buildings?.length ?? 0) > 0 && (
        <Section title={t("form.building")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Picker
              label={t("form.partOfBuilding")}
              value={watch("building_id") ?? "none"}
              onChange={chooseBuilding}
              options={[
                { value: "none", label: t("form.standalone") },
                ...(buildings ?? []).map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
            <div>
              <Label htmlFor="unit">{t("form.unitLabel")}</Label>
              <Input id="unit" placeholder="B-204" {...register("unit_label")} />
            </div>
          </div>
        </Section>
      )}

      <Section title={t("form.basics")}>
        <div>
          <Label htmlFor="title">{t("form.title")}</Label>
          <Input id="title" aria-invalid={!!err.title} {...register("title")} />
          {err.title && <p className="mt-1 text-sm text-destructive">{t("form.titleError")}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Picker
            label={t("form.listingType")}
            value={type}
            onChange={(v) => setValue("listing_type", v as Values["listing_type"])}
            options={LISTING_TYPES.map((o) => ({
              value: o.value,
              label: o.value === "rent" ? t("home.filterRent") : t("home.filterSale"),
            }))}
          />
          <Picker
            label={t("search.type")}
            value={watch("property_type")}
            onChange={(v) => setValue("property_type", v as Values["property_type"])}
            options={PROPERTY_TYPES.map((o) => ({
              value: o.value,
              label: t(`property.${o.value}`),
            }))}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Picker
            label={t("search.bedrooms")}
            value={String(watch("bedrooms"))}
            onChange={(v) => setValue("bedrooms", Number(v))}
            options={BEDROOM_OPTIONS.map((o) => ({
              value: String(o.value),
              label: o.value === 0 ? t("card.studio") : o.label,
            }))}
          />
          <Picker
            label={t("compare.bathrooms")}
            value={String(watch("bathrooms"))}
            onChange={(v) => setValue("bathrooms", Number(v))}
            options={BATHROOM_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
          />
          <div>
            <Label htmlFor="size">{t("form.size")}</Label>
            <Input id="size" type="number" min={1} {...register("size_sqm")} />
          </div>
        </div>
      </Section>

      <Section title={t("form.pricing")}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="price">{t("form.price")}</Label>
            <Input
              id="price"
              type="number"
              min={1}
              aria-invalid={!!err.price}
              {...register("price")}
            />
            {err.price && <p className="mt-1 text-sm text-destructive">{t("form.priceError")}</p>}
          </div>
          {type === "rent" && (
            <Picker
              label={t("form.period")}
              value={watch("price_period")}
              onChange={(v) => setValue("price_period", v as Values["price_period"])}
              options={PRICE_PERIODS.filter((o) => o.value !== "fixed").map((o) => ({
                value: o.value,
                label: o.value === "monthly" ? t("form.perMonth") : t("form.perYear"),
              }))}
            />
          )}
        </div>
      </Section>

      {type === "rent" && (
        <Section title={t("listing.stayTerms")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="min">{t("compare.minStay")}</Label>
              <Input
                id="min"
                type="number"
                min={1}
                placeholder={t("form.monthsHint")}
                {...register("min_stay_months")}
              />
            </div>
            <div>
              <Label htmlFor="dep">{t("form.depositMonths")}</Label>
              <Input id="dep" type="number" min={0} step="0.5" {...register("deposit_months")} />
            </div>
            <div>
              <Label htmlFor="from">{t("form.availableFrom")}</Label>
              <Input id="from" type="date" {...register("available_from")} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <Checkbox
                checked={watch("utilities_included")}
                onCheckedChange={(c) => setValue("utilities_included", !!c)}
              />{" "}
              {t("listing.utilitiesIncluded")}
            </label>
            <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <Checkbox
                checked={watch("english_lease")}
                onCheckedChange={(c) => setValue("english_lease", !!c)}
              />{" "}
              {t("listing.englishLease")}
            </label>
          </div>
        </Section>
      )}

      <Section title={t("listing.location")}>
        <LocationFields
          withCell
          error={!!err.district}
          value={{
            district: watch("district"),
            sector: watch("sector") ?? "",
            cell: watch("cell") ?? "",
          }}
          onChange={(v) => {
            setValue("district", v.district, { shouldValidate: true });
            setValue("sector", v.sector);
            setValue("cell", v.cell ?? "");
          }}
        />
        {err.district && <p className="text-sm text-destructive">{t("form.districtError")}</p>}
      </Section>

      <Section title={t("listing.amenities")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES.map((a) => (
            <label key={a.key} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
              <Checkbox
                checked={!!watch(`amenities.${a.key}`)}
                onCheckedChange={(c) => setValue(`amenities.${a.key}`, !!c)}
              />{" "}
              {t(`amenity.${a.key}`)}
            </label>
          ))}
        </div>
      </Section>

      <Section title={t("listing.description")}>
        <Textarea
          rows={5}
          aria-label={t("listing.description")}
          placeholder={t("form.descriptionHint")}
          {...register("description")}
        />
      </Section>

      <Section title={t("form.photos")}>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 hover:bg-muted/50">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="mt-2 text-center text-sm">
            {t("form.photoHint", { count: MAX_IMAGES })}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
        {kept.length + files.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {kept.map((url, i) => (
              <Thumb
                key={url}
                src={url}
                cover={i === 0}
                label={t("form.cover")}
                remove={t("form.removePhoto")}
                onRemove={() => setKept((p) => p.filter((x) => x !== url))}
              />
            ))}
            {files.map((f, i) => (
              <Thumb
                key={`${f.name}-${i}`}
                src={URL.createObjectURL(f)}
                cover={kept.length === 0 && i === 0}
                label={t("form.cover")}
                remove={t("form.removePhoto")}
                onRemove={() => setFiles((p) => p.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title={t("form.videoTour")}>
        <div>
          <Label htmlFor="video">{t("form.videoLink")}</Label>
          <Input
            id="video"
            type="url"
            placeholder="https://"
            aria-invalid={!!err.video_url}
            {...register("video_url")}
          />
          {err.video_url && <p className="mt-1 text-sm text-destructive">{t("form.videoError")}</p>}
        </div>
      </Section>

      <label className="flex items-center justify-between rounded-md border p-3 text-sm">
        <span>{t("form.availableNow")}</span>
        <Switch
          checked={watch("is_available")}
          onCheckedChange={(v) => setValue("is_available", v)}
        />
      </label>

      {mode === "edit" && <p className="text-sm text-muted-foreground">{t("form.reviewNote")}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy
          ? (progress ?? t("form.saving"))
          : mode === "edit"
            ? t("form.saveChanges")
            : t("form.publish")}
      </Button>
    </form>
  );
}

function Thumb({
  src,
  cover,
  label,
  remove,
  onRemove,
}: {
  src: string;
  cover: boolean;
  label: string;
  remove: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-md border">
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        aria-label={remove}
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {cover && (
        <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
          {label}
        </span>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 font-display text-lg font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
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
