import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
import { 
    ShoppingBag, Search as SearchIcon, Sparkles, 
    Users, Shield, Truck, RotateCcw, Instagram, Facebook, 
    Twitter, Mail, ChevronRight, ChevronLeft, Play, Award, Package, Zap, Phone, MapPin, MessageCircle, Globe
  } from "lucide-react";
import { parseColors, getColorSwatchStyle } from "@/lib/colorHelpers";
import { safeNavigate } from "@/lib/safeNavigate";
import { useTranslation } from "react-i18next";

  interface Bangle {
    id: string;
    name: string;
    description: string | null;
    price: number;
    retail_price?: number | null;
    image_url: string | null;
    secondary_image_url?: string | null;
    available_colors: string[];
    available_sizes: string[];
    created_at: string;
    category_id?: string | null;
  }

  interface HeroSlide {
    id: string;
    title: string;
    subtitle: string | null;
    image_url: string | null;
  }

  interface SocialLinks {
    instagram: string;
    facebook: string;
    twitter: string;
    email: string;
  }

  interface Category {
    id: string;
    name: string;
    image_url: string | null;
    display_order: number | null;
    is_active: boolean;
  }

  interface OrderItemSale {
    bangle_id: string;
    quantity: number;
  }

  interface ReelRow {
    id: string;
    video_url: string;
    caption: string | null;
    creator: string | null;
    poster_url?: string | null;
    display_order?: number | null;
    is_active?: boolean | null;
  }

  interface ReelCard {
    id: string;
    caption: string;
    creator: string;
    videoUrl: string;
    poster?: string | null;
  }

  const videoReels: ReelCard[] = [
    {
      id: "reel-2",
      caption: "New Arrival Alert: Stone Glass Bangles",
      creator: "@Bnaglesaffairs",
      videoUrl: "https://res.cloudinary.com/dct5qyha7/video/upload/w_1080,h_1920,c_fill,q_auto,f_auto/v1770187005/New_Arrival_Alert_Introducing_our_stunning_stone_glass_bangles_-_each_piece_has_a_story_to_t_tdzie5.mp4",
      poster: "/reels/reel2.jpg",
    },
    {
      id: "reel-3",
      caption: "Wholesale Bangles",
      creator: "@karnatakabangles",
      videoUrl: "https://res.cloudinary.com/dct5qyha7/video/upload/w_1080,h_1920,c_fill,q_auto,f_auto/v1770187345/Searching_for_wholesale_bangles_to_start_your_business_Skip_the_hassle_Karnataka_Bangles_Stores_rnmufu.mp4",
      poster: "/reels/reel3.jpg",
    },
    {
      id: "reel-4",
      caption: "Latest Glass Bangles Collection",
      creator: "@karnatakabangles",
      videoUrl: "https://res.cloudinary.com/dct5qyha7/video/upload/w_1080,h_1920,c_fill,q_auto,f_auto/v1770187614/Introducing_Our_Latest_Glass_Bangles_Collection_Export_Quality_Straight_from_21_Years_of_M_epumud.mp4",
    },
    {
      id: "reel-5",
      caption: "Kashmiri Glass Bangles Sets",
      creator: "@karnatakabangles",
      videoUrl: "https://res.cloudinary.com/dct5qyha7/video/upload/w_1080,h_1920,c_fill,q_auto,f_auto/v1770187775/Unveiling_our_stunning_Kashmiri_Glass_Bangles_Sets_bangle_kashmiri_ghungroo_raindropbangle_pbkslv.mp4",
    },
    {
      id: "reel-6",
      caption: "Raindrop Bangles Collection",
      creator: "@karnatakabangles",
      videoUrl: "https://res.cloudinary.com/dct5qyha7/video/upload/w_1080,h_1920,c_fill,q_auto,f_auto/v1770188165/bangle_raindropbangles_bangleceremony_banglecollection_babyshower_seemantham_banglebusine_mhuwxz.mp4",
    },
    {
      id: "reel-7",
      caption: "Glass Bangles Tradition",
      creator: "@karnatakabangles",
      videoUrl: "https://res.cloudinary.com/dct5qyha7/video/upload/w_1080,h_1920,c_fill,q_auto,f_auto/v1770188338/Glass_bangles_aren_t_just_an_accessories_they_symbolise_celebration_and_tradition._Pair_them_wit_szkl0v.mp4",
    },
    {
      id: "reel-8",
      caption: "Unboxing Metal Bangles",
      creator: "@karnatakabangles",
      videoUrl: "https://res.cloudinary.com/dct5qyha7/video/upload/w_1080,h_1920,c_fill,q_auto,f_auto/v1770272517/samples/ecommerce/Unboxing_the_perfect_blend_of_style_and_elegance-_our_new_metal_bangles_bmff2q.mp4",
    },
  ];


  const features = [
    { icon: Shield, titleKey: "features.premium", descKey: "features.premiumDesc" },
    { icon: Truck, titleKey: "features.shipping", descKey: "features.shippingDesc" },
    { icon: RotateCcw, titleKey: "features.easy", descKey: "features.easyDesc" },
    { icon: Award, titleKey: "features.since", descKey: "features.sinceDesc" },
  ];

  const LANGUAGES = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "mr", name: "Marathi", nativeName: "मराठी" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  ];

  const EnhancedHomepage = () => {
    const navigate = useNavigate();
    const { session, canWholesale } = useAuth();
    const { t, i18n } = useTranslation();
    const [bangles, setBangles] = useState<Bangle[]>([]);
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItemSale[]>([]);
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [reels, setReels] = useState<ReelRow[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({
      instagram: "",
      facebook: "",
      twitter: "",
      email: "",
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [email, setEmail] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentLang, setCurrentLang] = useState("en");
    const [showLangMenu, setShowLangMenu] = useState(false);
    const reelsRef = useRef<HTMLDivElement | null>(null);
    const getDisplayPrice = (b: any) => {
      const retail = b?.retail_price ?? b?.price ?? 0;
      const wholesale = b?.price ?? retail;
      return canWholesale ? wholesale : retail;
    };

          useEffect(() => {
      fetchData();
    }, []);

    const navItems = [
      { key: "categories", href: "#categories" },
      { key: "featured", href: "#featured" },
      { key: "reviews", href: "#reviews" },
      { key: "contact", href: "/contact", isRoute: true },
    ];

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.max(heroSlides.length, 1));
      }, 5000);
      return () => clearInterval(interval);
    }, [heroSlides.length]);

    useEffect(() => {
      const savedLang = localStorage.getItem("preferred_language");
      const supported = LANGUAGES.map((l) => l.code);
      const browserLang = navigator.language?.split("-")[0] || "en";
      const initialLang = supported.includes(browserLang) ? browserLang : "en";
      const nextLang = savedLang || initialLang;
      setCurrentLang(nextLang);
      i18n.changeLanguage(nextLang);
    }, [i18n]);

    const changeLanguage = (langCode: string) => {
      i18n.changeLanguage(langCode);
      setCurrentLang(langCode);
      localStorage.setItem("preferred_language", langCode);
      setShowLangMenu(false);
    };

    const scrollReels = (direction: number) => {
      if (!reelsRef.current) return;
      const { clientWidth } = reelsRef.current;
      reelsRef.current.scrollBy({ left: direction * (clientWidth * 0.8), behavior: "smooth" });
    };

    const fetchData = async () => {
      // Clear any cached top-seller data before fetching fresh results
      setOrderItems([]);
      setLoading(true);
      const [banglesRes, slidesRes, categoriesRes, settingsRes, orderItemsRes, reelsRes] = await Promise.all([
        (supabase as any).from("bangles_public").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        (supabase as any).from("hero_slides").select("*").eq("is_active", true).order("display_order", { ascending: true }),
        // Use any to avoid typed client mismatch for custom table
        (supabase as any).from("categories").select("*").eq("is_active", true).order("display_order", { ascending: true }),
        // @ts-ignore - settings table may be custom, ignore strict client typings
        (supabase as any).from("settings").select("*").single(),
        (supabase as any).from("order_items").select("bangle_id, quantity"),
        (supabase as any).from("reels").select("*").eq("is_active", true).order("display_order", { ascending: true }),
      ]);
      
      if (banglesRes.data) setBangles(banglesRes.data as Bangle[]);
      if (slidesRes.data) setHeroSlides(slidesRes.data);
      if (categoriesRes.data) {
        setCategories(
          categoriesRes.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            image_url: c.image_url || null,
            display_order: c.display_order ?? 0,
            is_active: c.is_active ?? true,
          }))
        );
      }
      
      const settingsData = (settingsRes as any)?.data;
      if (settingsData) {
        if (settingsData.whatsapp_number) setWhatsappNumber(settingsData.whatsapp_number);
        setSocialLinks({
          instagram: settingsData.instagram_link || "",
          facebook: settingsData.facebook_link || "",
          twitter: settingsData.twitter_link || "",
          email: settingsData.email || "",
        });
      }
      if (orderItemsRes.data) setOrderItems(orderItemsRes.data);
      if (reelsRes.data) setReels(reelsRes.data as ReelRow[]);
      setLoading(false);
    };

  const reelCards: ReelCard[] = reels.length
    ? reels
        .filter((reel) => !!reel.video_url)
        .map((reel, idx) => ({
          id: reel.id || `reel-${idx}`,
          caption: reel.caption || "New Reel",
          creator: reel.creator || "@karnatakabangles",
          videoUrl: reel.video_url,
          poster: (reel as any).poster_url || null,
        }))
    : videoReels;

  const filteredBangles = useMemo(() => {
    if (!searchQuery.trim()) return bangles;
    const q = searchQuery.toLowerCase();
    return bangles.filter(b => b.name.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q));
  }, [bangles, searchQuery]);

    const topSellingBangles = useMemo(() => {
      if (!orderItems.length) return [];
      const tally = new Map<string, { quantity: number; bangle?: Bangle | null }>();
      const bangleMap = new Map(bangles.map(b => [b.id, b]));
      orderItems.forEach((item) => {
        const existing = tally.get(item.bangle_id);
        const quantity = (existing?.quantity || 0) + (item.quantity || 0);
        const bangleData = bangleMap.get(item.bangle_id);
        tally.set(item.bangle_id, { quantity, bangle: bangleData || null });
      });
      return Array.from(tally.entries())
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 6)
        .map(([id, data]) => ({ id, quantity: data.quantity, bangle: data.bangle }));
    }, [orderItems, bangles]);

    const topSellingCategories = useMemo(() => {
      if (!orderItems.length || !categories.length) return [];
      const catTally = new Map<string, number>();
      const bangleMap = new Map(bangles.map(b => [b.id, b]));
      orderItems.forEach((item) => {
        const bangle = bangleMap.get(item.bangle_id);
        const catId = bangle?.category_id;
        if (!catId) return;
        catTally.set(catId, (catTally.get(catId) || 0) + (item.quantity || 0));
      });
      const categoryLookup = new Map(categories.map(c => [c.id, c.name]));
      return Array.from(catTally.entries())
        .map(([id, qty]) => ({ id, name: categoryLookup.get(id) || t("categories.fallback"), quantity: qty }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 6);
    }, [orderItems, categories, bangles]);

    const ProductCard = ({ bangle }: { bangle: Bangle }) => {
      const colors = parseColors(bangle.available_colors).slice(0, 4);
      const displayImage = bangle.image_url || bangle.secondary_image_url || null;
      return (
        <Card
          className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          onClick={() => safeNavigate(navigate, `/product/${bangle.id}`)}
        >
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
            {displayImage ? (
              <img src={displayImage} alt={bangle.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex gap-2 flex-wrap justify-center p-4">
                  {colors.map((c, i) => <div key={i} className="w-12 h-12 rounded-full ring-2 ring-white shadow-lg" style={getColorSwatchStyle(c)} />)}
                </div>
              </div>
            )}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary">{t("productCard.new")}</div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1 notranslate">{bangle.name}</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-accent">₹{getDisplayPrice(bangle)}</span>
              <div className="flex gap-1">
                {colors.slice(0, 3).map((c, i) => <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={getColorSwatchStyle(c)} />)}
                {colors.length > 3 && <span className="text-xs text-muted-foreground">and more</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    };

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-sm">
          <div className="container mx-auto px-4 flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Karnataka Bangle Store" className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover shadow-gold" />
              <div>
                <h1 className="text-sm sm:text-lg font-display font-bold text-primary leading-tight">Karnataka Bangle Store</h1>
                <p className="text-[9px] sm:text-xs text-muted-foreground -mt-0.5">{t("header.since")}</p>
              </div>
            </div>
            <nav className="hidden md:flex gap-6 text-sm">
              {navItems.map(item => (
                item.isRoute ? (
                  <a
                    key={item.key}
                    href={item.href}
                    className="hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      safeNavigate(navigate, item.href);
                    }}
                  >
                    {t(`header.nav.${item.key}`)}
                  </a>
                ) : (
                  <a key={item.key} href={item.href} className="hover:text-primary transition-colors">
                    {t(`header.nav.${item.key}`)}
                  </a>
                )
              ))}
            </nav>
            <div className="flex items-center gap-3">
              {whatsappNumber && (
                <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-green-50 dark:hover:bg-green-950 rounded-full transition">
                  <MessageCircle className="w-6 h-6 text-green-500" />
                </a>
              )}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {LANGUAGES.find((l) => l.code === currentLang)?.nativeName || "English"}
                  </span>
                </Button>
                {showLangMenu && (
                  <div className="notranslate absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-xl z-50 py-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full px-4 py-2 text-left hover:bg-secondary transition-colors ${
                          currentLang === lang.code ? "bg-secondary font-semibold" : ""
                        }`}
                      >
                        <span className="block text-sm">{lang.nativeName}</span>
                        <span className="block text-xs text-muted-foreground">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button className="gradient-gold shadow-gold" onClick={() => safeNavigate(navigate, '/shop')}>{t("header.shopNow")}</Button>
            </div>
          </div>
        </header>

        {/* Hero - Responsive Banner */}
        <section className="relative h-[320px] sm:h-[360px] md:h-[480px] lg:h-[560px] xl:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {heroSlides.map((slide, idx) => (
              <div 
                key={slide.id} 
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`} 
                style={{ 
                  backgroundImage: slide.image_url ? `url(${slide.image_url})` : 'linear-gradient(135deg, hsl(var(--gold-light)), hsl(var(--gold)))', 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center' 
                }}
              >
              </div>
            ))}
          </div>
          <div className="container mx-auto px-4 h-full flex items-center relative z-10" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {heroSlides.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentSlide(idx)} 
                className={`h-2 rounded-full transition-all ${idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'}`} 
              />
            ))}
        </div>
      </section>

        {/* Categories (should appear right after the hero banner) */}
        <section id="categories" className="pt-0 pb-12 md:py-16">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="text-center mb-8 md:mb-12">
              <Badge className="mb-4">{t("categories.badge")}</Badge>
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">{t("categories.title")}</h2>
              <p className="text-muted-foreground">{t("categories.subtitle")}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {categories.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground">
                  {t("categories.empty")}
                </div>
              ) : (
                categories.map((cat, i) => {
                  const gradients = [
                    "from-blue-500 to-cyan-400",
                    "from-pink-500 to-rose-400",
                    "from-orange-500 to-amber-400",
                    "from-red-500 to-pink-400",
                    "from-gray-600 to-gray-400",
                    "from-purple-500 to-pink-400",
                  ];
                  const gradient = gradients[i % gradients.length];

                  return (
                    <Card
                      key={cat.id}
                      className="group cursor-pointer border-0 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                      onClick={() => safeNavigate(navigate, `/shop?category=${encodeURIComponent(cat.id)}`)}
                    >
                      <CardContent className="p-6 text-center relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                        <div className="relative space-y-3">
                          <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden border-2 border-white shadow-lg bg-gradient-to-br from-background to-secondary flex items-center justify-center">
                            {cat.image_url ? (
                              <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover scale-110" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1 notranslate">{cat.name}</h3>
                            <p className="text-xs text-muted-foreground">{t("categories.view")}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-8 md:py-10 bg-card border-y">
          <div className="container mx-auto px-3 sm:px-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            {[{ icon: Sparkles, value: "50+", label: t("stats.colors") }, { icon: Package, value: "1000+", label: t("stats.products") }, { icon: Users, value: "10k+", label: t("stats.customers") }, { icon: Award, value: "20+", label: t("stats.years") }].map((stat, i) => (
              <div key={i} className="group">
                <div className="notranslate w-16 h-16 mx-auto mb-3 gradient-gold rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-gold">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-3xl font-bold text-accent mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured */}
        <section id="featured" className="py-12 md:py-16">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
              <div>
                <Badge className="mb-4">{t("featured.badge")}</Badge>
                <h2 className="text-3xl sm:text-4xl font-display font-bold mb-2">{t("featured.title")}</h2>
              </div>
              <div className="relative max-w-sm w-full">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder={t("featured.searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12" />
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {filteredBangles.slice(0, 6).map(b => <ProductCard key={b.id} bangle={b} />)}
                </div>
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => safeNavigate(navigate, "/shop")}
                    className="animate-attention-float-rgb shadow-gold border-0"
                  >
                    Shop our collection
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Top Sellers */}
        <section id="reviews" className="py-12 md:py-16 bg-gradient-to-b from-background to-secondary/30">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">{t("bestsellers.badge")}</Badge>
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">{t("bestsellers.title")}</h2>
              <p className="text-muted-foreground">{t("bestsellers.subtitle")}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xl font-semibold">{t("bestsellers.topBangles")}</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {topSellingBangles.length === 0 ? (
                    <div className="col-span-full text-muted-foreground text-center text-sm">
                      {t("bestsellers.emptyBangles")}
                    </div>
                  ) : (
                    topSellingBangles.map((item) => (
                      <Card
                        key={item.id}
                        className="border-0 shadow-lg hover:shadow-xl transition cursor-pointer"
                        onClick={() => safeNavigate(navigate, `/product/${item.id}`)}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="aspect-square rounded-lg overflow-hidden bg-secondary border">
                            {item.bangle?.image_url || (item.bangle as any)?.secondary_image_url ? (
                              <img
                                src={item.bangle.image_url || (item.bangle as any).secondary_image_url}
                                alt={item.bangle?.name || t("productCard.bangle")}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                {t("productCard.noImage")}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold line-clamp-1 notranslate">{item.bangle?.name || t("productCard.bangle")}</p>
                            <p className="text-sm text-muted-foreground">{t("bestsellers.unitsSold")} {item.quantity}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t("bestsellers.topCategories")}</h3>
                <div className="space-y-3">
                  {topSellingCategories.length === 0 ? (
                    <div className="text-muted-foreground text-sm text-center">{t("bestsellers.emptyCategories")}</div>
                  ) : (
                    topSellingCategories.map((cat, idx) => (
                      <Card key={cat.id} className="border-0 shadow-lg hover:shadow-xl transition">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{cat.name}</p>
                            <p className="text-sm text-muted-foreground">Units sold: {cat.quantity}</p>
                          </div>
                          <Badge variant="secondary">#{idx + 1}</Badge>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Reels */}
        <section className="py-16 bg-background" id="reels">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold">{t("reels.badge")}</h2>
                <p className="mt-2 text-base sm:text-lg font-semibold text-foreground">{t("reels.title")}</p>
                <p className="text-muted-foreground text-sm sm:text-base">Vertical 9:16 reels (1080x1920) - no cropping, rounded corners.</p>
              </div>
              <div className="hidden sm:flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => scrollReels(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => scrollReels(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div
                ref={reelsRef}
                className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {reelCards.map((reel) => (
                  <div key={reel.id} className="snap-start w-[220px] sm:w-[260px] md:w-[300px] lg:w-[320px] flex-shrink-0">
                    <div className="relative aspect-[9/16] w-full rounded-3xl overflow-hidden bg-black shadow-2xl">
                      <video
                        src={reel.videoUrl}
                        className="h-full w-full object-cover"
                        poster={reel.poster || heroSlides[0]?.image_url || undefined}
                        playsInline
                        muted
                        loop
                        autoPlay
                        controls
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 text-white">
                        <p className="text-xs opacity-80 notranslate">{reel.creator}</p>
                        <p className="text-sm font-semibold leading-tight notranslate">{reel.caption}</p>
                      </div>
                      <div className="absolute top-3 right-3 bg-white/85 text-primary rounded-full p-2 shadow-md">
                        <Play className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="sm:hidden flex justify-end gap-2 mt-4">
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => scrollReels(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => scrollReels(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
        {/* Social Highlights */}
        <section className="py-16 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8">
            <Card className="border-0 overflow-hidden shadow-2xl">
              <div className="relative h-64 bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white">
                <div className="text-center space-y-4">
                  <Instagram className="w-16 h-16 mx-auto" />
                  <div>
                    <h3 className="text-3xl font-bold mb-2">Instagram</h3>
                    <p className="text-lg">See the latest bangles, reels, and drops.</p>
                  </div>
                  <Button
                    asChild
                    className="bg-white text-primary hover:bg-white/90"
                    disabled={!socialLinks.instagram}
                  >
                    <a
                      href={socialLinks.instagram || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {socialLinks.instagram ? "Open Instagram" : "Instagram unavailable"}
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
            <Card className="border-0 overflow-hidden shadow-2xl">
              <div className="relative h-64 bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white">
                <div className="text-center space-y-4">
                  <Facebook className="w-16 h-16 mx-auto" />
                  <div>
                    <h3 className="text-3xl font-bold mb-2">Facebook</h3>
                    <p className="text-lg">Follow store updates, offers, and events.</p>
                  </div>
                  <Button
                    asChild
                    className="bg-white text-primary hover:bg-white/90"
                    disabled={!socialLinks.facebook}
                  >
                    <a
                      href={socialLinks.facebook || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {socialLinks.facebook ? "Open Facebook" : "Facebook unavailable"}
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-12">{t("whyChooseUs.title")}</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {features.map((f, i) => (
                <div key={i} className="text-center group">
                  <div className="w-20 h-20 mx-auto mb-4 gradient-gold rounded-full flex items-center justify-center transform group-hover:scale-110 transition-all shadow-gold">
                    <f.icon className="w-10 h-10" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t(f.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(f.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="bg-card border-t py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <img src="/logo.png" alt="Karnataka Bangle Store" className="w-10 h-10 rounded-lg object-cover shadow-gold" />
                  <span className="font-display font-bold text-lg text-primary">Karnataka Bangle Store</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t("footer.tagline")}</p>
                <div className="flex gap-3">
                  {socialLinks.facebook && (
                    <a 
                      href={socialLinks.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a 
                      href={socialLinks.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a 
                      href={socialLinks.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-4">{t("footer.quickLinks")}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    { key: "aboutUs" },
                    { key: "ourStory" },
                    { key: "wholesale" },
                    { key: "bulkOrders" },
                  ].map(item => (
                    <li key={item.key}><a href="#" className="hover:text-primary">{t(`footer.${item.key}`)}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">{t("footer.customerCare")}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    { key: "shippingPolicy" },
                    { key: "trackOrder" },
                    { key: "faq" },
                  ].map(item => (
                    <li key={item.key}><a href="#" className="hover:text-primary">{t(`footer.${item.key}`)}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">{t("footer.contact")}</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {whatsappNumber && (
                    <li className="flex items-start gap-2">
                      <Phone className="w-4 h-4 mt-0.5" />
                      <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        +{whatsappNumber}
                      </a>
                    </li>
                  )}
                  {socialLinks.email && (
                    <li className="flex items-start gap-2">
                      <Mail className="w-4 h-4 mt-0.5" />
                      <a href={`mailto:${socialLinks.email}`} className="hover:text-primary">
                        {socialLinks.email}
                      </a>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>#29/1 Near Panduranga Swami Temple Santhushapet, Bangalore 560053</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t pt-8 text-center text-sm text-muted-foreground">
              <p className="font-bold">
                Made by{" "}
                <a
                  href="https://www.linkedin.com/in/bhavesh-kumar-tiwari-5043862b4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold hover:text-primary underline"
                >
                  Bhavesh Kumar Tiwari
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  export default EnhancedHomepage;


