import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2, Package, Truck, CreditCard, MapPin, Download } from "lucide-react";

type OrderStatus = "pending" | "verification_pending" | "paid" | "shipped" | "delivered" | "cancelled";

interface OrderItem {
  id: string;
  productName: string;
  image: string | null;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

interface Address {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface PaymentInfo {
  method: string;
  proofReceived: boolean;
  status: "under_verification" | "approved" | "rejected";
}

interface OrderDetail {
  id: string;
  status: OrderStatus;
  payment_status: string;
  delivery_type?: string | null;
  delivery_charge?: number | null;
  total_amount?: number | null;
  created_at: string;
  payment: PaymentInfo;
  items: OrderItem[];
  address: Address | null;
  invoice_url?: string | null;
  timeline: { label: string; time: string; icon: "check" | "package" | "truck" | "alert"; active: boolean }[];
}

const statusMeta: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  verification_pending: { label: "Under Verification", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);

const formatTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!orderId) {
      setError("Order not found");
      setLoading(false);
      return;
    }
    void loadOrder(orderId, user.id);
  }, [authLoading, user, orderId, navigate]);

  const loadOrder = async (id: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
            id, status, payment_status, delivery_type, delivery_charge, total_amount, created_at, delivery_address_id, meta,
            order_items(
              id,
              bangle_id,
              quantity,
              unit_price,
              total_price,
              size,
              color,
              product_name
            )
          `
        )
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        throw new Error(error?.message || "Order not found");
      }

      const { data: paymentRow } = await supabase
        .from("payments")
        .select("mode, screenshot_url, status, created_at")
        .eq("order_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let address: Address | null = null;
      if (data.delivery_address_id) {
        const { data: addr } = await supabase
          .from("delivery_addresses")
          .select("address_line1,address_line2,city,state,pincode,phone,label")
          .eq("id", data.delivery_address_id)
          .maybeSingle();
        if (addr) {
          address = {
            name: addr.label || "Delivery Address",
            phone: addr.phone || "",
            line1: addr.address_line1 || "",
            line2: addr.address_line2 || "",
            city: addr.city || "",
            state: addr.state || "",
            pincode: addr.pincode || "",
          };
        }
      }

      const bangleIds = (data.order_items || [])
        .map((it: any) => it.bangle_id)
        .filter(Boolean);
      let bangleMap = new Map<string, { name: string; image_url: string | null }>();
      if (bangleIds.length > 0) {
        const { data: bangleRows } = await supabase
          .from("bangles_public")
          .select("id,name,image_url")
          .in("id", Array.from(new Set(bangleIds)));
        if (bangleRows) {
          bangleMap = new Map(bangleRows.map((b: any) => [b.id, { name: b.name, image_url: b.image_url || null }]));
        }
      }

      const items: OrderItem[] =
        data.order_items?.map((it: any) => {
          const meta = it.bangle_id ? bangleMap.get(it.bangle_id) : undefined;
          return {
            id: it.id,
            productName: it.product_name || meta?.name || "Bangle",
            image: meta?.image_url || null,
            price: Number(it.unit_price ?? 0),
            quantity: Number(it.quantity ?? 0),
            size: it.size,
            color: it.color,
          };
        }) || [];

      const paymentInfo: PaymentInfo = {
        method: paymentRow?.mode ? paymentRow.mode.replace("_", " ").toUpperCase() : "QR PAYMENT",
        proofReceived: Boolean(paymentRow?.screenshot_url),
        status:
          paymentRow?.status === "approved"
            ? "approved"
            : paymentRow?.status === "rejected" || paymentRow?.status === "denied"
            ? "rejected"
            : "under_verification",
      };

      const timeline = buildTimeline(
        data.status as OrderStatus,
        paymentRow?.created_at,
        data.created_at,
        data.payment_status || paymentInfo.status,
        data.delivery_type
      );

      setOrder({
        id: data.id,
        status: (data.status as OrderStatus) || "pending",
        payment_status: data.payment_status || "pending",
        delivery_type: data.delivery_type,
        delivery_charge: data.delivery_charge,
        total_amount: Number(data.total_amount ?? data.total ?? 0),
        created_at: data.created_at,
        payment: paymentInfo,
        items,
        address,
        invoice_url: (data as any).meta?.invoice_url || null,
        timeline,
      });
    } catch (err: any) {
      console.error("Order detail load error", err);
      setError(err?.message || "Unable to load order");
    } finally {
      setLoading(false);
    }
  };

  const buildTimeline = (
    status: OrderStatus,
    paymentAt?: string,
    createdAt?: string,
    paymentStatus?: string,
    deliveryType?: string | null
  ) => {
    const paymentStepLabel =
      paymentStatus === "paid" || paymentStatus === "approved"
        ? "Verified"
        : paymentStatus === "failed" || paymentStatus === "rejected" || paymentStatus === "denied"
        ? "Disapproved"
        : "Under Verification";
    const paymentIcon: "check" | "package" | "truck" | "alert" =
      paymentStatus === "paid" || paymentStatus === "approved"
        ? "check"
        : paymentStatus === "failed" || paymentStatus === "rejected" || paymentStatus === "denied"
        ? "alert"
        : "package";

    const isPickup = (deliveryType || "").toLowerCase().includes("pickup");
    const finalStepLabel = isPickup ? "Goods Ready for Pickup" : "Shipped";

    const steps: OrderDetail["timeline"] = [
      { label: "Order Placed", time: formatTime(createdAt), icon: "check", active: true },
      { label: "Payment Submitted", time: formatTime(paymentAt), icon: "package", active: true },
      { label: paymentStepLabel, time: formatTime(paymentAt), icon: paymentIcon, active: true },
      {
        label: finalStepLabel,
        time: status === "shipped" || status === "delivered" ? "Awaiting tracking" : isPickup ? "Ready at store" : "--",
        icon: "truck",
        active: status === "shipped" || status === "delivered" || isPickup,
      },
    ];
    return steps;
  };

  const totals = useMemo(() => {
    if (!order) return { subtotal: 0, totalItems: 0 };
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, totalItems };
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading order...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
          <p className="text-lg font-semibold">Unable to load order.</p>
          <p className="text-muted-foreground">{error || "Please try again later."}</p>
          <Button onClick={() => navigate("/orders")}>Go to Orders</Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusMeta[order.status] || { label: "Status", variant: "secondary" as const };
  const paymentStatusLabel =
    order.payment_status === "paid"
      ? "Verified"
      : order.payment_status === "failed"
      ? "Disapproved"
      : "Under Verification";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">Detailed Order</h1>
            <p className="text-muted-foreground text-sm">
              Items: {order.items.length} • Order ID: {order.id} • Placed on {formatTime(order.created_at)}
            </p>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="shadow-elegant">
              <CardHeader className="flex items-center gap-2">
                <CardTitle className="text-lg">Items</CardTitle>
                <span className="text-sm text-muted-foreground">• {totals.totalItems} item{totals.totalItems === 1 ? "" : "s"}</span>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-semibold text-foreground">Items: {totals.totalItems}</p>
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center border rounded-lg p-3">
                    <div className="w-16 h-16 rounded-md bg-secondary overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{item.productName}</p>
                        <Badge variant="secondary" className="text-xs">
                          {item.quantity} {item.quantity > 1 ? "items" : "item"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Qty {item.quantity} • {formatPrice(item.price)} {item.size && `• Size ${item.size}`} {item.color && `• ${item.color}`}
                      </p>
                    </div>
                    <div className="text-right font-semibold">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
                {order.items.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm">No items in this order.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader className="flex items-center gap-3">
                <CardTitle className="text-lg">Payment</CardTitle>
                <Badge variant="outline" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {order.payment.method}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Payment status: {paymentStatusLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{order.payment.proofReceived ? "Payment screenshot received" : "Awaiting payment proof"}</span>
                </div>
                {order.invoice_url ? (
                  <Button variant="outline" className="gap-2 w-full sm:w-auto" asChild>
                    <a href={order.invoice_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4" />
                      Download Invoice
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="gap-2 w-full sm:w-auto" disabled>
                    <Download className="w-4 h-4" />
                    Download Invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-lg">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {order.address ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-1" />
                    <div className="space-y-1">
                      <p className="font-semibold">{order.address.name}</p>
                      <p className="text-muted-foreground">{order.address.phone}</p>
                      <p className="text-muted-foreground">
                        {order.address.line1}
                        {order.address.line2 ? `, ${order.address.line2}` : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {order.address.city}, {order.address.state} - {order.address.pincode}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No delivery address on file.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.timeline.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {step.icon === "check" && <CheckCircle2 className="w-4 h-4" />}
                      {step.icon === "package" && <Package className="w-4 h-4" />}
                      {step.icon === "truck" && <Truck className="w-4 h-4" />}
                      {step.icon === "alert" && <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>{formatPrice(order.delivery_charge || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount ?? totals.subtotal)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
