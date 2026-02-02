import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, ShoppingBag, Image as ImageIcon, Link as LinkIcon, CreditCard, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderItem {
  id: string;
  name: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
}

interface OrderData {
  id: string;
  created_at: string;
  status: OrderStatus;
  payment_status: string | null;
  delivery_type: string | null;
  delivery_charge: number | null;
  total_amount: number | null;
  delivery_address_id: string | null;
  meta?: any;
  profiles?: { full_name: string | null; phone: string | null; email: string | null } | null;
  order_items?: any[];
}

interface PaymentRecord {
  id: string;
  created_at: string;
  amount: number | null;
  mode: string | null;
  reference: string | null;
  screenshot_url: string | null;
  status: string | null;
}

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Ready for Shipping/Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [address, setAddress] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentAssets, setPaymentAssets] = useState<Record<string, string | null>>({});
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [guest, setGuest] = useState<any | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate("/auth");
      return;
    }
    if (id) void fetchOrder(id);
  }, [authLoading, isAdmin, id, navigate]);

  const fetchOrder = async (orderId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id, created_at, status, payment_status, delivery_type, delivery_charge, total_amount, delivery_address_id,
        meta,
        profiles:profiles!orders_user_id_fkey(full_name, phone, email),
        order_items(id, quantity, unit_price, total_price, size, color, product_name, bangles:bangle_id(name, image_url))
      `
      )
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Order not found", description: error?.message || "", variant: "destructive" });
      setLoading(false);
      return;
    }

    setOrder(data as any);
    setInvoiceUrl((data as any)?.meta?.invoice_url || null);
    setGuest((data as any)?.meta?.guest || null);

    const mappedItems: OrderItem[] =
      data.order_items?.map((it: any) => ({
        id: it.id,
        name: it.product_name || it.bangles?.name || "Bangle",
        image_url: it.bangles?.image_url || null,
        quantity: it.quantity ?? 0,
        unit_price: it.unit_price ?? 0,
        size: it.size,
        color: it.color,
      })) || [];
    setItems(mappedItems);

    if (data.delivery_address_id) {
      const { data: addr } = await supabase
        .from("delivery_addresses")
        .select("address_line1,address_line2,city,state,pincode,phone,label")
        .eq("id", data.delivery_address_id)
        .maybeSingle();
      setAddress(addr || null);
    } else {
      setAddress(null);
    }

    const { data: paymentRows, error: payErr } = await supabase
      .from("payments")
      .select("id, created_at, amount, mode, reference, screenshot_url, status")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    if (payErr) {
      toast({ title: "Failed to load payments", description: payErr.message, variant: "destructive" });
      setPayments([]);
    } else {
      setPayments(paymentRows || []);
      await buildPaymentAssets(paymentRows || []);
    }

    setLoading(false);
  };

  const buildPaymentAssets = async (rows: PaymentRecord[]) => {
    const entries = await Promise.all(
      rows.map(async (p) => {
        const raw = p.screenshot_url || "";
        if (!raw) return [p.id, null] as const;
        if (/^https?:\/\//i.test(raw)) return [p.id, raw] as const;
        const { data } = supabase.storage.from("payment-proof").getPublicUrl(raw);
        return [p.id, data?.publicUrl || null] as const;
      })
    );
    setPaymentAssets(Object.fromEntries(entries));
  };

  const handleStatusUpdate = async (nextStatus: OrderStatus) => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status updated" });
    fetchOrder(id);
  };

  const handlePaymentDecision = async (paymentId: string, decision: "approved" | "denied") => {
    if (!id) return;
    setSaving(true);
    try {
      const { error: payErr } = await supabase.from("payments").update({ status: decision }).eq("id", paymentId);
      if (payErr) throw payErr;
      const nextPaymentStatus = decision === "approved" ? "paid" : "failed";
      const { error: ordErr } = await supabase.from("orders").update({ payment_status: nextPaymentStatus }).eq("id", id);
      if (ordErr) throw ordErr;
      toast({ title: `Payment ${decision === "approved" ? "approved" : "denied"}` });
      fetchOrder(id);
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-10 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading order...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-10">
          <p className="text-muted-foreground">Order not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/orders")}>
            Back to orders
          </Button>
        </div>
      </div>
    );
  }

  const amount = order.total_amount ?? 0;
  const customerName = order.profiles?.full_name || guest?.full_name || "N/A";
  const customerPhone = order.profiles?.phone || guest?.phone || "N/A";
  const customerEmail = order.profiles?.email || guest?.email || "N/A";

  const handleInvoiceUpload = async () => {
    if (!id || !invoiceFile) {
      toast({ title: "No file selected", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const ext = invoiceFile.name.split(".").pop();
      const filePath = `invoices/${id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("payment-proof").upload(filePath, invoiceFile, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("payment-proof").getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl || null;

      const nextMeta = { ...(order.meta || {}), invoice_url: publicUrl || filePath };
      const { error: metaErr } = await supabase.from("orders").update({ meta: nextMeta }).eq("id", id);
      if (metaErr) throw metaErr;

      setInvoiceUrl(publicUrl || filePath);
      toast({ title: "Invoice uploaded" });
    } catch (err: any) {
      toast({ title: "Invoice upload failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setSaving(false);
      setInvoiceFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => navigate("/admin/orders")}>
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Order #{order.id.slice(0, 8)}</span>
                <span className="text-accent font-bold">Rs {Number(amount).toLocaleString()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-foreground">Created</p>
                  <p className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Delivery</p>
                  <p className="text-muted-foreground">
                    {order.delivery_type || "pickup"} • Rs {Number(order.delivery_charge ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Status</p>
                  <Select value={order.status} onValueChange={(v) => handleStatusUpdate(v as OrderStatus)} disabled={saving}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-foreground">Name</p>
                <p className="text-muted-foreground">{customerName}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Phone</p>
                <p className="text-muted-foreground">{customerPhone}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Email</p>
                <p className="text-muted-foreground">{customerEmail}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="font-semibold text-foreground">Delivery Address</p>
                {address ? (
                  <div className="text-muted-foreground space-y-1">
                    <p>{address.address_line1}</p>
                    {address.address_line2 && <p>{address.address_line2}</p>}
                    <p>
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    {address.phone && <p>Phone: {address.phone}</p>}
                  </div>
                ) : guest ? (
                  <div className="text-muted-foreground space-y-1">
                    <p>{guest.address || "Pickup / no address"}</p>
                    {(guest.city || guest.state || guest.pincode) && (
                      <p>
                        {[guest.city, guest.state].filter(Boolean).join(", ")}
                        {guest.pincode ? ` - ${guest.pincode}` : ""}
                      </p>
                    )}
                    {guest.phone && <p>Phone: {guest.phone}</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Pickup / no address</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No items.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="p-3 rounded-lg border border-border flex items-center justify-between gap-3">
                  <div className="w-16 h-16 rounded-md overflow-hidden border border-border bg-secondary flex-shrink-0 flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground line-clamp-1">{item.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-3">
                      <span>Qty {item.quantity}</span>
                      <span>Size {item.size || "-"}</span>
                      <span>Color {item.color || "-"}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">Unit: Rs {(item.unit_price ?? 0).toLocaleString()}</p>
                    <p className="font-bold text-accent">Subtotal: Rs {((item.unit_price ?? 0) * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
            <div className="flex justify-end border-t pt-3 text-sm">
              <div className="text-right">
                <p>Delivery: Rs {Number(order.delivery_charge ?? 0).toLocaleString()}</p>
                <p className="font-bold text-accent">Total: Rs {Number(amount).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-col gap-2">
                <Label>Upload Invoice (PDF/JPG/PNG)</Label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleInvoiceUpload} disabled={saving || !invoiceFile}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Upload Invoice
                  </Button>
                  {invoiceUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                        View Invoice
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {payments.length === 0 ? (
                <p className="text-muted-foreground">No payment submissions yet.</p>
            ) : (
              payments.map((p) => {
                const screenshotUrl = paymentAssets[p.id];
                return (
                  <div key={p.id} className="p-3 border border-border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">Transaction ID</p>
                        <p className="text-muted-foreground">{p.reference || "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">Status</p>
                        <p className="text-muted-foreground capitalize">{p.status || "submitted"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" disabled={saving} onClick={() => handlePaymentDecision(p.id, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" disabled={saving} onClick={() => handlePaymentDecision(p.id, "denied")}>
                        Deny
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">Amount</p>
                        <p className="text-muted-foreground">Rs {Number(p.amount ?? amount).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">Mode</p>
                        <p className="text-muted-foreground">{p.mode || "UPI"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Screenshot</span>
                      </div>
                      {screenshotUrl ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={screenshotUrl}
                            alt="Payment screenshot"
                            className="w-24 h-24 rounded-md border border-border object-cover"
                          />
                          <a href={screenshotUrl} download className="text-primary hover:underline flex items-center gap-1">
                            <LinkIcon className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not provided</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted:{" "}
                      {new Date(p.created_at).toLocaleString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
