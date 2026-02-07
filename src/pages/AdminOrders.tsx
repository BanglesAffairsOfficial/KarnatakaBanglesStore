import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Filter, Download, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface AdminOrderRow {
  id: string;
  created_at: string;
  status: string;
  total_amount?: number | null;
  delivery_type?: string | null;
  delivery_charge?: number | null;
  profiles?: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  meta?: any;
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
  const { isAdmin, loading: authLoading, roleChecked } = useAuth();
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportType, setExportType] = useState<"all" | "dateRange" | "monthly">("all");
  const [exportDateFrom, setExportDateFrom] = useState<string>("");
  const [exportDateTo, setExportDateTo] = useState<string>("");
  const [exportMonth, setExportMonth] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (authLoading || !roleChecked) return;
    if (!isAdmin) {
      navigate("/auth");
      return;
    }
    fetchOrders();
  }, [authLoading, roleChecked, isAdmin, navigate, page, statusFilter, deliveryFilter, dateFrom, dateTo]);

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
          delivery_type,
          delivery_charge,
          profiles:profiles!orders_user_id_fkey(full_name, phone, email),
          meta
        `,
        { count: "exact" }
      );

    filters.forEach((f) => {
      query = query[f.op](f.column, f.value);
    });

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) {
      const desc = error.message || JSON.stringify(error) || "Unknown error";
      toast({ title: "Failed to load orders", description: desc, variant: "destructive" });
    } else {
      setRows(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = window.confirm("Delete this order and its items?");
    if (!confirmed) return;
    setDeletingId(orderId);
    try {
      // Remove items first to avoid FK issues, then the order.
      const { error: itemsErr } = await supabase.from("order_items").delete().eq("order_id", orderId);
      if (itemsErr) throw itemsErr;
      const { error: ordErr } = await supabase.from("orders").delete().eq("id", orderId);
      if (ordErr) throw ordErr;
      toast({ title: "Order deleted" });
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = window.confirm("Delete ALL orders and their items? This cannot be undone.");
    if (!confirmed) return;
    setDeletingId("ALL");
    try {
      // Delete payments, then items, then orders to satisfy FK constraints. Supabase requires filters.
      const { error: payErr } = await supabase.from("payments").delete().not("id", "is", null);
      if (payErr) throw payErr;
      const { error: itemsErr } = await supabase.from("order_items").delete().not("id", "is", null);
      if (itemsErr) throw itemsErr;
      const { error: ordErr } = await supabase.from("orders").delete().not("id", "is", null);
      if (ordErr) throw ordErr;
      toast({ title: "All orders deleted" });
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Failed to delete all", description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const fetchOrdersForExport = async (filters: any[] = []) => {
    let query = (supabase as any)
      .from("orders")
      .select(
        `
          id,
          created_at,
          status,
          payment_status,
          total_amount,
          delivery_type,
          delivery_charge,
          profiles:profiles!orders_user_id_fkey(full_name, phone, email),
          meta
        `
      );

    filters.forEach((f) => {
      query = query[f.op](f.column, f.value);
    });

    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      throw new Error(error.message || "Failed to fetch orders for export");
    }
    
    return data || [];
  };

  const formatOrdersForExcel = (orders: any[]) => {
    return orders.map((order) => {
      const guest = order.meta?.guest || null;
      const customerName = order.profiles?.full_name || guest?.full_name || "Unknown";
      const phone = order.profiles?.phone || guest?.phone || "-";
      const email = order.profiles?.email || guest?.email || "-";
      const typeLabel = guest ? "B2C" : "B2B";
      const deliveryLabel = guest ? "location" : (order.delivery_type || "-");
      const createdDate = new Date(order.created_at).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return {
        "Order ID": order.id.slice(0, 8),
        "Full Order ID": order.id,
        "Customer Name": customerName,
        "Phone": phone,
        "Email": email,
        "Type": typeLabel,
        "Delivery Type": deliveryLabel,
        "Total Amount (Rs)": order.total_amount ?? 0,
        "Delivery Charge (Rs)": order.delivery_charge ?? 0,
        "Status": order.status === "shipped" ? "Ready for Shipping/Shipped" : (order.status || "pending"),
        "Payment Status": order.payment_status || "pending",
        "Created Date": createdDate,
      };
    });
  };

  const handleExportOrders = async () => {
    try {
      setExporting(true);

      if (exportType === "all") {
        const allOrders = await fetchOrdersForExport();
        const formattedOrders = formatOrdersForExcel(allOrders);
        const worksheet = XLSX.utils.json_to_sheet(formattedOrders);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "All Orders");
        
        // Set column widths
        worksheet["!cols"] = [
          { wch: 12 },
          { wch: 25 },
          { wch: 20 },
          { wch: 15 },
          { wch: 25 },
          { wch: 8 },
          { wch: 15 },
          { wch: 15 },
          { wch: 18 },
          { wch: 25 },
          { wch: 15 },
          { wch: 25 },
        ];
        
        XLSX.writeFile(workbook, `orders_all_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast({ title: "Success", description: "Orders exported successfully!" });
      } else if (exportType === "dateRange") {
        if (!exportDateFrom || !exportDateTo) {
          toast({ title: "Error", description: "Please select both start and end dates", variant: "destructive" });
          return;
        }

        const filters = [
          { column: "created_at", op: "gte", value: exportDateFrom },
          { column: "created_at", op: "lte", value: `${exportDateTo}T23:59:59Z` },
        ];

        const filteredOrders = await fetchOrdersForExport(filters);
        const formattedOrders = formatOrdersForExcel(filteredOrders);
        const worksheet = XLSX.utils.json_to_sheet(formattedOrders);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders by Date");
        
        worksheet["!cols"] = [
          { wch: 12 },
          { wch: 25 },
          { wch: 20 },
          { wch: 15 },
          { wch: 25 },
          { wch: 8 },
          { wch: 15 },
          { wch: 15 },
          { wch: 18 },
          { wch: 25 },
          { wch: 15 },
          { wch: 25 },
        ];
        
        XLSX.writeFile(workbook, `orders_${exportDateFrom}_to_${exportDateTo}.xlsx`);
        toast({ title: "Success", description: "Orders exported successfully!" });
      } else if (exportType === "monthly") {
        if (!exportMonth) {
          toast({ title: "Error", description: "Please select a month", variant: "destructive" });
          return;
        }

        const [year, month] = exportMonth.split("-");
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

        const filters = [
          { column: "created_at", op: "gte", value: startDate },
          { column: "created_at", op: "lte", value: `${endDate}T23:59:59Z` },
        ];

        const filteredOrders = await fetchOrdersForExport(filters);
        const formattedOrders = formatOrdersForExcel(filteredOrders);
        const worksheet = XLSX.utils.json_to_sheet(formattedOrders);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Orders");
        
        worksheet["!cols"] = [
          { wch: 12 },
          { wch: 25 },
          { wch: 20 },
          { wch: 15 },
          { wch: 25 },
          { wch: 8 },
          { wch: 15 },
          { wch: 15 },
          { wch: 18 },
          { wch: 25 },
          { wch: 15 },
          { wch: 25 },
        ];
        
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
        XLSX.writeFile(workbook, `orders_${monthName.replace(" ", "_")}.xlsx`);
        toast({ title: "Success", description: "Orders exported successfully!" });
      }
    } catch (err: any) {
      toast({ title: "Export failed", description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

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
            <CardTitle className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Orders to Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Export Type</Label>
              <Select value={exportType} onValueChange={(v) => setExportType(v as "all" | "dateRange" | "monthly")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select export type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="dateRange">By Date Range</SelectItem>
                  <SelectItem value="monthly">By Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportType === "dateRange" && (
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={exportDateFrom} 
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={exportDateTo} 
                    onChange={(e) => setExportDateTo(e.target.value)}
                    placeholder="Select end date"
                  />
                </div>
              </div>
            )}

            {exportType === "monthly" && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <Label>Select Month</Label>
                <Input 
                  type="month" 
                  value={exportMonth} 
                  onChange={(e) => setExportMonth(e.target.value)}
                  placeholder="Select month"
                />
              </div>
            )}

            <Button 
              onClick={handleExportOrders}
              disabled={exporting}
              className="w-full md:w-auto"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Excel
                </>
              )}
            </Button>
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
                      <th className="py-2">Type</th>
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
                      const guest = (r.meta as any)?.guest || null;
                      const amount = r.total_amount ?? 0;
                      const customerName = r.profiles?.full_name || guest?.full_name || "Unknown";
                      const phone = r.profiles?.phone || guest?.phone || "-";
                      const typeLabel = guest ? "B2C" : "B2B";
                      const deliveryLabel = guest ? "location" : (r.delivery_type || "-");
                      return (
                        <tr key={r.id} className="hover:bg-muted/40">
                          <td className="py-2 font-semibold">#{r.id.slice(0, 8)}</td>
                          <td className="py-2">
                            <div className="font-medium">{customerName}</div>
                            <div className="text-xs text-muted-foreground">{phone}</div>
                          </td>
                          <td className="py-2">{typeLabel}</td>
                          <td className="py-2 capitalize">{deliveryLabel}</td>
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
                            <Button
                              size="sm"
                              variant="destructive"
                              className="ml-2"
                              disabled={deletingId === r.id}
                              onClick={() => handleDeleteOrder(r.id)}
                            >
                              {deletingId === r.id ? "Deleting..." : "Delete"}
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
