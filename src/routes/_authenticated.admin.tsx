import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users as UsersIcon,
  Building2,
  Home,
  AlertTriangle,
  DollarSign,
  Clock,
  Eye,
  MessageCircle,
  RefreshCw,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — HomeLink Rwanda" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [loading, isAdmin, navigate]);
  
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Header with View Site button */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage listings, vendors, users, and platform settings
            </p>
          </div>
          
          {/* View Site Button - Option to see the live website */}
          <Button variant="outline" asChild className="gap-2">
            <Link to="/">
              <ExternalLink className="h-4 w-4" />
              View live site
              <span className="text-xs text-muted-foreground ml-1">(browse as visitor)</span>
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <StatsGrid />
        
        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">
              <LayoutDashboard className="h-4 w-4 mr-1.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-1.5" /> Pending
            </TabsTrigger>
            <TabsTrigger value="vendors">
              <Building2 className="h-4 w-4 mr-1.5" /> Vendors
            </TabsTrigger>
            <TabsTrigger value="reports">
              <AlertTriangle className="h-4 w-4 mr-1.5" /> Reports
            </TabsTrigger>
            <TabsTrigger value="users">
              <UsersIcon className="h-4 w-4 mr-1.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <DollarSign className="h-4 w-4 mr-1.5" /> Subscriptions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="pending"><PendingListings /></TabsContent>
          <TabsContent value="vendors"><VendorsList /></TabsContent>
          <TabsContent value="reports"><ReportsList /></TabsContent>
          <TabsContent value="users"><UsersList /></TabsContent>
          <TabsContent value="subscriptions"><SubscriptionsList /></TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

// ============================================================
// STATS GRID
// ============================================================

interface AdminStats {
  listings: number;
  users: number;
  vendors: number;
  pending: number;
  reports: number;
  activeSubs: number;
  totalRevenue: number;
}

function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    refetchInterval: 60000,
    queryFn: async () => {
      const [
        { count: listings },
        { count: users },
        { count: vendors },
        { count: pending },
        { count: reports },
        { count: activeSubs },
        { data: revenue },
      ] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("vendors").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("is_resolved", false),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("subscriptions").select("price_rwf").eq("is_active", true),
      ]);

      const totalRevenue = revenue?.reduce((sum, s) => sum + (s.price_rwf || 0), 0) || 0;

      return {
        listings: listings ?? 0,
        users: users ?? 0,
        vendors: vendors ?? 0,
        pending: pending ?? 0,
        reports: reports ?? 0,
        activeSubs: activeSubs ?? 0,
        totalRevenue,
      };
    },
  });
}

function StatsGrid() {
  const { data: s, isLoading } = useAdminStats();

  const stats = [
    { label: "Total Listings", value: s?.listings ?? 0, icon: Home, color: "bg-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30", textColor: "text-blue-600" },
    { label: "Total Users", value: s?.users ?? 0, icon: UsersIcon, color: "bg-green-500", bgColor: "bg-green-50 dark:bg-green-950/30", textColor: "text-green-600" },
    { label: "Vendors", value: s?.vendors ?? 0, icon: Building2, color: "bg-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/30", textColor: "text-purple-600" },
    { label: "Pending Approval", value: s?.pending ?? 0, icon: Clock, color: "bg-yellow-500", bgColor: "bg-yellow-50 dark:bg-yellow-950/30", textColor: "text-yellow-600", alert: (s?.pending ?? 0) > 0 },
    { label: "Open Reports", value: s?.reports ?? 0, icon: AlertTriangle, color: "bg-red-500", bgColor: "bg-red-50 dark:bg-red-950/30", textColor: "text-red-600", alert: (s?.reports ?? 0) > 0 },
    { label: "Active Subs", value: s?.activeSubs ?? 0, icon: DollarSign, color: "bg-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", textColor: "text-emerald-600" },
    { label: "Revenue (MTD)", value: `${(s?.totalRevenue ?? 0).toLocaleString()} RWF`, icon: TrendingUp, color: "bg-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/30", textColor: "text-amber-600" },
    { label: "Engagement", value: `${s?.users ? Math.round(((s?.listings ?? 0) / (s?.users ?? 1)) * 10) / 10 : 0} listings/user`, icon: MessageCircle, color: "bg-indigo-500", bgColor: "bg-indigo-50 dark:bg-indigo-950/30", textColor: "text-indigo-600" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800 h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl border p-3 transition-all hover:shadow-md ${stat.alert ? "border-red-300 bg-red-50/50 dark:bg-red-950/20" : "bg-card"}`}
        >
          <div className={`rounded-lg p-1.5 w-fit ${stat.bgColor}`}>
            <stat.icon className={`h-4 w-4 ${stat.textColor}`} />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold">{stat.value?.toLocaleString() ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// OVERVIEW TAB
// ============================================================

interface RecentListing {
  id: string;
  title: string;
  price: number;
  district: string;
  is_approved: boolean;
  created_at: string;
  views_count: number;
}

interface RecentUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
}

interface RecentVendor {
  id: string;
  business_name: string | null;
  is_verified: boolean;
  subscription_status: string;
  profile: { full_name: string } | null;
}

function OverviewTab() {
  const { data: recentListings } = useQuery<RecentListing[]>({
    queryKey: ["admin", "recent-listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title, price, district, is_approved, created_at, views_count")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as RecentListing[];
    },
  });

  const { data: recentUsers } = useQuery<RecentUser[]>({
    queryKey: ["admin", "recent-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone, location, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as RecentUser[];
    },
  });

  const { data: recentVendors } = useQuery<RecentVendor[]>({
    queryKey: ["admin", "recent-vendors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors")
        .select("id, business_name, is_verified, subscription_status, profile:profiles!vendors_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as unknown as RecentVendor[];
    },
  });

  return (
    <div className="space-y-6">
      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="default" size="sm">
          <Link to="/">
            <Eye className="mr-1.5 h-3.5 w-3.5" /> Browse live site
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh data
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Listings */}
        <div className="rounded-xl border bg-card">
          <div className="border-b p-4">
            <h3 className="font-semibold">📋 Recent Listings</h3>
          </div>
          <div className="divide-y">
            {recentListings?.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.district} • {l.price?.toLocaleString()} RWF • {l.views_count || 0} views</p>
                </div>
                <Badge variant={l.is_approved ? "default" : "outline"} className={l.is_approved ? "bg-green-100 text-green-700" : "text-yellow-600"}>
                  {l.is_approved ? "Approved" : "Pending"}
                </Badge>
              </div>
            ))}
            {recentListings?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No listings yet</div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-xl border bg-card">
          <div className="border-b p-4">
            <h3 className="font-semibold">👥 Recent Users</h3>
          </div>
          <div className="divide-y">
            {recentUsers?.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                  {u.full_name?.charAt(0) || "?"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{u.full_name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{u.phone || "No phone"} • {u.location || "No location"}</p>
                </div>
                <Badge variant="secondary">{new Date(u.created_at).toLocaleDateString()}</Badge>
              </div>
            ))}
            {recentUsers?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No users yet</div>
            )}
          </div>
        </div>

        {/* Recent Vendors */}
        <div className="rounded-xl border bg-card lg:col-span-2">
          <div className="border-b p-4">
            <h3 className="font-semibold">🏢 Recent Vendors</h3>
          </div>
          <div className="divide-y">
            {recentVendors?.map((v) => {
              const name = v.business_name || v.profile?.full_name || "—";
              return (
                <div key={v.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      Plan: <span className="capitalize">{v.subscription_status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.is_verified ? (
                      <Badge className="bg-green-100 text-green-700">✓ Verified</Badge>
                    ) : (
                      <Badge variant="outline">Unverified</Badge>
                    )}
                  </div>
                </div>
              );
            })}
            {recentVendors?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No vendors yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PENDING LISTINGS
// ============================================================

interface PendingListing {
  id: string;
  title: string;
  price: number;
  district: string;
  is_approved: boolean;
  vendor_id: string;
  created_at: string;
}

function PendingListings() {
  const qc = useQueryClient();
  const { data } = useQuery<PendingListing[]>({
    queryKey: ["admin", "listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id,title,price,district,is_approved,vendor_id,created_at")
        .order("created_at", { ascending: false });
      return (data ?? []) as PendingListing[];
    },
  });
  
  const update = async (id: string, patch: { is_approved?: boolean; is_available?: boolean }) => {
    await supabase.from("listings").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "listings"] });
    toast.success("Listing updated");
  };
  
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3">Title</th>
            <th className="p-3">District</th>
            <th className="p-3">Price</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((l) => (
            <tr key={l.id} className="border-t hover:bg-muted/30 transition">
              <td className="p-3 font-medium">{l.title}</td>
              <td className="p-3">{l.district}</td>
              <td className="p-3">{l.price?.toLocaleString()} RWF</td>
              <td className="p-3">
                {l.is_approved ? (
                  <Badge className="bg-green-100 text-green-700">Approved</Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600">Pending</Badge>
                )}
              </td>
              <td className="p-3 text-right space-x-2">
                {!l.is_approved && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => update(l.id, { is_approved: true })}>
                    <CheckCircle className="mr-1 h-3 w-3" /> Approve
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={async () => {
                  await supabase.from("listings").delete().eq("id", l.id);
                  qc.invalidateQueries({ queryKey: ["admin", "listings"] });
                  toast.success("Deleted");
                }}>
                  <XCircle className="mr-1 h-3 w-3" /> Delete
                </Button>
              </td>
            </tr>
          ))}
          {(data ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                No pending listings
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// VENDORS LIST - WITH PROPER SUBSCRIPTION INSERTION
// ============================================================

interface VendorItem {
  id: string;
  business_name: string | null;
  is_verified: boolean;
  subscription_status: string;
  subscription_expires_at: string | null;
  profile: { full_name: string } | null;
}

function VendorsList() {
  const qc = useQueryClient();
  const { data } = useQuery<VendorItem[]>({
    queryKey: ["admin", "vendors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors")
        .select("id,business_name,is_verified,subscription_status,subscription_expires_at,profile:profiles!vendors_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as VendorItem[];
    },
  });
  
  // Helper to check if subscription is expired
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  };
  
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Verified</th>
            <th className="p-3">Plan</th>
            <th className="p-3">Expires</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((vv) => {
            const expired = isExpired(vv.subscription_expires_at);
            
            return (
              <tr key={vv.id} className="border-t hover:bg-muted/30 transition">
                <td className="p-3 font-medium">{vv.business_name ?? vv.profile?.full_name ?? "—"}</td>
                <td className="p-3">
                  {vv.is_verified ? (
                    <Badge className="bg-green-100 text-green-700">✓ Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600">Unverified</Badge>
                  )}
                </td>
                <td className="p-3">
                  <span className={`capitalize ${expired && vv.subscription_status !== "free" ? "text-red-500" : ""}`}>
                    {expired && vv.subscription_status !== "free" ? "Expired" : vv.subscription_status}
                  </span>
                </td>
                <td className="p-3">
                  {vv.subscription_expires_at ? (
                    <span className={expired ? "text-red-500 font-medium" : ""}>
                      {new Date(vv.subscription_expires_at).toLocaleDateString()}
                      {expired && " (Expired)"}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-right space-x-2">
                  {/* Verify/Unverify Button */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={async () => {
                      const { error } = await supabase
                        .from("vendors")
                        .update({ is_verified: !vv.is_verified })
                        .eq("id", vv.id);
                      
                      if (error) {
                        toast.error(error.message);
                      } else {
                        toast.success(vv.is_verified ? "Vendor unverified" : "Vendor verified ✓");
                        qc.invalidateQueries({ queryKey: ["admin", "vendors"] });
                        qc.invalidateQueries({ queryKey: ["admin", "stats"] });
                      }
                    }}
                  >
                    <Award className="mr-1 h-3 w-3" /> 
                    {vv.is_verified ? "Unverify" : "Verify"}
                  </Button>
                  
                  {/* Activate Basic Plan Button */}
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={async () => {
                      // Calculate 30 days from now
                      const expiresAt = new Date();
                      expiresAt.setDate(expiresAt.getDate() + 30);
                      
                      // 1. Update vendors table
                      const { error: vendorError } = await supabase
                        .from("vendors")
                        .update({ 
                          subscription_status: "basic", 
                          subscription_expires_at: expiresAt.toISOString() 
                        })
                        .eq("id", vv.id);
                      
                      if (vendorError) {
                        toast.error("Failed to update vendor: " + vendorError.message);
                        return;
                      }
                      
                      // 2. Insert into subscriptions table
                      const { error: subError } = await supabase
                        .from("subscriptions")
                        .insert({
                          vendor_id: vv.id,
                          plan: "basic",
                          price_rwf: 5000,
                          payment_reference: `admin_basic_${Date.now()}`,
                          expires_at: expiresAt.toISOString(),
                          is_active: true
                        });
                      
                      if (subError) {
                        console.error("Subscription insert error:", subError);
                        toast.error("Vendor updated but subscription record failed");
                      } else {
                        toast.success("Basic plan activated for 30 days!");
                      }
                      
                      qc.invalidateQueries({ queryKey: ["admin", "vendors"] });
                      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
                      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
                    }}
                  >
                    Activate Basic
                  </Button>
                  
                  {/* Activate Pro Plan Button */}
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={async () => {
                      // Calculate 30 days from now
                      const expiresAt = new Date();
                      expiresAt.setDate(expiresAt.getDate() + 30);
                      
                      // 1. Update vendors table
                      const { error: vendorError } = await supabase
                        .from("vendors")
                        .update({ 
                          subscription_status: "pro", 
                          subscription_expires_at: expiresAt.toISOString() 
                        })
                        .eq("id", vv.id);
                      
                      if (vendorError) {
                        toast.error("Failed to update vendor: " + vendorError.message);
                        return;
                      }
                      
                      // 2. Insert into subscriptions table
                      const { error: subError } = await supabase
                        .from("subscriptions")
                        .insert({
                          vendor_id: vv.id,
                          plan: "pro",
                          price_rwf: 15000,
                          payment_reference: `admin_pro_${Date.now()}`,
                          expires_at: expiresAt.toISOString(),
                          is_active: true
                        });
                      
                      if (subError) {
                        console.error("Subscription insert error:", subError);
                        toast.error("Vendor updated but subscription record failed");
                      } else {
                        toast.success("Pro plan activated for 30 days! 🎉");
                      }
                      
                      qc.invalidateQueries({ queryKey: ["admin", "vendors"] });
                      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
                      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
                    }}
                  >
                    Activate Pro
                  </Button>
                </td>
              </tr>
            );
          })}
          {(data ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                No vendors found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// REPORTS LIST
// ============================================================

interface ReportItem {
  id: string;
  listing_id: string;
  reason: string;
  details: string;
  is_resolved: boolean;
  created_at: string;
}

function ReportsList() {
  const qc = useQueryClient();
  const { data } = useQuery<ReportItem[]>({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as ReportItem[];
    },
  });
  
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3">Listing</th>
            <th className="p-3">Reason</th>
            <th className="p-3">Details</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((r) => (
            <tr key={r.id} className="border-t hover:bg-muted/30 transition">
              <td className="p-3 text-xs font-mono">{r.listing_id?.slice(0, 8)}...</td>
              <td className="p-3">{r.reason}</td>
              <td className="p-3 text-muted-foreground max-w-md truncate">{r.details}</td>
              <td className="p-3">
                {r.is_resolved ? (
                  <Badge className="bg-green-100 text-green-700">Resolved</Badge>
                ) : (
                  <Badge variant="destructive">Open</Badge>
                )}
              </td>
              <td className="p-3 text-right">
                {!r.is_resolved && (
                  <Button size="sm" onClick={async () => {
                    await supabase.from("reports").update({ is_resolved: true }).eq("id", r.id);
                    qc.invalidateQueries({ queryKey: ["admin", "reports"] });
                    toast.success("Report resolved");
                  }}>
                    <CheckCircle className="mr-1 h-3 w-3" /> Resolve
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// USERS LIST
// ============================================================

interface UserItem {
  id: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  is_banned: boolean;
  created_at: string;
}

function UsersList() {
  const qc = useQueryClient();
  const { data } = useQuery<UserItem[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return (data ?? []) as UserItem[];
    },
  });
  
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Phone</th>
            <th className="p-3">District</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((u) => (
            <tr key={u.id} className="border-t hover:bg-muted/30 transition">
              <td className="p-3 font-medium">{u.full_name || "—"}</td>
              <td className="p-3">{u.phone ?? "—"}</td>
              <td className="p-3">{u.location ?? "—"}</td>
              <td className="p-3">
                {u.is_banned ? (
                  <Badge variant="destructive">Banned</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
              </td>
              <td className="p-3 text-right">
                <Button size="sm" variant="outline" onClick={async () => {
                  await supabase.from("profiles").update({ is_banned: !u.is_banned }).eq("id", u.id);
                  qc.invalidateQueries({ queryKey: ["admin", "users"] });
                  toast.success(u.is_banned ? "User unbanned" : "User banned");
                }}>
                  {u.is_banned ? "Unban" : "Ban"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// SUBSCRIPTIONS LIST
// ============================================================

interface SubscriptionItem {
  id: string;
  vendor_id: string;
  plan: string;
  price_rwf: number | null;
  payment_reference: string | null;
  expires_at: string | null;
  is_active: boolean;
  vendor: { business_name: string | null; profile: { full_name: string } | null } | null;
}

function SubscriptionsList() {
  const qc = useQueryClient();
  const { data } = useQuery<SubscriptionItem[]>({
    queryKey: ["admin", "subscriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id, vendor_id, plan, price_rwf, payment_reference, expires_at, is_active, vendor:vendors!subscriptions_vendor_id_fkey(business_name, profile:profiles!vendors_id_fkey(full_name))")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as SubscriptionItem[];
    },
  });

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3">Vendor</th>
            <th className="p-3">Plan</th>
            <th className="p-3">Price</th>
            <th className="p-3">Reference</th>
            <th className="p-3">Expires</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((ss) => {
            const name = ss.vendor?.business_name || ss.vendor?.profile?.full_name || ss.vendor_id.slice(0, 8);
            return (
              <tr key={ss.id} className="border-t hover:bg-muted/30 transition">
                <td className="p-3 font-medium">{name}</td>
                <td className="p-3"><span className="capitalize">{ss.plan}</span></td>
                <td className="p-3">{ss.price_rwf?.toLocaleString()} RWF</td>
                <td className="p-3 text-xs font-mono">{ss.payment_reference ?? "—"}</td>
                <td className="p-3">{ss.expires_at ? new Date(ss.expires_at).toLocaleDateString() : "—"}</td>
                <td className="p-3">
                  {ss.is_active ? (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  ) : (
                    <Badge variant="outline">Expired</Badge>
                  )}
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={async () => {
                    await supabase.from("subscriptions").update({ is_active: !ss.is_active }).eq("id", ss.id);
                    if (!ss.is_active) {
                      await supabase.from("vendors").update({ subscription_status: ss.plan as "basic" | "pro", subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).eq("id", ss.vendor_id);
                    } else {
                      await supabase.from("vendors").update({ subscription_status: "free" }).eq("id", ss.vendor_id);
                    }
                    qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
                    toast.success(ss.is_active ? "Subscription deactivated" : "Subscription reactivated");
                  }}>
                    {ss.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}