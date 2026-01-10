import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, User, MapPin, Package, Plus, Trash2, RotateCcw, 
  AlertCircle, CheckCircle2, Clock, XCircle, Truck, ShoppingCart 
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { useTranslation } from "react-i18next";
import { parseColors, getColorHex, getColorSwatchStyle } from "@/lib/colorHelpers";

interface Profile {
  full_name: string;
  phone: string;
  email: string;
  shop_name: string;
  gst_no: string;
  address: string;
  pincode: string;
  transport_name: string;
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

interface OrderItem {
  id: string;
  bangle_id: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
  bangles: {
    name: string;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  total_amount?: number | null;
  total?: number | null;
  status: string;
  created_at: string;
  delivery_addresses: {
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    pincode: string;
  } | null;
  order_items: OrderItem[];
}

interface ParsedColor {
  name: string;
  hex: string;
  swatchImage?: string;
}

const parseColor = (color: string): ParsedColor => {
  const parsed = parseColors([color])[0];
  if (parsed) return parsed;
  return { name: color, hex: getColorHex(color) };
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "shipped":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "delivered":
      return <CheckCircle2 className="w-4 h-4" />;
    case "pending":
      return <Clock className="w-4 h-4" />;
    case "processing":
      return <Package className="w-4 h-4" />;
    case "shipped":
      return <Truck className="w-4 h-4" />;
    case "cancelled":
      return <XCircle className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
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

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          email: profileData.email || user.email || "",
          shop_name: profileData.shop_name || "",
          gst_no: profileData.gst_no || "",
          address: profileData.address || "",
          pincode: profileData.pincode || "",
          transport_name: profileData.transport_name || "",
          profile_pic_url: profileData.profile_pic_url || null,
        });
      } else {
        // Create initial profile
        const newProfile = {
          id: user.id,
          email: user.email || "",
          full_name: "",
          phone: "",
          shop_name: "",
          gst_no: "",
          address: "",
          pincode: "",
          transport_name: "",
          profile_pic_url: null,
        };
        
        const { error: insertError } = await supabase
          .from("profiles")
          .insert(newProfile);
          
        if (!insertError) {
          setProfile({
            full_name: "",
            phone: "",
            email: user.email || "",
            shop_name: "",
            gst_no: "",
            address: "",
            pincode: "",
            transport_name: "",
            profile_pic_url: null,
          });
        }
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

      // Fetch orders with related data
      const { data: orderData } = await supabase
        .from("orders")
        .select(`
          *,
          delivery_addresses(address_line1, address_line2, city, state, pincode),
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (orderData) {
        setOrders(orderData as Order[]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast({
        title: t("profile.toast.loadErrorTitle"),
        description: t("profile.toast.loadErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!profile.full_name?.trim()) {
      errors.full_name = "profile.errors.name";
    }
    
    if (!profile.phone?.trim()) {
      errors.phone = "profile.errors.phone";
    } else if (!/^\d{10}$/.test(profile.phone.replace(/\D/g, ''))) {
      errors.phone = "profile.errors.phoneInvalid";
    }
    
    if (!profile.address?.trim()) {
      errors.address = "profile.errors.address";
    }

    if (profile.gst_no && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(profile.gst_no)) {
      errors.gst_no = "profile.errors.gst";
    }

    if (profile.pincode && !/^\d{6}$/.test(profile.pincode)) {
      errors.pincode = "profile.errors.pincode";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    if (!validateProfile()) {
      toast({
        title: t("profile.toast.validationTitle"),
        description: t("profile.toast.validationDesc"),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        email: profile.email || user.email,
        shop_name: profile.shop_name.trim() || null,
        gst_no: profile.gst_no.trim() || null,
        address: profile.address.trim(),
        pincode: profile.pincode.trim() || null,
        transport_name: profile.transport_name.trim() || null,
        profile_pic_url: profile.profile_pic_url,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        console.error("Profile update error:", error);
        toast({
          title: t("profile.toast.updateErrorTitle"),
          description: error.message || t("profile.toast.tryAgain"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("profile.toast.updateSuccessTitle"),
          description: t("profile.toast.updateSuccessDesc"),
        });
        
        await fetchData();
      }
    } catch (err) {
      console.error("Unexpected error updating profile:", err);
      toast({
        title: "Error updating profile",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!user) return;
    
    if (!newAddress.address_line1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast({
        title: t("profile.toast.addressMissingTitle"),
        description: t("profile.toast.addressMissingDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{6}$/.test(newAddress.pincode)) {
      toast({
        title: t("profile.toast.pincodeInvalidTitle"),
        description: t("profile.toast.pincodeInvalidDesc"),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("delivery_addresses").insert({
        user_id: user.id,
        ...newAddress,
        is_default: addresses.length === 0,
      });

      if (error) {
        console.error("Add address error:", error);
        toast({
          title: t("profile.toast.addAddressErrorTitle"),
          description: error.message || t("profile.toast.tryAgain"),
          variant: "destructive",
        });
      } else {
        setNewAddress({ address_line1: "", address_line2: "", city: "", state: "", pincode: "" });
        toast({
          title: t("profile.toast.addAddressSuccessTitle"),
          description: t("profile.toast.addAddressSuccessDesc"),
        });
        setShowAddressForm(false);
        await fetchData();
      }
    } catch (err) {
      console.error("Unexpected error adding address:", err);
      toast({
        title: t("profile.toast.addAddressErrorTitle"),
        description: t("profile.toast.unexpected"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase
      .from("delivery_addresses")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: t("profile.toast.addressDeleted") });
      await fetchData();
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;

    await supabase
      .from("delivery_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);

    await supabase
      .from("delivery_addresses")
      .update({ is_default: true })
      .eq("id", id);

    toast({ title: t("profile.toast.defaultUpdated") });
    await fetchData();
  };

  const handleRepeatOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.order_items || order.order_items.length === 0) {
      toast({ title: t("profile.toast.orderLoadError"), variant: "destructive" });
      return;
    }

    let itemsAdded = 0;
    order.order_items.forEach((item) => {
      if (item.bangles) {
        const parsed = parseColor(item.color);
        addItem({
          banglesId: item.bangle_id,
          name: item.bangles.name || "Bangle",
          price: Number(item.price),
          imageUrl: item.bangles.image_url || undefined,
          size: item.size,
          color: parsed.name,
          colorHex: parsed.hex,
          quantity: item.quantity,
        });
        itemsAdded++;
      }
    });

    if (itemsAdded > 0) {
      toast({ 
        title: t("profile.toast.repeatSuccessTitle"), 
        description: t("profile.toast.repeatSuccessDesc", { count: itemsAdded }) 
      });
      navigate("/cart");
    } else {
      toast({ 
        title: t("profile.toast.repeatEmptyTitle"), 
        description: t("profile.toast.repeatEmptyDesc"),
        variant: "destructive" 
      });
    }
  };

  const isProfileComplete = () => {
    return profile.full_name?.trim() && 
           profile.phone?.trim() && 
           profile.address?.trim();
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <div className="p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-semibold text-lg">Order #{order.id.slice(0, 8)}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-2xl text-accent">₹{Number(order.total_amount ?? (order as any).total ?? 0).toLocaleString()}</p>
          <Badge className={`mt-2 gap-1 ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span className="capitalize">{order.status}</span>
          </Badge>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-3 mb-4">
        {order.order_items.map((item) => {
          const parsed = parseColor(item.color);
          return (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="w-12 h-12 bg-background rounded-md overflow-hidden flex-shrink-0">
                {item.bangles?.image_url ? (
                  <img src={item.bangles.image_url} alt={item.bangles.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="notranslate font-medium text-sm truncate">{item.bangles?.name || t("profile.bangle")}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{t("profile.size")}: {item.size}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={getColorSwatchStyle(parsed)}
                    />
                    <span>{parsed.name}</span>
                  </div>
                  <span>•</span>
                  <span>{t("profile.qty")}: {item.quantity}</span>
                </div>
              </div>
              <p className="font-semibold text-sm">₹{Number(item.price).toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Delivery Address */}
      {order.delivery_addresses && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-semibold text-muted-foreground mb-1">{t("profile.deliveryAddress")}</p>
          <p className="text-sm">{order.delivery_addresses.address_line1}</p>
          {order.delivery_addresses.address_line2 && (
            <p className="text-sm">{order.delivery_addresses.address_line2}</p>
          )}
          <p className="text-sm">
            {order.delivery_addresses.city}, {order.delivery_addresses.state} - {order.delivery_addresses.pincode}
          </p>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => handleRepeatOrder(order.id)}
      >
        <RotateCcw className="w-4 h-4" />
        {t("orders.repeatOrder")}
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
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">{t("profile.title")}</h1>

        {!isProfileComplete() && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">{t("profile.incomplete.title")}</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t("profile.incomplete.desc")}
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue={defaultTab === "orders" ? "profile" : defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              {t("profile.tabs.profile")}
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              <MapPin className="w-4 h-4" />
              {t("profile.tabs.addresses")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display">{t("profile.customerInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="w-32">
                    <Label className="mb-2 block">{t("profile.photo")}</Label>
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
                      <Label>{t("profile.email")}</Label>
                      <Input value={user?.email || ""} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                    <Label>{t("profile.name")} *</Label>
                      <Input
                        value={profile.full_name}
                        onChange={(e) => {
                          setProfile({ ...profile, full_name: e.target.value });
                          if (validationErrors.full_name) {
                            setValidationErrors({ ...validationErrors, full_name: "" });
                          }
                        }}
                        placeholder={t("profile.namePlaceholder")}
                        className={validationErrors.full_name ? "border-red-500" : ""}
                      />
                      {validationErrors.full_name && (
                        <p className="text-sm text-red-500">{validationErrors.full_name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("profile.shopName")}</Label>
                    <Input
                      value={profile.shop_name}
                      onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
                      placeholder={t("profile.shopPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("profile.gst")}</Label>
                    <Input
                      value={profile.gst_no}
                      onChange={(e) => {
                        setProfile({ ...profile, gst_no: e.target.value });
                        if (validationErrors.gst_no) {
                          setValidationErrors({ ...validationErrors, gst_no: "" });
                        }
                      }}
                      placeholder={t("profile.gstPlaceholder")}
                      className={validationErrors.gst_no ? "border-red-500" : ""}
                    />
                    {validationErrors.gst_no && (
                      <p className="text-sm text-red-500">{validationErrors.gst_no}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("profile.phone")} *</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => {
                        setProfile({ ...profile, phone: e.target.value });
                        if (validationErrors.phone) {
                          setValidationErrors({ ...validationErrors, phone: "" });
                        }
                      }}
                      placeholder={t("profile.phonePlaceholder")}
                      className={validationErrors.phone ? "border-red-500" : ""}
                    />
                    {validationErrors.phone && (
                      <p className="text-sm text-red-500">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("profile.transport")}</Label>
                    <Input
                      value={profile.transport_name}
                      onChange={(e) => setProfile({ ...profile, transport_name: e.target.value })}
                      placeholder="Preferred transport service"
                    />
                  </div>
                  <div className="space-y-2">
                    
                  </div>
                </div>

            

                <Button
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  className="gradient-gold text-foreground"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("profile.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card className="shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display">{t("profile.addressesTitle")}</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t("profile.addAddress")}
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
                        {t("profile.addressSave")}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddressForm(false)}>
                        {t("profile.cancel")}
                      </Button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t("profile.noAddresses")}</p>
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
                                {t("profile.setDefault")}
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

        </Tabs>
      </div>
    </div>
  );
}
