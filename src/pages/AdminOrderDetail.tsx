import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, CreditCard, Image as ImageIcon } from "lucide-react";
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
  total_amount: number | null;
  delivery_address_id: string | null;
  meta?: Record<string, any> | null;
  profiles?: { full_name: string | null; phone: string | null; email: string | null } | null;
  order_items?: any[];
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
  const { isAdmin, loading: authLoading, roleChecked } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [address, setAddress] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !roleChecked) return;
    if (!isAdmin) {
      navigate("/auth");
      return;
    }
    if (id) void fetchOrder(id);
  }, [authLoading, roleChecked, isAdmin, id, navigate]);

  const fetchOrder = async (orderId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id, created_at, status, total_amount, delivery_address_id, meta,
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

    // invoice url (stored in meta.invoice_url) and payments for this order
    setInvoiceUrl((data as any).meta?.invoice_url || null);

    const { data: payRows } = await supabase
      .from("payments")
      .select("id,order_id,amount,mode,reference,status,created_at,screenshot_url")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    setPayments(payRows || []);

    setLoading(false);
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
    void fetchOrder(id);
  };

  const handleInvoiceUpload = async () => {
    if (!id || !invoiceFile) return;
    setSaving(true);
    try {
      const fileExt = invoiceFile.name.split(".").pop();
      const filePath = `invoices/${id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("invoices").upload(filePath, invoiceFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      const existingMeta = (order as any)?.meta && typeof (order as any)?.meta === "object" ? (order as any)?.meta : {};
      const { error: updateError } = await supabase
        .from("orders")
        .update({ meta: { ...existingMeta, invoice_url: publicUrl } })
        .eq("id", id);
      if (updateError) throw updateError;
      setInvoiceUrl(publicUrl);
      toast({ title: "Invoice uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "", variant: "destructive" });
    } finally {
      setSaving(false);
      setInvoiceFile(null);
    }
  };

  const handlePaymentDecision = async (paymentId: string, decision: "approved" | "denied") => {
    if (!id) return;
    setSaving(true);
    try {
      const status = decision === "approved" ? "approved" : "denied";
      const { error } = await supabase.from("payments").update({ status }).eq("id", paymentId);
      if (error) throw error;
      if (decision === "approved") {
        await supabase.from("orders").update({ payment_status: "paid" }).eq("id", id);
        toast({ title: "Payment approved" });
      } else {
        toast({ title: "Payment denied" });
      }
      void fetchOrder(id);
    } catch (err: any) {
      toast({ title: "Action failed", description: err?.message || "", variant: "destructive" });
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
  const customerName = order.profiles?.full_name || "N/A";
  const customerPhone = order.profiles?.phone || "N/A";
  const customerEmail = order.profiles?.email || "N/A";

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
              <div className="grid md:grid-cols-2 gap-4">
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
                  <p className="font-semibold text-foreground">Status</p>
                  <Select value={order.status} onValueChange={(value) => handleStatusUpdate(value as OrderStatus)} disabled={saving}>
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

              <div className="space-y-3 pt-4 border-t">
                <div>
                  <p className="font-semibold text-foreground mb-2">Items ({items.length})</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="text-sm flex justify-between">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-muted-foreground">Qty: {item.quantity} @ Rs {Number(item.unit_price).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">Rs {Number(item.unit_price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                    <p>{address.city}, {address.state} - {address.pincode}</p>
                    {address.phone && <p>Phone: {address.phone}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No delivery address on file.</p>
                )}

                <div className="pt-3">
                  <label className="text-sm font-semibold text-foreground block">Invoice</label>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                    className="text-sm mt-1"
                  />
                  <div className="flex gap-2 mt-2">
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
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CreditCard className="w-4 h-4" />
              Payments
            </div>
            <p className="text-muted-foreground text-sm">
              {payments.length === 0 ? "No payment submissions yet." : `${payments.length} payment${payments.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {payments.length > 0 && (
            <div className="space-y-3 mt-3">
              {payments.map((payment) => (
                <Card key={payment.id} className="shadow-sm">
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">Rs {Number(payment.amount ?? 0).toLocaleString()}</p>
                        <p className="text-muted-foreground">
                          Mode: {payment.mode || "N/A"} | Ref: {payment.reference || "N/A"}
                        </p>
                        <p className="text-muted-foreground">Status: {payment.status || "pending"}</p>
                        <p className="text-muted-foreground">
                          Submitted{" "}
                          {new Date(payment.created_at).toLocaleString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {payment.screenshot_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={payment.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                              <ImageIcon className="w-4 h-4" />
                              View proof
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={saving || payment.status === "approved"}
                          onClick={() => handlePaymentDecision(payment.id, "approved")}
                        >
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving || payment.status === "denied"}
                          onClick={() => handlePaymentDecision(payment.id, "denied")}
                        >
                          Deny
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
