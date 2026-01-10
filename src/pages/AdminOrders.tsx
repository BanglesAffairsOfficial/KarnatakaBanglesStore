import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AdminOrderRow {
  id: string;
  created_at: string;
  status: string;
  total_amount?: number | null;
  total?: number | null;
  delivery_type?: string | null;
  delivery_charge?: number | null;
  profiles?: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Ready for Shipping/Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];
const DELIVERY_OPTIONS = ["pickup", "delivery"];
const PAGE_SIZE = 10;

export default function AdminOrders() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rows, setRows] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate("/auth");
      return;
    }
    fetchOrders();
  }, [authLoading, isAdmin, navigate, page, statusFilter, deliveryFilter, dateFrom, dateTo]);

  const buildFilters = () => {
    const filters: any[] = [];
    if (statusFilter !== "all") filters.push({ column: "status", op: "eq", value: statusFilter });
    if (deliveryFilter !== "all") filters.push({ column: "delivery_type", op: "eq", value: deliveryFilter });
    if (dateFrom) filters.push({ column: "created_at", op: "gte", value: dateFrom });
    if (dateTo) filters.push({ column: "created_at", op: "lte", value: `${dateTo}T23:59:59Z` });
    return filters;
  };

  const fetchOrders = async () => {
    setLoading(true);
    const filters = buildFilters();

    let query = (supabase as any)
      .from("orders")
      .select(
        `
          id,
          created_at,
          status,
          payment_status,
          total_amount,
          total,
          delivery_type,
          delivery_charge,
          profiles:profiles!orders_user_id_fkey(full_name, phone, email)
        `,
        { count: "exact" }
      )
      .in("payment_status", ["verification_pending", "paid"]);

    filters.forEach((f) => {
      query = query[f.op](f.column, f.value);
    });

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) {
      toast({ title: "Failed to load orders", description: error.message, variant: "destructive" });
    } else {
      setRows(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">Orders Management</h1>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Refresh
          </Button>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>
            <div className="space-y-2">
              <Label>Delivery Type</Label>
              <Select value={deliveryFilter} onValueChange={(v) => { setPage(1); setDeliveryFilter(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {DELIVERY_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground">No orders found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Order ID</th>
                      <th className="py-2">Customer</th>
                      <th className="py-2">Delivery</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2 text-right">Delivery Charge</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Created</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r) => {
                      const amount = r.total_amount ?? r.total ?? 0;
                      const customerName = r.profiles?.full_name || "Unknown";
                      const phone = r.profiles?.phone || "-";
                      return (
                        <tr key={r.id} className="hover:bg-muted/40">
                          <td className="py-2 font-semibold">#{r.id.slice(0, 8)}</td>
                          <td className="py-2">
                            <div className="font-medium">{customerName}</div>
                            <div className="text-xs text-muted-foreground">{phone}</div>
                          </td>
                          <td className="py-2 capitalize">{r.delivery_type || "-"}</td>
                          <td className="py-2 text-right">Rs {Number(amount).toLocaleString()}</td>
                          <td className="py-2 text-right">Rs {Number(r.delivery_charge ?? 0).toLocaleString()}</td>
                      <td className="py-2 capitalize">{r.status === "shipped" ? "Ready for Shipping/Shipped" : (r.status || "pending")}</td>
                          <td className="py-2 text-sm text-muted-foreground">
                            {new Date(r.created_at).toLocaleString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            })}
                          </td>
                          <td className="py-2 text-right">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/orders/${r.id}`)}>
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} • {totalCount} orders
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Prev
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
