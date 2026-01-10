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
import { useTranslation } from "react-i18next";
import { parseColors, getColorHex as getColorHexFromMap, getColorSwatchStyle } from "@/lib/colorHelpers";


interface Bangle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  secondary_image_url?: string | null;
  available_colors: any[];
  available_sizes: string[];
  category_id?: string;
  is_active: boolean;
  created_at: string;
}

interface ParsedColor {
  name: string;
  hex: string;
  swatchImage?: string;
}

const DEFAULT_COLORS: ParsedColor[] = [
  { name: "Red", hex: "#dc2626" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Green", hex: "#16a34a" },
  { name: "Lime", hex: "#65a30d" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Pink", hex: "#db2777" },
  { name: "Radium", hex: "#00c76a" },
  { name: "Wine", hex: "#722f37" },
  { name: "Jamuni", hex: "#5b2b6f" },
  { name: "Lavender", hex: "#c8b7e8" },
  { name: "Peacock", hex: "#0f4c5c" },
  { name: "Pista", hex: "#b5d99c" },
  { name: "Surf", hex: "#30aadd" },
  { name: "Sentro", hex: "#3ba99c" },
  { name: "Parrot", hex: "#80c904" },
  { name: "Strawberry", hex: "#e83f6f" },
  { name: "Mehendi", hex: "#7a9a01" },
  { name: "Gold", hex: "#f59e0b" },
  { name: "Carrot", hex: "#ed6a1f" },
  { name: "Onion", hex: "#b56576" },
  { name: "White", hex: "#f9fafb" },
  { name: "Grey", hex: "#9ca3af" },
  { name: "Rose Gold", hex: "#ff9500" },
  { name: "Rani", hex: "#c71585" },
  { name: "Navy Blue", hex: "#1d3557" },
  { name: "Kishmashi", hex: "#c9b164" },
  { name: "Dhaani", hex: "#b5ce5a" },
  { name: "C Green", hex: "#2e8b57" },
  { name: "Olive", hex: "#00ffbf" },
  { name: "Black", hex: "#1f2937" },
  { name: "Peach", hex: "#ffb07c" },
  { name: "Ferozi", hex: "#0fc7c7" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Dark multi color", hex: "#4b5563", swatchImage: "/DarkMulti.jpg" },
  { name: "Light multi color", hex: "#e5e7eb", swatchImage: "/LightMulti.jpg" },
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { t } = useTranslation();
  // Zoom states
const [isZooming, setIsZooming] = useState(false);
const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
const imageRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  
  const [bangle, setBangle] = useState<Bangle | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Bangle[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pincode, setPincode] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);
  const [selectAllQuantity, setSelectAllQuantity] = useState(0);
  const [columnQuantities, setColumnQuantities] = useState<Record<string, number>>({});
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileColor, setActiveMobileColor] = useState<string | null>(null);
  const parsedColors = useMemo<ParsedColor[]>(() => {
    const parsed = parseColors(bangle?.available_colors);
    const base = parsed.length ? parsed : DEFAULT_COLORS;

    // Merge with defaults to ensure full palette, then sort by default order
    const merged = new Map<string, ParsedColor>();
    base.forEach((c) => merged.set(c.name.toLowerCase(), c));
    DEFAULT_COLORS.forEach((c) => {
      if (!merged.has(c.name.toLowerCase())) merged.set(c.name.toLowerCase(), c);
    });

    const defaultOrder = new Map(DEFAULT_COLORS.map((c, i) => [c.name.toLowerCase(), i]));
    return Array.from(merged.values()).sort((a, b) => {
      const ai = defaultOrder.get(a.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const bi = defaultOrder.get(b.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    });
  }, [bangle?.available_colors]);

  const getColorHex = (colorName: string): string => {
    const found = parsedColors.find(c => c.name === colorName);
    return found?.hex || getColorHexFromMap(colorName);
  };

  const getWishlistIds = () => {
    try {
      return JSON.parse(localStorage.getItem("wishlistIds") || "[]") as string[];
    } catch {
      return [];
    }
  };

  const setWishlistIds = (ids: string[]) => {
    localStorage.setItem("wishlistIds", JSON.stringify(ids));
  };

  useEffect(() => {
    if (import.meta.env.DEV) console.log("ProductDetail mounted, id:", id);
    if (id) {
      fetchBangle();
    } else {
      if (import.meta.env.DEV) console.log("No id provided to ProductDetail");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const ids = getWishlistIds();
    setIsInWishlist(ids.includes(id));
  }, [id]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handleChange = () => setIsMobile(mq.matches);
    handleChange();
    mq.addEventListener ? mq.addEventListener("change", handleChange) : mq.addListener(handleChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", handleChange) : mq.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    if (!activeMobileColor && parsedColors.length > 0) {
      setActiveMobileColor(parsedColors[0].name);
    }
  }, [isMobile, parsedColors, activeMobileColor]);

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
          title: t("productDetail.toast.loadErrorTitle"),
          description: t("productDetail.toast.loadErrorDesc"),
          variant: "destructive"
        });
        setBangle(null);
      } else if (data) {
        if (import.meta.env.DEV) console.log("Bangle fetched successfully:", data);
        setBangle(data as any);
        setIsInWishlist(getWishlistIds().includes(id!));
        
        // Fetch category name
        if ((data as any).category_id) {
          const { data: cat } = await (supabase as any)
            .from('categories')
            .select('name')
            .eq('id', (data as any).category_id)
            .single();
          if (cat) setCategoryName(cat.name);
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
        title: t("productDetail.toast.unexpectedTitle"),
        description: t("productDetail.toast.unexpectedDesc"),
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

  const getColorTotal = (colorName: string): number => {
    if (!bangle) return 0;
    return bangle.available_sizes.reduce((sum, size) => sum + getQuantity(colorName, size), 0);
  };

  const inStock = Boolean(bangle?.is_active);

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

  const images = useMemo(() => {
    if (!bangle) return [];
    const urls = [bangle.image_url, bangle.secondary_image_url].filter((url): url is string => Boolean(url));
    return Array.from(new Set(urls));
  }, [bangle]);

  useEffect(() => {
    setActiveImage(images[0] || null);
  }, [images]);

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
        title: t("productDetail.toast.invalidPincodeTitle"),
        description: t("productDetail.toast.invalidPincodeDesc"),
        variant: "destructive",
      });
      return;
    }
    
    // Simulate delivery check
    setDeliveryInfo(t("productDetail.deliveryInfo", { pincode }));
    toast({
      title: t("productDetail.toast.deliveryAvailableTitle"),
      description: t("productDetail.toast.deliveryAvailableDesc", { pincode }),
    });
  };

  const handleAddToCart = () => {
    if (!inStock) {
      toast({
        title: t("productDetail.toast.noItemsTitle"),
        description: t("productDetail.outOfStock"),
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: t("productDetail.toast.loginTitle"),
        description: t("productDetail.toast.loginDesc"),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (totalQuantity === 0) {
      toast({
        title: t("productDetail.toast.noItemsTitle"),
        description: t("productDetail.toast.noItemsDesc"),
        variant: "destructive",
      });
      return;
    }

    // Add each selection to cart
    const primaryImage = activeImage || bangle!.image_url || bangle!.secondary_image_url || undefined;
    selections.forEach(selection => {
      addItem({
        banglesId: bangle!.id,
        name: bangle!.name,
        price: bangle!.price,
        size: selection.size,
        color: selection.color,
        colorHex: getColorHex(selection.color),
        quantity: selection.quantity,
        imageUrl: primaryImage,
      });
    });

    toast({
      title: t("productDetail.toast.addedTitle"),
      description: t("productDetail.toast.addedDesc", { count: totalQuantity }),
    });

    // Clear selections and navigate to cart
    handleClear();
    navigate("/cart");
  };

  const handleShare = async () => {
    const shareData = {
      title: bangle?.name || t("productDetail.shareTitle"),
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
          title: t("productDetail.toast.linkCopiedTitle"),
          description: t("productDetail.toast.linkCopiedDesc"),
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
          <h1 className="text-2xl font-bold text-foreground mb-4">{t("productDetail.notFoundTitle")}</h1>
          <p className="text-muted-foreground mb-6">{t("productDetail.notFoundDesc")}</p>
          <Button onClick={() => navigate("/")}>{t("productDetail.backHome")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("productDetail.backToProducts")}
        </Button>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {/* Product Image Gallery with Zoom */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl shadow-elegant p-4 sm:p-6 border border-border aspect-square flex items-center justify-center relative overflow-hidden">
              {activeImage ? (
                <div 
                  ref={imageRef}
                  className="relative w-full h-full cursor-zoom-in"
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={handleMouseMove}
                >
                  <img
                    src={activeImage}
                    alt={bangle.name}
                    className="w-full h-full object-cover rounded-lg transition-opacity duration-200"
                    style={{ opacity: isZooming ? 0 : 1 }}
                  />
                  
                  {/* Zoomed Image Overlay */}
                  {isZooming && (
                    <div 
                      className="absolute inset-0 rounded-lg pointer-events-none"
                      style={{
                        backgroundImage: `url(${activeImage})`,
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        backgroundSize: '250%',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  )}
                  
                  {/* Zoom Indicator */}
                  <div className="hidden sm:flex absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs items-center gap-1.5">
                    <ZoomIn className="w-3 h-3" />
                    {t("productDetail.hoverToZoom")}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center flex-col gap-4">
                  <div className="flex gap-2">
                    {parsedColors.slice(0, 4).map((color, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 rounded-lg shadow-lg"
                        style={getColorSwatchStyle(color)}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground">{t("productDetail.noImage")}</p>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img) => (
                  <button
                    key={img}
                    onClick={() => {
                      setActiveImage(img);
                      setIsZooming(false);
                    }}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 transition ${
                      activeImage === img ? "border-primary shadow-lg" : "border-border hover:border-primary/60"
                    }`}
                  >
                    <img src={img} alt={`${bangle.name} alternate`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Product Info */}
          <div>
            <Badge className={`mb-3 ${inStock ? "" : "bg-destructive text-destructive-foreground"}`}>
              {inStock ? t("productDetail.inStock") : t("productDetail.outOfStock")}
            </Badge>
            {categoryName && <Badge className="mb-3 ml-2">{categoryName}</Badge>}
            <h1 className="notranslate text-2xl sm:text-4xl font-display font-bold text-foreground mb-3">
              {bangle.name}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{t("productDetail.reviewsLabel", { count: 127 })}</span>
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                variant={isInWishlist ? "secondary" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (!id) return;
                  const ids = getWishlistIds();
                  let next: string[];
                  if (isInWishlist) {
                    next = ids.filter((x) => x !== id);
                    toast({ title: t("productDetail.toast.removedWishlist") });
                  } else {
                    next = [...new Set([...ids, id])];
                    toast({ title: t("productDetail.toast.addedWishlist") });
                  }
                  setWishlistIds(next);
                  setIsInWishlist(!isInWishlist);
                }}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? "fill-current" : ""}`} />
                {isInWishlist ? t("productDetail.removeWishlist") : t("productDetail.addWishlist")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate("/wishlist")}
              >
                <Heart className="w-4 h-4" />
                {t("productDetail.viewWishlist")}
              </Button>
            </div>

            {/* Description */}
            {bangle.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed">{bangle.description}</p>
            )}

           {/* Price */}
<div className="bg-secondary p-4 rounded-lg mb-6">
  <div className="text-sm text-muted-foreground mb-1">{t("productDetail.priceLabel")}</div>
  <div className="text-3xl sm:text-4xl font-bold text-accent">₹{Number(bangle.price)}</div>
</div>  


            

            

          </div>
        </div>      
        {/* Selection Board & Order Summary */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {/* Selection Board */}
          <div className="lg:col-span-2 bg-card rounded-xl shadow-elegant p-4 sm:p-6 border border-border">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-3">
              <span className="w-8 h-8 gradient-gold rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-foreground" />
              </span>
              {t("productDetail.selectionTitle")}
            </h2>

            {bangle.available_sizes.length > 0 && parsedColors.length > 0 ? (
              isMobile ? (
                <div className="space-y-4">
                  <div className="bg-secondary/60 border border-border rounded-lg p-3">
                    <div className="text-sm font-semibold text-foreground mb-2">{t("productDetail.sizeHeading")}</div>
                    <div className="grid grid-cols-2 gap-3">
                      {bangle.available_sizes.map((size) => (
                        <div key={size} className="flex items-center justify-between rounded-md bg-card px-3 py-2 border border-border">
                          <span className="text-sm font-medium">{size}</span>
                          <NumericStepper
                            value={columnQuantities[size] || 0}
                            onChange={(val) => {
                              setColumnQuantities((prev) => ({
                                ...prev,
                                [size]: val,
                              }));
                              const newQuantities = { ...quantities };
                              parsedColors.forEach((color) => {
                                const key = `${color.name}-${size}`;
                                newQuantities[key] = val;
                              });
                              setQuantities(newQuantities);
                            }}
                            min={0}
                            max={999}
                            className="justify-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {parsedColors.map((color, index) => {
                      const selectedCount = getColorTotal(color.name);
                      const isActive = activeMobileColor === color.name;
                      return (
                        <button
                          key={index}
                          onClick={() => setActiveMobileColor(color.name)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full border transition text-sm shadow-sm ${
                            isActive
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-secondary hover:bg-secondary/80 text-foreground"
                          }`}
                        >
                          <span
                            className="w-7 h-7 rounded-full ring-2 ring-border"
                            style={getColorSwatchStyle(color)}
                          />
                          <span className="font-semibold">{color.name}</span>
                          {selectedCount > 0 && (
                            <span className="text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
                              {selectedCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {activeMobileColor && (
                    <div className="p-3 space-y-2 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <div
                          className="w-8 h-8 rounded-lg ring-2 ring-border"
                          style={getColorSwatchStyle(parsedColors.find(c => c.name === activeMobileColor) || { name: activeMobileColor, hex: getColorHex(activeMobileColor) })}
                        />
                        <span>{activeMobileColor}</span>
                      </div>
                      {bangle.available_sizes.map(size => (
                        <div key={`${activeMobileColor}-${size}`} className="flex items-center justify-between">
                          <div className="text-sm font-medium">{size}</div>
                          <NumericStepper
                            value={getQuantity(activeMobileColor, size)}
                            onChange={(val) => handleQuantityChange(activeMobileColor, size, val)}
                            min={0}
                            max={999}
                            className="justify-center"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[10px] sm:text-sm">
                    <thead>
                      <tr>
                        <th className="border border-border bg-secondary px-1.5 py-1 sm:px-3 sm:py-2 text-left font-semibold text-foreground min-w-[64px] sm:min-w-[90px]">
                          <div className="text-[9px] sm:text-sm uppercase tracking-wide">{t("productDetail.sizeHeading")}</div>
                          <div className="text-[8px] sm:text-xs text-muted-foreground font-normal mt-1">{t("productDetail.colorHeading")}</div>
                        </th>
                        {bangle.available_sizes.map(size => (
                          <th
                            key={size}
                            className="border border-border bg-secondary px-1.5 py-1 sm:px-3 sm:py-2 text-center font-bold text-foreground min-w-[50px] sm:min-w-[80px]"
                          >
                            <div className="mb-1 sm:mb-2 text-[10px] sm:text-base">{size}</div>
                            <NumericStepper
                              value={columnQuantities[size] || 0}
                              onChange={(val) => {
                                setColumnQuantities(prev => ({
                                  ...prev,
                                  [size]: val
                                }));
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
                        <td className="border border-border px-1.5 py-1 sm:p-2">
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg shadow-sm ring-2 ring-border flex-shrink-0"
                              style={getColorSwatchStyle(color)}
                            />
                            <span className="font-medium text-foreground text-[10px] sm:text-sm">{color.name}</span>
                          </div>
                        </td>
                        {bangle.available_sizes.map(size => (
                          <td key={`${color.name}-${size}`} className="border border-border px-1.5 py-1 sm:px-3 sm:py-2 text-center">
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
              )
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t("productDetail.noSizesColors")}</p>
              </div>
            )}

            <div className="mt-4 sm:mt-6 flex justify-between items-center gap-3 flex-wrap">
  <div className="flex items-center gap-3">
    <span className="text-sm font-semibold text-foreground">{t("productDetail.selectAll")}</span>
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
    {t("productDetail.clearAll")}
  </Button>
</div>
          </div>  

          {/* Order Summary Sidebar */}
          <div className="bg-card rounded-xl shadow-elegant p-3 sm:p-5 border border-border h-fit lg:sticky lg:top-20">
            <h2 className="text-lg sm:text-2xl font-display font-semibold text-foreground mb-4 sm:mb-6">{t("productDetail.orderSummary")}</h2>

            {selections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t("productDetail.emptySelections")}</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 sm:mb-6 max-h-56 sm:max-h-64 overflow-y-auto">
                  {selections.map((item) => (
                    <div
                      key={`${item.color}-${item.size}`}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-lg ring-2 ring-border flex-shrink-0"
                          style={getColorSwatchStyle(parsedColors.find(c => c.name === item.color) || { name: item.color, hex: getColorHex(item.color) })}
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

                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("productDetail.subtotal")}</span>
                    <span className="font-semibold">₹{totalAmount}</span>
                  </div>
                  
                  <div className="border-t border-border pt-3 flex justify-between text-lg">
                    <span className="font-semibold">{t("productDetail.total")}</span>
                    <span className="font-bold text-accent text-xl">₹{totalAmount}</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-4 sm:mt-6 h-11 sm:h-12 text-base font-semibold gradient-gold text-foreground shadow-gold"
                  onClick={handleAddToCart}
                  disabled={!inStock || totalQuantity === 0}
                >
                  {t("productDetail.addToCart")}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-8">{t("productDetail.related")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => {
                const productColors = parseColors(product.available_colors);
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
                        {product.image_url || product.secondary_image_url ? (
                          <img
                            src={product.image_url || product.secondary_image_url || ""}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-accent">₹{Number(product.price)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {t("productDetail.colorsCount", { count: productColors.length })}
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
