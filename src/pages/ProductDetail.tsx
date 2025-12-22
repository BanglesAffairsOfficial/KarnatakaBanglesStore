import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumericStepper } from "@/components/NumericStepper";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ShoppingBag, Trash2, Heart, Share2, Truck, Shield, RotateCcw, Star, MapPin } from "lucide-react";

interface Bangle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available_colors: string[];
  available_sizes: string[];
  created_at: string;
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
    return { name: color, hex: getDefaultHex(color) };
  } catch {
    return { name: color, hex: getDefaultHex(color) };
  }
};

const getDefaultHex = (colorName: string): string => {
  const defaultColors: Record<string, string> = {
    Red: "#dc2626",
    Orange: "#ea580c",
    Yellow: "#eab308",
    Green: "#16a34a",
    Lime: "#65a30d",
    Blue: "#2563eb",
    Pink: "#db2777",
    Purple: "#9333ea",
  };
  return defaultColors[colorName] || "#888888";
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bangle, setBangle] = useState<Bangle | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Bangle[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBangle();
    }
  }, [id]);

  const fetchBangle = async () => {
    try {
      const { data, error } = await supabase
        .from("bangles")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error fetching bangle:", error);
        setBangle(null);
      } else if (data) {
        setBangle(data);
        // Fetch related products
        const { data: related } = await supabase
          .from("bangles")
          .select("*")
          .eq("is_active", true)
          .neq("id", id)
          .limit(4);
        if (related) setRelatedProducts(related);
      }
    } catch (err) {
      console.error("Failed to fetch product:", err);
      setBangle(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (color: string, size: string, value: string) => {
    const key = `${color}-${size}`;
    const numValue = parseInt(value) || 0;
    setQuantities(prev => ({
      ...prev,
      [key]: numValue > 0 ? numValue : 0,
    }));
  };

  const getQuantity = (color: string, size: string): string => {
    const key = `${color}-${size}`;
    const qty = quantities[key];
    return qty && qty > 0 ? qty.toString() : "";
  };

  const parsedColors = useMemo(() => {
    if (!bangle?.available_colors) return [];
    return bangle.available_colors.map(parseColor);
  }, [bangle?.available_colors]);

  const getColorHex = (colorName: string): string => {
    const found = parsedColors.find(c => c.name === colorName);
    return found?.hex || getDefaultHex(colorName);
  };

  const selections = useMemo(() => {
    return Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([key, qty]) => {
        const [color, size] = key.split("-");
        return { color, size, quantity: qty };
      });
  }, [quantities]);

  const totalQuantity = useMemo(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  }, [quantities]);

  const totalAmount = useMemo(() => {
    return totalQuantity * (bangle?.price || 0);
  }, [totalQuantity, bangle?.price]);

  const handleClear = () => {
    setQuantities({});
  };

  const handleCheckDelivery = () => {
    if (!pincode || pincode.length !== 6) {
      toast({
        title: "Invalid pincode",
        description: "Please enter a valid 6-digit pincode.",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate delivery check
    setDeliveryInfo(`Delivery in 5-7 business days to ${pincode}`);
    toast({
      title: "Delivery available",
      description: `We deliver to pincode ${pincode} in 5-7 business days.`,
    });
  };

  const handleProceed = () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to place an order.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (totalQuantity === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one bangle to proceed.",
        variant: "destructive",
      });
      return;
    }

    // Store selections in sessionStorage for checkout
    sessionStorage.setItem("pendingOrder", JSON.stringify({
      bangleId: bangle?.id,
      bangleName: bangle?.name,
      pricePerUnit: bangle?.price,
      selections,
      totalQuantity,
      totalAmount,
    }));

    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!bangle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product not found</h1>
          <Button onClick={() => navigate("/")}>Go back to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="bg-card rounded-xl shadow-elegant p-6 border border-border aspect-square flex items-center justify-center">
            {bangle.image_url ? (
              <img
                src={bangle.image_url}
                alt={bangle.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center flex-col gap-4">
                <div className="flex gap-2">
                  {parsedColors.slice(0, 4).map((color, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 rounded-lg shadow-lg"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <Badge className="mb-3">In Stock</Badge>
            <h1 className="text-4xl font-display font-bold text-foreground mb-3">
              {bangle.name}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(127 reviews)</span>
            </div>

            {/* Description */}
            {bangle.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed">{bangle.description}</p>
            )}

            {/* Price */}
            <div className="bg-secondary p-4 rounded-lg mb-6">
              <div className="text-sm text-muted-foreground mb-1">Price per piece</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-accent">₹{Number(bangle.price)}</div>
                <span className="text-lg text-muted-foreground line-through">₹{Number((bangle.price * 1.2).toFixed(0))}</span>
                <Badge variant="destructive">20% OFF</Badge>
              </div>
            </div>

            {/* Colors */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">Available Colors</h3>
              <div className="flex flex-wrap gap-3">
                {parsedColors.map((color, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary cursor-pointer transition"
                    title={color.name}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg shadow-sm ring-2 ring-border"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-xs text-muted-foreground">{color.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => setWishlist(!wishlist)}
              >
                <Heart className={`w-5 h-5 ${wishlist ? 'fill-red-500 text-red-500' : ''}`} />
                Wishlist
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Share2 className="w-5 h-5" />
                Share
              </Button>
            </div>

            {/* Delivery Check */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Check Delivery
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                  className="bg-background"
                />
                <Button onClick={handleCheckDelivery} variant="outline">Check</Button>
              </div>
              {deliveryInfo && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">✓ {deliveryInfo}</p>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border border-border rounded-lg">
                <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs font-semibold">Secure Payment</p>
              </div>
              <div className="text-center p-3 border border-border rounded-lg">
                <RotateCcw className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs font-semibold">7-Day Returns</p>
              </div>
              <div className="text-center p-3 border border-border rounded-lg">
                <Truck className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs font-semibold">Free Shipping</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Board & Order Summary */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Selection Board */}
          <div className="lg:col-span-2 bg-card rounded-xl shadow-elegant p-6 border border-border">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6 flex items-center gap-3">
              <span className="w-8 h-8 gradient-gold rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-foreground" />
              </span>
              Select Size & Color Quantities
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-border bg-secondary p-3 text-left font-semibold text-foreground min-w-[100px]">
                      <div className="text-sm uppercase tracking-wide">Size →</div>
                      <div className="text-xs text-muted-foreground font-normal mt-1">Colors ↓</div>
                    </th>
                    {bangle.available_sizes.map(size => (
                      <th
                        key={size}
                        className="border border-border bg-secondary p-3 text-center font-bold text-foreground min-w-[80px]"
                      >
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedColors.map((color, index) => (
                    <tr key={index}>
                      <td className="border border-border p-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg shadow-sm ring-2 ring-border"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-medium text-foreground">{color.name}</span>
                        </div>
                      </td>
                      {bangle.available_sizes.map(size => (
                        <td key={`${color.name}-${size}`} className="border border-border p-3 text-center">
                          <NumericStepper
                            value={getQuantity(color.name, size) ? parseInt(getQuantity(color.name, size)) : 0}
                            onChange={(val) => handleQuantityChange(color.name, size, val.toString())}
                            min={0}
                            max={999}
                            className="justify-center"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={handleClear}
                className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-card rounded-xl shadow-elegant p-6 border border-border h-fit sticky top-20">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6">Order Summary</h2>

            {selections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No items selected yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                  {selections.map((item) => (
                    <div
                      key={`${item.color}-${item.size}`}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-lg ring-2 ring-border"
                          style={{ backgroundColor: getColorHex(item.color) }}
                        />
                        <div className="text-sm">
                          <span className="font-semibold">{item.color}</span>
                          <span className="mx-1 text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{item.size}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.quantity}×</div>
                        <div className="text-xs text-muted-foreground">₹{Number(bangle.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold">₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between text-lg">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-accent text-xl">₹{totalAmount}</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-6 h-12 text-base font-semibold gradient-gold text-foreground shadow-gold"
                  onClick={handleProceed}
                >
                  Add to Cart
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <Card 
                  key={product.id}
                  className="group cursor-pointer overflow-hidden shadow-elegant hover:shadow-2xl transition-all"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-secondary rounded-lg mb-4 flex items-center justify-center">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded" />
                      ) : (
                        <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-accent">₹{Number(product.price)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {product.available_colors.length} colors
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
