import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, MapPin, Package, Plus, Trash2, RotateCcw } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface Profile {
  full_name: string | null;
  phone: string | null;
  email: string | null;
  shop_name: string | null;
  gst_no: string | null;
  address: string | null;
  pincode: string | null;
  transport_name: string | null;
  profile_pic_url: string | null;
}

interface DeliveryAddress {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  bangle_id: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
}

interface ParsedColor {
  name: string;
  hex: string;
}

const parseColor = (color: string): ParsedColor => {
  try {
    if (color.includes("{")) {
      return JSON.parse(color);
    }
    return { name: color, hex: "#888888" };
  } catch {
    return { name: color, hex: "#888888" };
  }
};

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    phone: "",
    email: "",
    shop_name: "",
    gst_no: "",
    address: "",
    pincode: "",
    transport_name: "",
    profile_pic_url: null,
  });
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData) {
      setProfile({
        full_name: profileData.full_name || "",
        phone: profileData.phone || "",
        email: profileData.email || user.email || "",
        shop_name: (profileData as any).shop_name || "",
        gst_no: (profileData as any).gst_no || "",
        address: (profileData as any).address || "",
        pincode: (profileData as any).pincode || "",
        transport_name: (profileData as any).transport_name || "",
        profile_pic_url: (profileData as any).profile_pic_url || null,
      });
    }

    // Fetch addresses
    const { data: addressData } = await supabase
      .from("delivery_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (addressData) {
      setAddresses(addressData);
    }

    // Fetch orders
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (orderData) {
      setOrders(orderData);
    }

    setLoading(false);
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        shop_name: profile.shop_name,
        gst_no: profile.gst_no,
        address: profile.address,
        pincode: profile.pincode,
        transport_name: profile.transport_name,
        profile_pic_url: profile.profile_pic_url,
      } as any)
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    }

    setSaving(false);
  };

  const handleAddAddress = async () => {
    if (!user) return;
    
    if (!newAddress.address_line1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required address fields.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("delivery_addresses").insert({
      user_id: user.id,
      ...newAddress,
      is_default: addresses.length === 0,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add address. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Address added",
        description: "Your delivery address has been added.",
      });
      setNewAddress({ address_line1: "", address_line2: "", city: "", state: "", pincode: "" });
      setShowAddressForm(false);
      fetchData();
    }

    setSaving(false);
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase
      .from("delivery_addresses")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Address deleted" });
      fetchData();
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;

    // Remove default from all
    await supabase
      .from("delivery_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);

    // Set new default
    await supabase
      .from("delivery_addresses")
      .update({ is_default: true })
      .eq("id", id);

    toast({ title: "Default address updated" });
    fetchData();
  };

  const handleRepeatOrder = async (orderId: string) => {
    // Fetch order items
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*, bangles:bangle_id(name, image_url)")
      .eq("order_id", orderId);

    if (!orderItems || orderItems.length === 0) {
      toast({ title: "Could not load order items", variant: "destructive" });
      return;
    }

    // Add each item to cart
    orderItems.forEach((item: any) => {
      const parsed = parseColor(item.color);
      addItem({
        banglesId: item.bangle_id,
        name: item.bangles?.name || "Bangle",
        price: Number(item.price),
        imageUrl: item.bangles?.image_url || undefined,
        size: item.size,
        color: parsed.name,
        colorHex: parsed.hex,
        quantity: item.quantity,
      });
    });

    toast({ title: "Items added to cart!", description: "Go to cart to complete your order." });
    navigate("/cart");
  };

  // OrderCard component
  const OrderCard = ({ order, onRepeat }: { order: Order; onRepeat: (id: string) => void }) => (
    <div className="p-4 rounded-lg border border-border">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-accent">₹{Number(order.total_amount)}</p>
          <span className={`text-xs px-2 py-1 rounded ${
            order.status === "completed" ? "bg-green-100 text-green-800" :
            order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
            "bg-muted text-muted-foreground"
          }`}>
            {order.status}
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 gap-2"
        onClick={() => onRepeat(order.id)}
      >
        <RotateCcw className="w-4 h-4" />
        Repeat Order
      </Button>
    </div>
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">My Profile</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              <MapPin className="w-4 h-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-start gap-6">
                  <div className="w-32">
                    <Label className="mb-2 block">Profile Photo</Label>
                    <ImageUpload
                      bucket="profile-pics"
                      folder={user?.id || "temp"}
                      currentImageUrl={profile.profile_pic_url}
                      onUpload={(url) => setProfile({ ...profile, profile_pic_url: url })}
                      onRemove={() => setProfile({ ...profile, profile_pic_url: null })}
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email || ""} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Name *</Label>
                      <Input
                        value={profile.full_name || ""}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shop Name</Label>
                    <Input
                      value={profile.shop_name || ""}
                      onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
                      placeholder="Enter your shop name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GST No.</Label>
                    <Input
                      value={profile.gst_no || ""}
                      onChange={(e) => setProfile({ ...profile, gst_no: e.target.value })}
                      placeholder="e.g., 29ABCDE1234F1Z5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input
                      value={profile.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Transport Name</Label>
                    <Input
                      value={profile.transport_name || ""}
                      onChange={(e) => setProfile({ ...profile, transport_name: e.target.value })}
                      placeholder="Preferred transport service"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input
                      value={profile.pincode || ""}
                      onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                      placeholder="Enter pincode"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={profile.address || ""}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Enter your full address"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  className="gradient-gold text-foreground"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card className="shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display">Delivery Addresses</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddressForm && (
                  <div className="p-4 bg-secondary rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Address Line 1 *</Label>
                        <Input
                          value={newAddress.address_line1}
                          onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                          placeholder="House/Building No, Street"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address Line 2</Label>
                        <Input
                          value={newAddress.address_line2}
                          onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                          placeholder="Landmark (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>City *</Label>
                        <Input
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State *</Label>
                        <Input
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          placeholder="State"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pincode *</Label>
                        <Input
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                          placeholder="Pincode"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddAddress} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Address
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddressForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No addresses saved yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-lg border ${addr.is_default ? "border-accent bg-accent/5" : "border-border"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            {addr.is_default && (
                              <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded mb-2 inline-block">
                                Default
                              </span>
                            )}
                            <p className="font-medium">{addr.address_line1}</p>
                            {addr.address_line2 && <p className="text-muted-foreground">{addr.address_line2}</p>}
                            <p className="text-muted-foreground">
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!addr.is_default && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetDefaultAddress(addr.id)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display">Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onRepeat={handleRepeatOrder}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
