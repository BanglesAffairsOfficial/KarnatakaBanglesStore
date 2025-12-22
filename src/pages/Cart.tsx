import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Trash2, Plus, Minus, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DeliveryAddress {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAddresses();
    } else if (!authLoading && !user) {
      setLoadingAddresses(false);
    }
  }, [user, authLoading]);

  const fetchAddresses = async () => {
    const { data } = await supabase
      .from("delivery_addresses")
      .select("*")
      .eq("user_id", user!.id)
      .order("is_default", { ascending: false });

    if (data) {
      setAddresses(data);
      const defaultAddr = data.find((a) => a.is_default);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (data.length > 0) setSelectedAddressId(data[0].id);
    }
    setLoadingAddresses(false);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: "Please login", description: "You need to be logged in to place an order." });
      navigate("/auth");
      return;
    }

    if (items.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }

    if (!selectedAddressId) {
      toast({ title: "Select delivery address", description: "Please select or add a delivery address.", variant: "destructive" });
      return;
    }

    setPlacingOrder(true);

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        delivery_address_id: selectedAddressId,
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !orderData) {
      toast({ title: "Failed to create order", variant: "destructive" });
      setPlacingOrder(false);
      return;
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: orderData.id,
      bangle_id: item.banglesId,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      toast({ title: "Failed to add order items", variant: "destructive" });
      setPlacingOrder(false);
      return;
    }

    toast({ title: "Order placed!", description: `Order #${orderData.id.slice(0, 8)} has been placed.` });
    clearCart();
    navigate("/profile");
    setPlacingOrder(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <Card className="shadow-elegant">
            <CardContent className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">Add some beautiful bangles to your cart!</p>
              <Button onClick={() => navigate("/")}>Browse Products</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={`${item.banglesId}-${item.size}-${item.color}`} className="shadow-elegant">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>Size: {item.size}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <div
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <span>{item.color}</span>
                          </div>
                        </div>
                        <p className="text-accent font-bold mt-1">₹{item.price}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.banglesId, item.size, item.color)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.banglesId, item.size, item.color, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.banglesId, item.size, item.color, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              {/* Delivery Address */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!user ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">Login to select delivery address</p>
                      <Button variant="outline" onClick={() => navigate("/auth")}>Login</Button>
                    </div>
                  ) : loadingAddresses ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">No addresses saved</p>
                      <Button variant="outline" onClick={() => navigate("/profile")}>Add Address</Button>
                    </div>
                  ) : (
                    <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select address" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id}>
                            <div className="text-left">
                              <p className="font-medium">{addr.address_line1}</p>
                              <p className="text-xs text-muted-foreground">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-display">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span>₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-accent">₹{totalAmount}</span>
                  </div>
                  <Button
                    className="w-full gradient-gold text-foreground"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={placingOrder || items.length === 0}
                  >
                    {placingOrder && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Place Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
