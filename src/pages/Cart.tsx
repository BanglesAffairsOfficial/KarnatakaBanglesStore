import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Trash2, Plus, Minus, MapPin, AlertCircle, Store, Truck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface DeliveryAddress {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

type DeliveryOption = "pickup" | "delivery";

const DELIVERY_CHARGES = {
  pickup: 25,
  delivery: 200,
};

// Helper function to check if profile is complete
const checkProfileComplete = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone, address")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error checking profile:", error);
    return { isComplete: false, profile: null };
  }

  return {
    isComplete: !!(data?.full_name && data?.phone && data?.address),
    profile: data
  };
};

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("pickup");

  useEffect(() => {
    if (!authLoading && user) {
      fetchAddresses();
      checkProfile();
    } else if (!authLoading && !user) {
      setLoadingAddresses(false);
      setCheckingProfile(false);
    }
  }, [user, authLoading]);

  const checkProfile = async () => {
    if (!user) return;
    
    const { isComplete } = await checkProfileComplete(user.id);
    setProfileComplete(isComplete);
    setCheckingProfile(false);
  };

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

  const deliveryCharge = DELIVERY_CHARGES[deliveryOption];
  const finalTotal = totalAmount + deliveryCharge;

  const handlePlaceOrder = async () => {
    // STEP 1: Check if user is logged in
    if (!user) {
      toast({ 
        title: "Please login", 
        description: "You need to be logged in to place an order.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // STEP 2: Check if cart has items
    if (items.length === 0) {
      toast({ 
        title: "Cart is empty", 
        variant: "destructive" 
      });
      return;
    }

    setPlacingOrder(true);

    // STEP 3: Verify profile is complete (REQUIRED FIELDS)
    const { isComplete, profile } = await checkProfileComplete(user.id);
    
    if (!isComplete) {
      toast({
        title: "Complete your profile",
        description: "Please fill in your Name, Phone Number, and Address before placing an order.",
        variant: "destructive",
      });
      setPlacingOrder(false);
      navigate("/profile");
      return;
    }

    // STEP 4: Check if delivery address is selected (only for home delivery)
    if (deliveryOption === "delivery") {
      if (!selectedAddressId) {
        toast({ 
          title: "Select delivery address", 
          description: "Please select or add a delivery address.", 
          variant: "destructive" 
        });
        setPlacingOrder(false);
        return;
      }

      // Verify the selected address still exists
      const addressExists = addresses.find(a => a.id === selectedAddressId);
      if (!addressExists) {
        toast({
          title: "Invalid address",
          description: "Please select a valid delivery address.",
          variant: "destructive"
        });
        setPlacingOrder(false);
        return;
      }
    }

    // STEP 5: All validations passed - Create order
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: finalTotal,
          delivery_address_id: deliveryOption === "delivery" ? selectedAddressId : null,
          status: "pending",
          delivery_type: deliveryOption,
          delivery_charge: deliveryCharge,
        })
        .select()
        .single();

      if (orderError || !orderData) {
        console.error("Order creation error:", orderError);
        toast({ 
          title: "Failed to create order", 
          description: orderError?.message || "Please try again.",
          variant: "destructive" 
        });
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

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items error:", itemsError);
        toast({ 
          title: "Failed to add order items", 
          description: itemsError.message || "Please contact support.",
          variant: "destructive" 
        });
        setPlacingOrder(false);
        return;
      }

      // Success!
      toast({ 
        title: "Order placed successfully!", 
        description: `Order #${orderData.id.slice(0, 8)} has been placed.` 
      });
      
      clearCart();
      navigate("/profile?tab=orders");

    } catch (error) {
      console.error("Unexpected error placing order:", error);
      toast({
        title: "Error placing order",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Shopping Cart</h1>

        {/* Profile Completion Warning */}
        {user && !checkingProfile && !profileComplete && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Complete Your Profile</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Please complete your profile (Name, Phone, Address) before placing an order.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => navigate("/profile")}
              >
                Complete Profile
              </Button>
            </div>
          </div>
        )}

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
              {/* Delivery Options */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-display">Delivery Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={deliveryOption} onValueChange={(value) => setDeliveryOption(value as DeliveryOption)}>
                    <div className="space-y-4">
                      {/* Store Pickup Option */}
                      <div className={`border rounded-lg p-4 cursor-pointer transition-all ${deliveryOption === "pickup" ? "border-accent bg-accent/5" : "border-border"}`}>
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                          <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                              <Store className="w-5 h-5 text-accent" />
                              <span className="font-semibold text-base"> Store Pickup (Bangalore Only)</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Take Away – ₹25
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Place your order, and we’ll pack your bangles securely. You can collect them from our store or send your own delivery partner (like Dunzo) for pickup. Convenient and budget-friendly for Bangalore customers.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">✔ Secure packing</span>
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">✔ Quick pickup</span>
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">✔ Ideal if you're nearby</span>
                            </div>
                          </Label>
                        </div>
                      </div>

                      {/* Home Delivery Option */}
                      <div className={`border rounded-lg p-4 cursor-pointer transition-all ${deliveryOption === "delivery" ? "border-accent bg-accent/5" : "border-border"}`}>
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
                          <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="w-5 h-5 text-accent" />
                              <span className="font-semibold text-base"> Store Delivery (Outside Bangalore)</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Delivery – Starting from ₹200*
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Not in Bangalore? No problem. Share your delivery address and we'll ship your bangles to you. Your order will reach you safely within a 2-3 days. *Delivery charges vary based on your location.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">✔ Doorstep delivery</span>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">✔ Safe packaging</span>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">✔ Out-station customers</span>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Delivery Address - Only show for home delivery */}
              {deliveryOption === "delivery" && (
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
                        <Button variant="outline" onClick={() => navigate("/profile?tab=addresses")}>
                          Add Address
                        </Button>
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
                    
                    {user && addresses.length > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2 p-0 h-auto"
                        onClick={() => navigate("/profile?tab=addresses")}
                      >
                        Manage Addresses
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

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
                    <span>{deliveryOption === "pickup" ? "Pickup Charge" : "Delivery Charge"}</span>
                    <span>₹{deliveryCharge}</span>
                  </div>
                  
                  <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-accent">₹{finalTotal}</span>
                  </div>
                  <Button
                    className="w-full gradient-gold text-foreground"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={placingOrder || items.length === 0 || !user || (user && !profileComplete)}
                  >
                    {placingOrder && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {!user ? "Login to Place Order" : !profileComplete ? "Complete Profile First" : "Place Order"}
                  </Button>
                  
                  {user && !profileComplete && (
                    <p className="text-xs text-center text-muted-foreground">
                      Complete your profile to enable checkout
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}