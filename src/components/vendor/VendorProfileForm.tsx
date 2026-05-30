import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  business_name: z.string().max(100).optional(),
  whatsapp_number: z.string().min(9).max(20),
  full_name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
});

type FormValues = z.infer<typeof schema>;

export function VendorProfileForm({ vendor, profile, userId, onSave }: {
  vendor: { business_name: string | null; whatsapp_number: string | null } | null;
  profile: { full_name: string; phone: string | null } | null;
  userId: string;
  onSave: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      business_name: vendor?.business_name ?? "",
      whatsapp_number: vendor?.whatsapp_number ?? "",
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
    },
  });

  const submit = async (v: FormValues) => {
    await Promise.all([
      supabase.from("vendors").update({ business_name: v.business_name, whatsapp_number: v.whatsapp_number }).eq("id", userId),
      supabase.from("profiles").update({ full_name: v.full_name, phone: v.phone }).eq("id", userId),
    ]);
    toast.success("Profile updated");
    onSave();
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="max-w-lg space-y-4 rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Edit your profile</h2>
      <div>
        <Label>Business / Agency name (optional)</Label>
        <Input className="mt-1" {...form.register("business_name")} />
      </div>
      <div>
        <Label>WhatsApp number *</Label>
        <Input className="mt-1" {...form.register("whatsapp_number")} />
        <p className="mt-1 text-xs text-muted-foreground">This is shown to clients on your listings</p>
        {form.formState.errors.whatsapp_number && <p className="mt-1 text-xs text-destructive">Enter a valid WhatsApp number</p>}
      </div>
      <div>
        <Label>Full name *</Label>
        <Input className="mt-1" {...form.register("full_name")} />
        {form.formState.errors.full_name && <p className="mt-1 text-xs text-destructive">Enter your full name</p>}
      </div>
      <div>
        <Label>Phone (optional)</Label>
        <Input className="mt-1" {...form.register("phone")} />
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>Save changes</Button>
    </form>
  );
}
