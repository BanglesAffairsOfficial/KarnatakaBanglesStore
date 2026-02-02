import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { parseColors, getColorSwatchStyle } from "@/lib/colorHelpers";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "react-i18next";

interface OrderSummary {
  id: string;
  created_at: string;
  status: string;
  total_amount?: number | null;
  delivery_type?: string | null;
  delivery_charge?: number | null;
  order_items?: Array<{
    id: string;
    bangle_id: string;
    quantity: number;
    unit_price: number;
    total_price?: number | null;
    size: string | null;
    color: string | null;
    bangles?: {
      name: string;
      image_url: string | null;
    } | null;
  }>;
}

export default function OrderHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [cancelingItemId, setCancelingItemId] = useState<string | null>(null);
  const isAdmin =
    Boolean(
      (user as any)?.is_admin ||
        (user as any)?.user_metadata?.is_admin ||
        (user as any)?.app_metadata?.roles?.includes?.("admin")
    );

  const formatStatus = (status: string) => {
    if (!status) return t("orders.status.pending");
    return status === "shipped" ? t("orders.status.ready") : status;
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [authLoading, user, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("orders")
      .select(`
        id, created_at, status, total_amount, user_id, delivery_type, delivery_charge,
        order_items(
          id,
          bangle_id,
          quantity,
          unit_price,
          total_price,
          size,
          color,
          bangles:bangle_id(name, image_url)
        )
      `)
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleCancelOrder = async (orderId: string, currentStatus: string) => {
    if (currentStatus !== "pending") return;
    const reason = window.prompt(t("orders.cancelReasonPrompt"), t("orders.cancelReasonDefault"));
    if (reason === null) return;
    setCancelingOrderId(orderId);
    const { error } = await supabase.rpc("cancel_order", { order_id: orderId, reason: reason || "" });
    setCancelingOrderId(null);
    if (error) {
      window.alert(`Failed to cancel order: ${error.message}`);
      return;
    }
    fetchOrders();
  };

  const handleCancelItem = async (orderItemId: string, orderStatus: string, quantity: number) => {
    if (orderStatus !== "pending") return;
    const reason = window.prompt(t("orders.cancelReasonPrompt"), t("orders.cancelReasonDefault"));
    if (reason === null) return;
    setCancelingItemId(orderItemId);
    const { error } = await supabase.rpc("cancel_order_item", {
      order_item_id: orderItemId,
      qty: quantity,
      reason: reason || "",
    });
    setCancelingItemId(null);
    if (error) {
      window.alert(`Failed to cancel item: ${error.message}`);
      return;
    }
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold">{t("orders.title")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t("orders.subtitle")}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={fetchOrders} variant="outline" size="sm" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("orders.refresh")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("orders.historyTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("orders.loading")}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-60" />
                <p>{t("orders.empty")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => {
                  const amount = o.total_amount ?? 0;
                  const rawStatus = o.status || "pending";
                  const status = formatStatus(rawStatus);
                  const firstImage = o.order_items?.[0]?.bangles?.image_url || null;
                  const deliveryLabel = o.delivery_type ? o.delivery_type : "pickup";
                  const deliveryCost = o.delivery_charge ?? 0;
                  const canCancelOrder = !isAdmin && rawStatus === "pending";
                  return (
                    <div key={o.id} className="p-4 rounded-lg border border-border space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-display font-bold text-lg text-foreground">Order #{o.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(o.created_at).toLocaleString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" | "}
                            {status}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap justify-between">
                          {firstImage && (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-border">
                              <img src={firstImage} alt="Order item" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="text-right sm:min-w-[160px]">
                            <p className="text-xs sm:text-sm font-semibold text-foreground">
                              {t("orders.delivery")}: {deliveryLabel} ({t("orders.currency")} {Number(deliveryCost).toLocaleString()})
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-bold text-lg sm:text-xl text-accent">
                              {t("orders.currency")} {Number(amount).toLocaleString()}
                            </p>
                            <div className="flex gap-2 justify-end flex-wrap">
                              {canCancelOrder && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={cancelingOrderId === o.id}
                                  onClick={() => handleCancelOrder(o.id, rawStatus)}
                                >
                                  {cancelingOrderId === o.id ? t("orders.cancelling") : t("orders.cancelOrder")}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  if (!o.order_items?.length) return;
                                  o.order_items.forEach((item) => {
                                    addItem({
                                      banglesId: item.bangle_id,
                                      name: item.bangles?.name || "Bangle",
                                      price: item.unit_price ?? 0,
                                      imageUrl: item.bangles?.image_url || undefined,
                                      size: item.size || "",
                                      color: item.color || "Default",
                                      colorHex: "#888888",
                                      quantity: item.quantity || 1,
                                      orderType: user ? "wholesale" : "retail",
                                    });
                                  });
                                  navigate("/cart");
                                }}
                              >
                                {t("orders.repeatOrder")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/orders/${o.id}`)}
                              >
                                {t("orders.viewDetails")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
