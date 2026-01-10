import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, ShoppingBag, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { parseColors, getColorSwatchStyle } from "@/lib/colorHelpers";

interface OrderDetail {
  id: string;
  created_at: string;
  status: string;
  delivery_type: string | null;
  delivery_charge: number | null;
  total_amount: number | null;
  total: number | null;
  meta: any;
  delivery_address_id?: string | null;
  profiles?: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  order_items?: Array<{
    id: string;
    bangle_id: string;
    quantity: number;
    price: number;
    size: string | null;
    color: string | null;
    bangles?: {
      name: string;
      image_url: string | null;
    } | null;
  }>;
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

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
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

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string>("pending");
  const [deliveryAddress, setDeliveryAddress] = useState<{
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    phone: string | null;
  } | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentAssets, setPaymentAssets] = useState<Record<string, { url: string | null; error: string | null }>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate("/auth");
      return;
    }
    if (id) fetchOrder();
  }, [authLoading, isAdmin, id, navigate]);

  const fetchOrder = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("orders")
      .select(`
        id,
        created_at,
        status,
        delivery_type,
        delivery_charge,
        total_amount,
        total,
        meta,
        delivery_address_id,
        profiles:profiles!orders_user_id_fkey(full_name, phone, email),
        order_items(
          id,
          bangle_id,
          quantity,
          price,
          size,
          color,
          bangles:bangle_id(name, image_url)
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Order not found", description: error?.message || "", variant: "destructive" });
      setLoading(false);
      return;
    }

    setOrder(data);
    setStatus(data.status || "pending");
    setNote(data.meta?.admin_notes || "");
    if (data.delivery_address_id) {
      const { data: addr } = await (supabase as any)
        .from("delivery_addresses")
        .select("address_line1, address_line2, city, state, pincode, phone")
        .eq("id", data.delivery_address_id)
        .maybeSingle();
      setDeliveryAddress(addr || null);
    } else {
      setDeliveryAddress(null);
    }

    // Fetch payment submissions for this order
    const { data: paymentRows, error: payError } = await (supabase as any)
      .from("payments")
      .select("id, created_at, amount, mode, reference, screenshot_url, status")
      .eq("order_id", id)
      .order("created_at", { ascending: false });
    if (payError) {
      console.error("Payment fetch error", payError);
      setPaymentError(payError.message);
      setPayments([]);
    } else {
      setPaymentError(null);
      setPayments(paymentRows || []);
      await buildPaymentAssets(paymentRows || []);
    }

    setLoading(false);
  };

  const buildPaymentAssets = async (rows: PaymentRecord[]) => {
    const entries = await Promise.all(
      rows.map(async (p) => {
        const rawPath = p.screenshot_url || "";
        if (!rawPath) {
          return [p.id, { url: null, error: null }] as const;
        }
        // If already a full URL, use it directly.
        if (/^https?:\/\//i.test(rawPath)) {
          return [p.id, { url: rawPath, error: null }] as const;
        }
        try {
          const { data: signedData, error: signedErr } = await (supabase as any)
            .storage
            .from("payment-proof")
            .createSignedUrl(rawPath, 60 * 60);
          if (signedErr) throw signedErr;
          return [p.id, { url: signedData?.signedUrl || null, error: null }] as const;
        } catch (err: any) {
          console.error("payment screenshot url error", err);
          const { data: publicData } = supabase.storage.from("payment-proof").getPublicUrl(rawPath);
          return [p.id, { url: publicData?.publicUrl || null, error: err?.message || "Unable to load screenshot" }] as const;
        }
      })
    );
    setPaymentAssets(Object.fromEntries(entries));
  };

  const handleStatusUpdate = async (nextStatus: string) => {
    if (!id) return;
    const validValues = STATUS_OPTIONS.map((s) => s.value);
    if (!validValues.includes(nextStatus)) {
      toast({ title: "Invalid status", description: "Choose a valid status option.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated" });
      setStatus(nextStatus);
      fetchOrder();
    }
  };

  const handleSaveNote = async () => {
    if (!id) return;
    setSaving(true);
    const meta = { ...(order?.meta || {}), admin_notes: note };
    const { error } = await (supabase as any)
      .from("orders")
      .update({ meta })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save note", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Note saved" });
      fetchOrder();
    }
  };

  const handleCancel = async () => {
    await handleStatusUpdate("cancelled");
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

  const amount = order.total_amount ?? order.total ?? 0;

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
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
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
                  <Select value={status} onValueChange={handleStatusUpdate} disabled={saving}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Admin Notes</Label>
                <Textarea
                  className="mt-2"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Internal notes about this order"
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleSaveNote} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save note
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleCancel} disabled={saving || status === "cancelled"}>
                    Cancel order
                  </Button>
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
                <p className="text-muted-foreground">{order.profiles?.full_name || "N/A"}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Phone</p>
                <p className="text-muted-foreground">{order.profiles?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Email</p>
                <p className="text-muted-foreground">{order.profiles?.email || "N/A"}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="font-semibold text-foreground">Delivery Address</p>
                {deliveryAddress ? (
                  <div className="text-muted-foreground space-y-1">
                    <p>{deliveryAddress.address_line1}</p>
                    {deliveryAddress.address_line2 && <p>{deliveryAddress.address_line2}</p>}
                    <p>
                      {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}
                    </p>
                    {deliveryAddress.phone && <p>Phone: {deliveryAddress.phone}</p>}
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
            {!order.order_items || order.order_items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No items.</p>
            ) : (
              order.order_items.map((item) => {
                const color = parseColors([item.color || ""]);
                const colorHex = color[0]?.hex || "#888888";
                const subtotal = (item.price ?? 0) * (item.quantity ?? 1);
                return (
                  <div key={item.id} className="p-3 rounded-lg border border-border flex items-center justify-between gap-3">
                    <div className="w-16 h-16 rounded-md overflow-hidden border border-border bg-secondary flex-shrink-0 flex items-center justify-center">
                      {item.bangles?.image_url ? (
                        <img src={item.bangles.image_url} alt={item.bangles.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground line-clamp-1">{item.bangles?.name || "Bangle"}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>Qty {item.quantity}</span>
                        <span>Size {item.size || "—"}</span>
                        <span className="flex items-center gap-1">
                          Color {item.color || "—"}
                          <span className="inline-block w-4 h-4 rounded-full border border-border" style={getColorSwatchStyle({ name: item.color || "—", hex: colorHex })} />
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">Unit: Rs {(item.price ?? 0).toLocaleString()}</p>
                      <p className="font-bold text-accent">Subtotal: Rs {subtotal.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
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
            {paymentError && (
              <p className="text-destructive text-sm">
                Failed to load payments: {paymentError}
              </p>
            )}
            {payments.length === 0 && !paymentError ? (
              <p className="text-muted-foreground">No payment submissions yet.</p>
            ) : (
              payments.map((p) => {
                const asset = paymentAssets[p.id];
                const screenshotUrl = asset?.url || "";
                const screenshotNote = asset?.error || null;
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
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <a
                            href={screenshotUrl}
                            download
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {screenshotNote ? `Unavailable: ${screenshotNote}` : "Not provided"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {new Date(p.created_at).toLocaleString("en-IN", {
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
