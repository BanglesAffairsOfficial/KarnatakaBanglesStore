import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumericStepper } from "@/components/NumericStepper";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { Loader2, ArrowLeft, ShoppingBag, Trash2, Heart, Share2, Truck, Shield, RotateCcw, Star, MapPin, ZoomIn } from "lucide-react";


interface Bangle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available_colors: any[];
  available_sizes: string[];
  category_id?: string;
  is_active: boolean;
  created_at: string;
}

interface ParsedColor {
  name: string;
  hex: string;
}

const parseColor = (color: any): ParsedColor => {
  try {
    // If it's already an object with name and hex
    if (typeof color === 'object' && color.name && color.hex) {
      return color;
    }
    // If it's a JSON string
    if (typeof color === 'string' && color.includes("{")) {
      return JSON.parse(color);
    }
    // If it's just a color name string
    if (typeof color === 'string') {
      return { name: color, hex: getDefaultHex(color) };
    }
    return { name: String(color), hex: getDefaultHex(String(color)) };
  } catch {
    return { name: String(color), hex: getDefaultHex(String(color)) };
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
  const { addItem } = useCart();
  // Zoom states
const [isZooming, setIsZooming] = useState(false);
const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
const imageRef = useRef<HTMLDivElement>(null);
  
  const [bangle, setBangle] = useState<Bangle | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Bangle[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [occasionNames, setOccasionNames] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pincode, setPincode] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);
  const [selectAllQuantity, setSelectAllQuantity] = useState(0);
  const [columnQuantities, setColumnQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (import.meta.env.DEV) console.log("ProductDetail mounted, id:", id);
    if (id) {
      fetchBangle();
    } else {
      if (import.meta.env.DEV) console.log("No id provided to ProductDetail");
      setLoading(false);
    }
  }, [id]);

  const fetchBangle = async () => {
    try {
      if (import.meta.env.DEV) console.log("Fetching bangle with id:", id);
      const { data, error } = await supabase
        .from("bangles")
        .select("*")
        .eq("id", id)
        .single();

      if (import.meta.env.DEV) console.log("Fetch response - error:", error, "data:", data);

      if (error) {
        console.error("Error fetching bangle:", error);
        toast({
          title: "Error loading product",
          description: "Could not load product details. Please try again.",
          variant: "destructive"
        });
        setBangle(null);
      } else if (data) {
        if (import.meta.env.DEV) console.log("Bangle fetched successfully:", data);
        setBangle(data as any);
        
        // Fetch category name
        if ((data as any).category_id) {
          const { data: cat } = await (supabase as any)
            .from('categories')
            .select('name')
            .eq('id', (data as any).category_id)
            .single();
          if (cat) setCategoryName(cat.name);
        }
        
        // Fetch occasions
        const { data: occLinks } = await (supabase as any)
          .from('bangle_occasions')
          .select('occasion_id')
          .eq('bangle_id', id);
          
        if (occLinks && occLinks.length > 0) {
          const occIds = occLinks.map((o: any) => o.occasion_id);
          const { data: occs } = await (supabase as any)
            .from('occasions')
            .select('name')
            .in('id', occIds);
          if (occs) setOccasionNames(occs.map((o: any) => o.name));
        }
        
        // Fetch related products
        const { data: related } = await supabase
          .from("bangles")
          .select("*")
          .neq("id", id)
          .limit(4);
        if (related) setRelatedProducts(related);
      }
    } catch (err) {
      console.error("Failed to fetch product:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
      setBangle(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  };

  const handleQuantityChange = (color: string, size: string, value: number) => {
    const key = `${color}-${size}`;
    setQuantities(prev => ({
      ...prev,
      [key]: value > 0 ? value : 0,
    }));
  };

  const getQuantity = (color: string, size: string): number => {
    const key = `${color}-${size}`;
    return quantities[key] || 0;
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
  setColumnQuantities({});
  setSelectAllQuantity(0);
};

const handleSelectAll = (quantity: number) => {
  setSelectAllQuantity(quantity);
  if (quantity === 0) {
    setQuantities({});
    setColumnQuantities({});
    return;
  }
  
  const newQuantities: Record<string, number> = {};
  const newColumnQuantities: Record<string, number> = {};
  
  parsedColors.forEach(color => {
    bangle.available_sizes.forEach(size => {
      const key = `${color.name}-${size}`;
      newQuantities[key] = quantity;
    });
  });
  
  bangle.available_sizes.forEach(size => {
    newColumnQuantities[size] = quantity;
  });
  
  setQuantities(newQuantities);
  setColumnQuantities(newColumnQuantities);
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

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add items to cart.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (totalQuantity === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one bangle to add to cart.",
        variant: "destructive",
      });
      return;
    }

    // Add each selection to cart
    selections.forEach(selection => {
      addItem({
        banglesId: bangle!.id,
        name: bangle!.name,
        price: bangle!.price,
        size: selection.size,
        color: selection.color,
        colorHex: getColorHex(selection.color),
        quantity: selection.quantity,
        imageUrl: bangle!.image_url || undefined,
      });
    });

    toast({
      title: "Added to cart",
      description: `${totalQuantity} item(s) added to your cart.`,
    });

    // Clear selections and navigate to cart
    handleClear();
    navigate("/cart");
  };

  const handleShare = async () => {
    const shareData = {
      title: bangle?.name || "Check out this bangle",
      text: `${bangle?.name} - ₹${bangle?.price}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Product link copied to clipboard.",
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
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
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
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
          {/* Product Image with Zoom */}
          <div className="bg-card rounded-xl shadow-elegant p-6 border border-border aspect-square flex items-center justify-center relative overflow-hidden">
            {bangle.image_url ? (
              <div 
                ref={imageRef}
                className="relative w-full h-full cursor-zoom-in"
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={bangle.image_url}
                  alt={bangle.name}
                  className="w-full h-full object-cover rounded-lg transition-opacity duration-200"
                  style={{ opacity: isZooming ? 0 : 1 }}
                />
                
                {/* Zoomed Image Overlay */}
                {isZooming && (
                  <div 
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                      backgroundImage: `url(${bangle.image_url})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundSize: '250%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}
                
                {/* Zoom Indicator */}
                <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                  <ZoomIn className="w-3 h-3" />
                  Hover to zoom
                </div>
              </div>
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
            {categoryName && <Badge className="mb-3 ml-2">{categoryName}</Badge>}
            {occasionNames.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {occasionNames.map((n, i) => <Badge key={i} variant="secondary">{n}</Badge>)}
              </div>
            )}
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
  <div className="text-sm text-muted-foreground mb-1">Price per (Box/Dozen)</div>
  <div className="text-4xl font-bold text-accent">₹{Number(bangle.price)}</div>
</div>  

            {/* Colors */}
            {parsedColors.length > 0 && (
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
            )}

            

            

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

            {bangle.available_sizes.length > 0 && parsedColors.length > 0 ? (
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
              <div className="mb-2">{size}</div>
              <NumericStepper
                value={columnQuantities[size] || 0}
                onChange={(val) => {
                  // Update column quantity state
                  setColumnQuantities(prev => ({
                    ...prev,
                    [size]: val
                  }));
                  
                  // Set this quantity for all colors in this size
                  const newQuantities = { ...quantities };
                  parsedColors.forEach(color => {
                    const key = `${color.name}-${size}`;
                    newQuantities[key] = val;
                  });
                  setQuantities(newQuantities);
                }}
                min={0}
                max={999}
                className="justify-center"
              />
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
                  className="w-10 h-10 rounded-lg shadow-sm ring-2 ring-border flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="font-medium text-foreground">{color.name}</span>
              </div>
            </td>
            {bangle.available_sizes.map(size => (
              <td key={`${color.name}-${size}`} className="border border-border p-3 text-center">
                <NumericStepper
                  value={getQuantity(color.name, size)}
                  onChange={(val) => handleQuantityChange(color.name, size, val)}
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
) : (
  <div className="text-center py-8 text-muted-foreground">
    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
    <p>No sizes or colors available for this product.</p>
  </div>
)}

            <div className="mt-6 flex justify-between items-center">
  <div className="flex items-center gap-3">
    <span className="text-sm font-semibold text-foreground">Select All:</span>
    <NumericStepper
      value={selectAllQuantity}
      onChange={handleSelectAll}
      min={0}
      max={999}
      className="justify-center"
    />
  </div>
  <Button
    variant="outline"
    onClick={handleClear}
    disabled={totalQuantity === 0}
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
                          className="w-6 h-6 rounded-lg ring-2 ring-border flex-shrink-0"
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
  
  <div className="border-t border-border pt-3 flex justify-between text-lg">
    <span className="font-semibold">Total:</span>
    <span className="font-bold text-accent text-xl">₹{totalAmount}</span>
  </div>
</div>

                <Button
                  className="w-full mt-6 h-12 text-base font-semibold gradient-gold text-foreground shadow-gold"
                  onClick={handleAddToCart}
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
              {relatedProducts.map((product) => {
                const productColors = product.available_colors?.map(parseColor) || [];
                return (
                  <Card 
                    key={product.id}
                    className="group cursor-pointer overflow-hidden shadow-elegant hover:shadow-2xl transition-all"
                    onClick={() => {
                      navigate(`/product/${product.id}`);
                      window.scrollTo(0, 0);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-secondary rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-accent">₹{Number(product.price)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {productColors.length} colors
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}