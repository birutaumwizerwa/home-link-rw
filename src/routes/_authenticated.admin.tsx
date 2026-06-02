import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — HomeLink" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/" }); }, [loading, isAdmin, navigate]);
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Admin panel</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" /> Platform online
            </span>
          </div>
          <p className="text-sm text-muted-foreground">HomeLink Rwanda — Control Center</p>
        </div>
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending listings</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>
          <TabsContent value="pending"><PendingListings /></TabsContent>
          <TabsContent value="vendors"><Vendors /></TabsContent>
          <TabsContent value="reports"><Reports /></TabsContent>
          <TabsContent value="users"><Users /></TabsContent>
          <TabsContent value="subscriptions"><Subscriptions /></TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function PendingListings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "listings"],
    queryFn: async () => (await supabase.from("listings").select("id,title,price,district,is_approved,vendor_id,created_at").order("created_at", { ascending: false })).data ?? [],
  });
  const update = async (id: string, patch: { is_approved?: boolean; is_available?: boolean }) => {
    await supabase.from("listings").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "listings"] });
  };
  return (
    <Table headers={["Title", "District", "Price", "Status", ""]}>
      {(data ?? []).map((l) => (
        <tr key={l.id} className="border-t">
          <td className="p-3 font-medium">{l.title}</td>
          <td className="p-3">{l.district}</td>
          <td className="p-3">{l.price}</td>
          <td className="p-3">{l.is_approved ? <Badge>Approved</Badge> : <Badge variant="outline">Pending</Badge>}</td>
          <td className="p-3 text-right space-x-2">
            {!l.is_approved && <Button size="sm" onClick={() => update(l.id, { is_approved: true })}>Approve</Button>}
            <Button size="sm" variant="destructive" onClick={async () => { await supabase.from("listings").delete().eq("id", l.id); qc.invalidateQueries({ queryKey: ["admin", "listings"] }); toast.success("Deleted"); }}>Delete</Button>
          </td>
        </tr>
      ))}
    </Table>
  );
}

function Vendors() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "vendors"],
    queryFn: async () => (await supabase.from("vendors").select("id,business_name,is_verified,subscription_status,subscription_expires_at,profile:profiles!vendors_id_fkey(full_name)").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <Table headers={["Name", "Verified", "Plan", "Expires", ""]}>
      {(data ?? []).map((v) => {
        const vv = v as { id: string; business_name: string | null; is_verified: boolean; subscription_status: string; subscription_expires_at: string | null; profile: { full_name: string } | null };
        return (
          <tr key={vv.id} className="border-t">
            <td className="p-3 font-medium">{vv.business_name ?? vv.profile?.full_name}</td>
            <td className="p-3">{vv.is_verified ? "✓" : "—"}</td>
            <td className="p-3 uppercase">{vv.subscription_status}</td>
            <td className="p-3">{vv.subscription_expires_at ? new Date(vv.subscription_expires_at).toLocaleDateString() : "—"}</td>
            <td className="p-3 text-right space-x-2">
              <Button size="sm" variant="outline" onClick={async () => { await supabase.from("vendors").update({ is_verified: !vv.is_verified }).eq("id", vv.id); qc.invalidateQueries({ queryKey: ["admin", "vendors"] }); }}>{vv.is_verified ? "Unverify" : "Verify"}</Button>
              <Button size="sm" onClick={async () => {
                const days = 30;
                const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
                await supabase.from("vendors").update({ subscription_status: "pro", subscription_expires_at: expires }).eq("id", vv.id);
                qc.invalidateQueries({ queryKey: ["admin", "vendors"] });
                toast.success("Activated Pro for 30 days");
              }}>Activate Pro 30d</Button>
              <Button size="sm" variant="secondary" onClick={async () => {
                const plan = window.prompt("Plan (basic / pro):") as "basic" | "pro" | null;
                const ref = window.prompt("MoMo payment reference:");
                if (!plan || !ref) return;
                const price = plan === "pro" ? 15000 : 5000;
                const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                await supabase.from("subscriptions").insert({ vendor_id: vv.id, plan, price_rwf: price, payment_reference: ref, expires_at: expires, is_active: true });
                await supabase.from("vendors").update({ subscription_status: plan, subscription_expires_at: expires }).eq("id", vv.id);
                qc.invalidateQueries({ queryKey: ["admin", "vendors"] });
                toast.success(`${plan} plan activated`);
              }}>Activate plan</Button>
            </td>
          </tr>
        );
      })}
    </Table>
  );
}

function Reports() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => (await supabase.from("reports").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <Table headers={["Listing", "Details", "Resolved", ""]}>
      {(data ?? []).map((r) => (
        <tr key={r.id} className="border-t">
          <td className="p-3 text-xs">{r.listing_id?.slice(0, 8)}</td>
          <td className="p-3 max-w-md truncate">{r.details}</td>
          <td className="p-3">{r.is_resolved ? "✓" : "—"}</td>
          <td className="p-3 text-right">
            {!r.is_resolved && <Button size="sm" onClick={async () => { await supabase.from("reports").update({ is_resolved: true }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["admin", "reports"] }); }}>Mark resolved</Button>}
          </td>
        </tr>
      ))}
    </Table>
  );
}

function Users() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  return (
    <Table headers={["Name", "Phone", "District", "Status", ""]}>
      {(data ?? []).map((u) => (
        <tr key={u.id} className="border-t">
          <td className="p-3 font-medium">{u.full_name}</td>
          <td className="p-3">{u.phone ?? "—"}</td>
          <td className="p-3">{u.location ?? "—"}</td>
          <td className="p-3">{u.is_banned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="secondary">Active</Badge>}</td>
          <td className="p-3 text-right">
            <Button size="sm" variant="outline" onClick={async () => { await supabase.from("profiles").update({ is_banned: !u.is_banned }).eq("id", u.id); qc.invalidateQueries({ queryKey: ["admin", "users"] }); }}>{u.is_banned ? "Unban" : "Ban"}</Button>
          </td>
        </tr>
      ))}
    </Table>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>{headers.map((h, i) => <th key={i} className="p-3">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
