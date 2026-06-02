import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { stripPhoneNumbers } from "@/lib/format";
import { DISTRICTS, PROPERTY_TYPES, LISTING_TYPES, PRICE_PERIODS, BEDROOM_OPTIONS, BATHROOM_OPTIONS, AMENITIES, FREE_POST_LIMIT } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/post-listing")({
  head: () => ({ meta: [{ title: "Post a listing" }] }),
  component: PostListingPage,
});

const schema = z.object({
  title: z.string().trim().min(5).max(120),
  listing_type: z.enum(["rent", "sale"]),
  property_type: z.enum(["house", "villa", "apartment", "studio", "room", "commercial"]),
  bedrooms: z.coerce.number().min(0).max(20),
  bathrooms: z.coerce.number().min(1).max(20),
  size_sqm: z.coerce.number().optional().nullable(),
  price: z.coerce.number().min(0),
  price_period: z.enum(["monthly", "yearly", "fixed"]),
  district: z.string().min(1),
  sector: z.string().trim().max(80).optional(),
  cell: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  is_available: z.boolean(),
  amenities: z.record(z.string(), z.boolean()),
});

const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;

function PostListingPage() {
  const { user, isVendor, refresh } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const { data: vendor } = useQuery({
    queryKey: ["vendor", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("vendors").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", listing_type: "rent", property_type: "apartment",
      bedrooms: 1, bathrooms: 1, size_sqm: null,
      price: 0, price_period: "monthly",
      district: "", sector: "", cell: "",
      description: "", is_available: true,
      amenities: Object.fromEntries(AMENITIES.map((a) => [a.key, false])),
    },
  });

  const overLimit = vendor?.subscription_status === "free" && (vendor?.free_posts_used ?? 0) >= FREE_POST_LIMIT;

  const onFiles = (selected: FileList | null) => {
    if (!selected) return;
    const incoming = Array.from(selected).filter((f) => /^image\/(png|jpeg|jpg|webp)$/.test(f.type) && f.size <= MAX_BYTES);
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_IMAGES));
  };

  const submit = async (v: z.infer<typeof schema>) => {
    if (!user) return;
    if (overLimit) { toast.error("Free post limit reached"); return; }
    setUploading(true);
    try {
      // Upload images first
      const uploaded: string[] = [];
      for (const f of files) {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name}`;
        const { error } = await supabase.storage.from("listing-images").upload(path, f, { contentType: f.type, upsert: false });
        if (error) throw error;
        const { data: pub } = supabase.storage.from("listing-images").getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }

      const insertPayload = {
        vendor_id: user.id,
        title: stripPhoneNumbers(v.title),
        description: stripPhoneNumbers(v.description ?? ""),
        listing_type: v.listing_type,
        property_type: v.property_type,
        price: v.price,
        price_period: v.price_period,
        bedrooms: v.bedrooms,
        bathrooms: v.bathrooms,
        size_sqm: v.size_sqm ?? null,
        district: v.district,
        sector: v.sector || null,
        cell: v.cell || null,
        is_available: v.is_available,
        cover_image_url: uploaded[0] ?? null,
        ...Object.fromEntries(AMENITIES.map((a) => [a.key, !!v.amenities[a.key]])),
      };

      const { data: created, error } = await supabase.from("listings").insert(insertPayload).select("id").single();
      if (error) throw error;

      if (uploaded.length > 0) {
        await supabase.from("listing_images").insert(uploaded.map((url, i) => ({ listing_id: created.id, image_url: url, sort_order: i })));
      }

      if (vendor?.subscription_status === "free") {
        await supabase.from("vendors").update({ free_posts_used: (vendor.free_posts_used ?? 0) + 1 }).eq("id", user.id);
      }

      toast.success("Listing submitted! It will appear after admin approval.");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  if (!isVendor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 sm:px-6">
          <div className="rounded-2xl border bg-card p-8 text-center shadow-card">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-3xl">🏢</div>
            <h1 className="mt-4 text-2xl font-bold">Become a vendor to post listings</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You currently have a client account. To post properties and reach thousands of renters,
              you need a vendor account.
            </p>

            <div className="mt-6 rounded-xl border bg-muted/30 p-5 text-left">
              <p className="text-sm font-semibold">What you get as a vendor:</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li>✓ 3 free listings to start</li>
                <li>✓ Your own vendor profile page</li>
                <li>✓ Direct messages from interested renters</li>
                <li>✓ Verified badge after ID check</li>
                <li>✓ Upgrade to post unlimited listings</li>
              </ul>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                className="w-full"
                size="lg"
                disabled={upgrading}
                onClick={async () => {
                  if (!user) return;
                  setUpgrading(true);
                  try {
                    const { error } = await supabase
                      .from("user_roles")
                      .upsert({ user_id: user.id, role: "vendor" }, { onConflict: "user_id,role", ignoreDuplicates: true });
                    if (error) throw error;
                    await supabase
                      .from("vendors")
                      .upsert({ id: user.id, free_posts_used: 0, subscription_status: "free" }, { onConflict: "id", ignoreDuplicates: true });
                    await refresh();
                    toast.success("Your account has been upgraded to vendor!");
                  } catch {
                    toast.error("Failed to upgrade account. Please try again.");
                  } finally {
                    setUpgrading(false);
                  }
                }}
              >
                {upgrading ? "Upgrading..." : "Upgrade to vendor account — it's free"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/" })}>
                Back to browsing
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">Post a new listing</h1>

        {overLimit && (
          <div className="mb-6 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
            You've used your 3 free posts. <a href="/dashboard" className="font-semibold underline">Upgrade your plan</a> to continue posting.
          </div>
        )}

        <form onSubmit={form.handleSubmit(submit)} className="space-y-8 rounded-xl border bg-card p-6">
          <Section title="Basic info">
            <Label>Title</Label>
            <Input {...form.register("title")} placeholder="Bright 2-bedroom apartment in Kimironko" />
            <div className="grid grid-cols-2 gap-3">
              <Picker label="Listing type" value={form.watch("listing_type")} onChange={(v) => form.setValue("listing_type", v as "rent" | "sale")} options={LISTING_TYPES.map(o => ({ value: o.value, label: o.label }))} />
              <Picker label="Property type" value={form.watch("property_type")} onChange={(v) => form.setValue("property_type", v as "house" | "villa" | "apartment" | "studio" | "room" | "commercial")} options={PROPERTY_TYPES.map(o => ({ value: o.value, label: o.label }))} />
            </div>
          </Section>

          <Section title="Property specs">
            <div className="grid grid-cols-3 gap-3">
              <Picker label="Bedrooms" value={String(form.watch("bedrooms"))} onChange={(v) => form.setValue("bedrooms", Number(v))} options={BEDROOM_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))} />
              <Picker label="Bathrooms" value={String(form.watch("bathrooms"))} onChange={(v) => form.setValue("bathrooms", Number(v))} options={BATHROOM_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))} />
              <div><Label>Size (m²)</Label><Input type="number" {...form.register("size_sqm")} /></div>
            </div>
          </Section>

          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (RWF)</Label><Input type="number" {...form.register("price")} /></div>
              <Picker label="Period" value={form.watch("price_period")} onChange={(v) => form.setValue("price_period", v as "monthly" | "yearly" | "fixed")} options={PRICE_PERIODS.map(o => ({ value: o.value, label: o.label }))} />
            </div>
          </Section>

          <Section title="Location">
            <Picker label="District" value={form.watch("district")} onChange={(v) => form.setValue("district", v, { shouldValidate: true })} options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sector</Label><Input {...form.register("sector")} /></div>
              <div><Label>Cell / Neighbourhood</Label><Input {...form.register("cell")} /></div>
            </div>
          </Section>

          <Section title="Amenities">
            <div className="grid grid-cols-2 gap-3">
              {AMENITIES.map((a) => (
                <label key={a.key} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <Checkbox checked={!!form.watch(`amenities.${a.key}` as const)} onCheckedChange={(c) => form.setValue(`amenities.${a.key}` as const, !!c)} />
                  {a.label}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Description">
            <Textarea rows={5} {...form.register("description")} placeholder="Describe the property (phone numbers will be stripped automatically)" />
          </Section>

          <Section title="Photos">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 hover:bg-muted/50">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="mt-2 text-sm">Click to upload (up to {MAX_IMAGES}, jpg/png/webp, &lt; 5MB each)</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-md border">
                    <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"><X className="h-3 w-3" /></button>
                    {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Cover</span>}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Status">
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>Listing available right now</span>
              <Switch checked={form.watch("is_available")} onCheckedChange={(v) => form.setValue("is_available", v)} />
            </label>
          </Section>

          <Button type="submit" className="w-full" size="lg" disabled={uploading || overLimit}>
            {uploading ? "Publishing..." : "Publish listing"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Picker({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
