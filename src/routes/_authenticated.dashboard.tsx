import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, BadgeCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorProfileForm } from "@/components/vendor/VendorProfileForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fetchListings } from "@/lib/listings-query";
import { formatPrice } from "@/lib/format";
import { FREE_POST_LIMIT, PLANS, MOMO_PAYMENT_NUMBER, SUPPORT_WHATSAPP } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Vendor dashboard" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isVendor } = useAuth();
  const qc = useQueryClient();

  const { data: vendor } = useQuery({
    queryKey: ["vendor", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone").eq("id", user!.id).maybeSingle();
      return data as { full_name: string; phone: string | null } | null;
    },
  });

  const { data: listings, refetch } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: () => fetchListings({ vendorId: user!.id, onlyApproved: false }),
  });

  if (!isVendor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="mx-auto max-w-2xl flex-1 p-8 text-center">
          <h1 className="text-2xl font-bold">Vendor account needed</h1>
          <p className="mt-2 text-muted-foreground">Sign up as a vendor to post listings.</p>
        </main>
      </div>
    );
  }

  const free = vendor?.subscription_status === "free";
  const used = vendor?.free_posts_used ?? 0;
  const sub = vendor?.subscription_status ?? "free";
  const isNewVendor = (listings?.length ?? 0) === 0 && !vendor?.is_verified;

  const onboardingSteps = [
    { step: "1", title: "Post your first listing", desc: "You have 3 free posts. Add photos, price and location.", to: "/post-listing" as const, done: (listings?.length ?? 0) > 0 },
    { step: "2", title: "Add your WhatsApp", desc: "Clients need your number to contact you directly.", to: "/profile" as const, done: !!vendor?.whatsapp_number },
    { step: "3", title: "Get verified", desc: "Verified vendors get 3× more views and a trust badge.", to: null, done: vendor?.is_verified ?? false },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Vendor dashboard</h1>
          <Button asChild><Link to="/post-listing"><Plus className="mr-1.5 h-4 w-4" /> New listing</Link></Button>
        </div>

        {isNewVendor && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h2 className="text-xl font-bold">Welcome to HomeLink Rwanda! 🎉</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your vendor account is active. Here's how to get started and attract your first tenants.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {onboardingSteps.map((s) => (
                <div key={s.step} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${s.done ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {s.done ? "✓" : s.step}
                    </span>
                    <span className="font-semibold">{s.title}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{s.desc}</p>
                  {s.to && !s.done && (
                    <Button asChild size="sm" variant="outline" className="mt-3"><Link to={s.to}>Go</Link></Button>
                  )}
                  {s.done && <span className="mt-3 inline-block text-xs font-medium text-primary">✓ Done</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border bg-card p-5">
          {free ? (
            <>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">Free plan</span>
                <span className="text-muted-foreground">{used} of {FREE_POST_LIMIT} free posts used</span>
              </div>
              <Progress value={(used / FREE_POST_LIMIT) * 100} />
              {used >= FREE_POST_LIMIT && (
                <div className="mt-4 rounded-md bg-warning/10 p-3 text-sm">
                  You've used your free posts. <strong>Upgrade</strong> to keep posting.
                </div>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(PLANS).map(([key, p]) => (
                  <div key={key} className="rounded-lg border p-4">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-semibold">{p.name}</h3>
                      <span className="text-lg font-bold text-primary">{formatPrice(p.price_rwf)}<span className="text-xs text-muted-foreground">/30 days</span></span>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{p.features.map((f) => <li key={f}>• {f}</li>)}</ul>
                    <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                      <a href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Activate ${p.name} plan. My vendor ID: ${user?.id}`)}`} target="_blank" rel="noreferrer">
                        Pay {formatPrice(p.price_rwf)} via MoMo
                      </a>
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">Send to MoMo: <strong>{MOMO_PAYMENT_NUMBER}</strong>, reference: <code>{user?.id?.slice(0, 8)}</code></p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <Badge>{sub.toUpperCase()} plan</Badge>
                <div className="mt-1 text-sm text-muted-foreground">Expires {vendor?.subscription_expires_at ? new Date(vendor.subscription_expires_at).toLocaleDateString() : "—"}</div>
              </div>
            </div>
          )}
        </div>

        <Tabs defaultValue="listings" className="mt-8">
          <TabsList>
            <TabsTrigger value="listings">My listings</TabsTrigger>
            <TabsTrigger value="profile">My profile</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            {!listings || listings.length === 0 ? (
              <div className="rounded-xl border bg-muted/30 p-10 text-center text-muted-foreground">No listings yet. Click "New listing" to start.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="p-3">Title</th><th className="p-3">Type</th><th className="p-3">Price</th><th className="p-3">Status</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody>
                    {(listings as unknown as Array<{ id: string; title: string; listing_type: string; price: number; }>).map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="p-3 font-medium">{l.title}</td>
                        <td className="p-3 capitalize">{l.listing_type}</td>
                        <td className="p-3">{formatPrice(l.price)}</td>
                        <td className="p-3">
                          <StatusBadge id={l.id} onChange={() => refetch()} />
                        </td>
                        <td className="p-3 text-right">
                          <Button asChild size="sm" variant="ghost"><Link to="/listing/$id" params={{ id: l.id }}>View</Link></Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            if (!confirm("Delete this listing?")) return;
                            await supabase.from("listings").delete().eq("id", l.id);
                            toast.success("Deleted");
                            qc.invalidateQueries({ queryKey: ["my-listings"] });
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {user && (
              <VendorProfileForm
                vendor={vendor ?? null}
                profile={profile ?? null}
                userId={user.id}
                onSave={() => refetchProfile()}
              />
            )}
            {!vendor?.is_verified && (
              <div className="max-w-lg rounded-xl border border-primary/30 bg-primary/5 p-5">
                <h3 className="flex items-center gap-2 font-semibold"><BadgeCheck className="h-5 w-5 text-primary" /> Get verified</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Verified vendors get more trust, more clicks, and a verified badge on all listings.
                  Send your National ID to our WhatsApp to get verified for free.
                </p>
                <Button asChild variant="outline" className="mt-3">
                  <a href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`I would like to request verification. My vendor ID: ${user?.id}`)}`} target="_blank" rel="noreferrer">
                    Request verification via WhatsApp
                  </a>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function StatusBadge({ id, onChange }: { id: string; onChange: () => void }) {
  const { data: l } = useQuery({
    queryKey: ["listing-status", id],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("is_approved,is_available").eq("id", id).maybeSingle();
      return data;
    },
  });
  if (!l) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {l.is_approved ? <Badge variant="secondary">Approved</Badge> : <Badge variant="outline">Pending</Badge>}
      <button
        className="text-xs underline text-muted-foreground hover:text-foreground"
        onClick={async () => {
          await supabase.from("listings").update({ is_available: !l.is_available }).eq("id", id);
          onChange();
        }}
      >
        {l.is_available ? "Mark unavailable" : "Mark available"}
      </button>
    </div>
  );
}
