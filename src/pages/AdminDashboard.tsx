import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";

interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  delivery_type: string | null;
  delivery_charge: number | null;
  total_amount: number | null;
  total: number | null;
  profiles?: {
    full_name: string | null;
    phone: string | null;
  } | null;
}

interface OrderItemRow {
  quantity: number;
  price: number | null;
  bangles?: {
    id: string;
    name: string;
    category_id: string | null;
  } | null;
}

interface CategoryRow {
  id: string;
  name: string;
}

const STATUS_BUCKETS = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) return;
    fetchData();
  }, [authLoading, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, itemsRes, catsRes] = await Promise.all([
        (supabase as any)
          .from("orders")
          .select(
            `
              id,
              created_at,
              status,
              delivery_type,
              delivery_charge,
              total_amount,
              total,
              profiles:profiles!orders_user_id_fkey(full_name, phone)
            `
          )
          .order("created_at", { ascending: false })
          .limit(200),
        (supabase as any)
          .from("order_items")
          .select(
            `
              quantity,
              price,
              bangles:bangle_id(id, name, category_id)
            `
          )
          .limit(500),
        (supabase as any)
          .from("categories")
          .select("id, name"),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (catsRes.error) throw catsRes.error;

      setOrders(ordersRes.data || []);
      setOrderItems(itemsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (err: any) {
      console.error("[AdminDashboard] fetch error", err);
      toast({ title: "Failed to load dashboard", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let totalOrdersToday = 0;
    let totalOrdersMonth = 0;
    let revenue = 0;
    let pending = 0;
    let completed = 0;
    let cancelled = 0;

    orders.forEach((o) => {
      const createdTs = new Date(o.created_at).getTime();
      const amt = o.total_amount ?? o.total ?? 0;
      revenue += amt;
      if (createdTs >= startOfToday) totalOrdersToday++;
      if (createdTs >= startOfMonth) totalOrdersMonth++;
      const status = (o.status || "").toLowerCase();
      if (status === "pending") pending++;
      if (status === "delivered" || status === "completed") completed++;
      if (status === "cancelled") cancelled++;
    });

    const avgOrder = orders.length ? revenue / orders.length : 0;
    return { totalOrdersToday, totalOrdersMonth, revenue, pending, completed, cancelled, avgOrder };
  }, [orders]);

  const statusOverview = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_BUCKETS.forEach((s) => (counts[s] = 0));
    orders.forEach((o) => {
      const s = (o.status || "pending").toLowerCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 10), [orders]);

  const topBangles = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    orderItems.forEach((item) => {
      const id = item.bangles?.id;
      if (!id) return;
      const key = id;
      const existing = map.get(key) || { name: item.bangles?.name || "Bangle", qty: 0, revenue: 0 };
      const qty = item.quantity || 0;
      const price = item.price ?? 0;
      existing.qty += qty;
      existing.revenue += price * qty;
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orderItems]);

  const categoryPerformance = useMemo(() => {
    const catMap = new Map<string, { name: string; orders: number; revenue: number }>();
    categories.forEach((c) => catMap.set(c.id, { name: c.name, orders: 0, revenue: 0 }));

    orderItems.forEach((item) => {
      const catId = item.bangles?.category_id;
      if (!catId) return;
      const entry = catMap.get(catId) || { name: "Unknown", orders: 0, revenue: 0 };
      const qty = item.quantity || 0;
      const price = item.price ?? 0;
      entry.orders += qty;
      entry.revenue += price * qty;
      catMap.set(catId, entry);
    });

    return Array.from(catMap.values())
      .filter((c) => c.revenue > 0 || c.orders > 0)
      .sort((a, b) => b.orders - a.orders || b.revenue - a.revenue)
      .slice(0, 5);
  }, [orderItems, categories]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-10 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Checking permissions...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-10">
          <p className="text-muted-foreground">Access denied.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Refresh
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard title="Orders Today" value={metrics.totalOrdersToday} loading={loading} />
          <MetricCard title="Orders This Month" value={metrics.totalOrdersMonth} loading={loading} />
          <MetricCard title="Total Revenue" value={`Rs ${metrics.revenue.toLocaleString()}`} loading={loading} />
          <MetricCard title="Pending" value={metrics.pending} loading={loading} />
          <MetricCard title="Completed" value={metrics.completed} loading={loading} />
          <MetricCard title="Cancelled" value={metrics.cancelled} loading={loading} />
          <MetricCard title="Avg Order Value" value={`Rs ${metrics.avgOrder.toFixed(0)}`} loading={loading} />
        </div>

        {/* Status overview */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Order Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
            {STATUS_BUCKETS.map((s) => (
              <div key={s} className="p-3 rounded-lg border border-border bg-muted/40">
                <p className="text-xs text-muted-foreground capitalize">
                  {s === "shipped" ? "Ready for Shipping/Shipped" : s}
                </p>
                <p className="text-xl font-bold">{statusOverview[s] || 0}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent orders.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Order</th>
                      <th className="py-2">Customer</th>
                      <th className="py-2">Total</th>
                      <th className="py-2">Delivery</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-2 font-semibold">#{o.id.slice(0, 8)}</td>
                        <td className="py-2">
                          <div className="font-medium">{o.profiles?.full_name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{o.profiles?.phone || "-"}</div>
                        </td>
                        <td className="py-2">Rs {Number(o.total_amount ?? o.total ?? 0).toLocaleString()}</td>
                        <td className="py-2 capitalize">{o.delivery_type || "-"}</td>
                        <td className="py-2 capitalize">{o.status || "pending"}</td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(o.created_at).toLocaleString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top selling bangles and category performance */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Top Selling Bangles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : topBangles.length === 0 ? (
                <p className="text-muted-foreground">No data.</p>
              ) : (
                topBangles.map((b) => (
                  <div key={b.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground">Qty {b.qty}</p>
                    </div>
                    <p className="font-bold text-accent">Rs {b.revenue.toLocaleString()}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : categoryPerformance.length === 0 ? (
                <p className="text-muted-foreground">No data.</p>
              ) : (
                categoryPerformance.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">Orders {c.orders}</p>
                    </div>
                    <p className="font-bold text-accent">Rs {c.revenue.toLocaleString()}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const MetricCard = ({ title, value, loading }: { title: string; value: string | number; loading: boolean }) => (
  <Card className="shadow-elegant">
    <CardHeader className="pb-2">
      <CardTitle className="text-xs text-muted-foreground font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
    </CardContent>
  </Card>
);
