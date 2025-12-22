import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, Search as SearchIcon, Sparkles, Heart, Star, TrendingUp, 
  Gift, Calendar, Users, Shield, Truck, RotateCcw, Instagram, Facebook, 
  Twitter, Mail, ChevronRight, Award, Package, Zap, Phone, MapPin, MessageCircle
} from "lucide-react";

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

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
}

const parseColor = (color: string) => {
  try {
    if (color.includes("{")) return JSON.parse(color);
    const hex = { Red: "#dc2626", Orange: "#ea580c", Yellow: "#eab308", Green: "#16a34a", Lime: "#65a30d", Blue: "#2563eb", Pink: "#db2777", Purple: "#9333ea" }[color] || "#888888";
    return { name: color, hex };
  } catch {
    return { name: color, hex: "#888888" };
  }
};

const categories = [
  { name: "Glass Bangles", icon: Sparkles, color: "from-blue-500 to-cyan-400", count: "500+" },
  { name: "Silk Thread", icon: Package, color: "from-pink-500 to-rose-400", count: "200+" },
  { name: "Lac Bangles", icon: Award, color: "from-orange-500 to-amber-400", count: "150+" },
  { name: "Bridal Collection", icon: Heart, color: "from-red-500 to-pink-400", count: "300+" },
  { name: "Oxidized", icon: Zap, color: "from-gray-600 to-gray-400", count: "100+" },
  { name: "Kids Special", icon: Gift, color: "from-purple-500 to-pink-400", count: "180+" },
];

const occasions = [
  { name: "Wedding", icon: Heart, emoji: "🎊", desc: "Perfect for your special day" },
  { name: "Festival", icon: Sparkles, emoji: "🪔", desc: "Celebrate in style" },
  { name: "Daily Wear", icon: Calendar, emoji: "☀️", desc: "Everyday elegance" },
  { name: "Party", icon: Gift, emoji: "🎉", desc: "Stand out at events" },
];

const features = [
  { icon: Shield, title: "Premium Quality", desc: "100% authentic bangles" },
  { icon: Truck, title: "Free Shipping", desc: "On orders above ₹999" },
  { icon: RotateCcw, title: "Easy Returns", desc: "7-day return policy" },
  { icon: Award, title: "Since 1985", desc: "Trusted by thousands" },
];

const reviews = [
  { name: "Priya Sharma", rating: 5, text: "Beautiful bangles! Quality is amazing and colors are vibrant.", location: "Mumbai" },
  { name: "Lakshmi Rao", rating: 5, text: "Best collection I've seen. Perfect for my wedding!", location: "Bangalore" },
  { name: "Meena Patel", rating: 5, text: "Fast delivery and excellent packaging. Highly recommend!", location: "Delhi" },
];

const EnhancedHomepage = () => {
  const navigate = useNavigate();
  const [bangles, setBangles] = useState<Bangle[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(heroSlides.length, 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const fetchData = async () => {
    const [banglesRes, slidesRes, settingsRes] = await Promise.all([
      supabase.from("bangles").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("hero_slides").select("*").eq("is_active", true).order("display_order", { ascending: true }),
      // @ts-ignore - settings table may be custom, ignore strict client typings
      supabase.from("settings").select("whatsapp_number").single()
    ]);
    if (banglesRes.data) setBangles(banglesRes.data);
    if (slidesRes.data) setHeroSlides(slidesRes.data);
    const settingsData = (settingsRes as any)?.data;
    if (settingsData && settingsData.whatsapp_number) setWhatsappNumber(settingsData.whatsapp_number);
    setLoading(false);
  };

  const filteredBangles = useMemo(() => {
    if (!searchQuery.trim()) return bangles;
    const q = searchQuery.toLowerCase();
    return bangles.filter(b => b.name.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q));
  }, [bangles, searchQuery]);

  const ProductCard = ({ bangle }: { bangle: Bangle }) => {
    const colors = bangle.available_colors?.map(parseColor).slice(0, 4) || [];
    return (
      <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2" onClick={() => navigate(`/product/${bangle.id}`)}>
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
          {bangle.image_url ? (
            <img src={bangle.image_url} alt={bangle.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex gap-2 flex-wrap justify-center p-4">
                {colors.map((c, i) => <div key={i} className="w-12 h-12 rounded-full ring-2 ring-white shadow-lg" style={{ backgroundColor: c.hex }} />)}
              </div>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary">New</div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">{bangle.name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-accent">₹{bangle.price}</span>
            <div className="flex gap-1">
              {colors.slice(0, 3).map((c, i) => <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: c.hex }} />)}
              {colors.length > 3 && <span className="text-xs text-muted-foreground">+{colors.length - 3}</span>}
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
        <div className="container mx-auto px-4 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-gold rounded-full flex items-center justify-center shadow-gold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
                    <h1 className="text-xl font-display font-bold text-primary">Karnataka Bangles Stores</h1>
              <p className="text-xs text-muted-foreground">Since 1985</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            {['Categories', 'Featured', 'Reviews', 'Contact'].map(item => <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-primary transition-colors">{item}</a>)}
          </nav>
          <div className="flex items-center gap-3">
            {whatsappNumber && (
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-green-50 dark:hover:bg-green-950 rounded-full transition">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </a>
            )}
            <Button className="gradient-gold shadow-gold" onClick={() => navigate('/shop')}>Shop Now</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          {heroSlides.map((slide, idx) => (
            <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: slide.image_url ? `url(${slide.image_url})` : 'linear-gradient(135deg, hsl(var(--gold-light)), hsl(var(--gold)))', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-black/50" />
            </div>
          ))}
        </div>
        <div className="container mx-auto px-4 h-full flex items-center relative z-10">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-amber-100/80 border-0 text-rose-600">✨ Special Offer</Badge>
            <h2 className="text-5xl md:text-7xl font-display font-bold mb-4 text-rose-800 drop-shadow-lg">{heroSlides[currentSlide]?.title || "Premium Glass Bangles"}</h2>
            <p className="text-xl mb-8 text-rose-400 drop-shadow-md">{heroSlides[currentSlide]?.subtitle || "Discover our exclusive collection"}</p>
            <div className="flex gap-4 flex-wrap">
              <Button size="lg" className="gradient-gold shadow-gold" onClick={() => navigate('/shop')}>Explore Collection <ChevronRight className="w-4 h-4 ml-2" /></Button>
             <Button
  size="lg"
  variant="outline"
  className="bg-gradient-to-r from-rose-100 to-amber-100 backdrop-blur-sm text-indigo-500 border-white hover:from-rose-200 hover:to-amber-200"
>
  View Offers
</Button>

              <a href="https://wa.me/+91 63617 15136" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white shadow-lg gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {heroSlides.map((_, idx) => <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'w-8 bg-white' : 'bg-white/50'}`} />)}
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-card border-y">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[{ icon: Sparkles, value: "50+", label: "Colors" }, { icon: Package, value: "1000+", label: "Products" }, { icon: Users, value: "10k+", label: "Customers" }, { icon: Award, value: "40+", label: "Years" }].map((stat, i) => (
            <div key={i} className="group">
              <div className="w-16 h-16 mx-auto mb-3 gradient-gold rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-gold">
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-accent mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4">Shop by Type</Badge>
            <h2 className="text-4xl font-display font-bold mb-4">Explore Categories</h2>
            <p className="text-muted-foreground">Find the perfect style for every occasion</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <Card key={i} className="group cursor-pointer border-0 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <CardContent className="p-6 text-center relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className="relative">
                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${cat.color} rounded-full flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-lg`}>
                      <cat.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground">{cat.count}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Occasions */}
      <section className="py-16 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4">Perfect For Every Moment</Badge>
            <h2 className="text-4xl font-display font-bold">Shop by Occasion</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {occasions.map((occ, i) => (
              <Card key={i} className="group cursor-pointer border-0 overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-6xl">
                  {occ.emoji}
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <occ.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">{occ.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{occ.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section id="featured" className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
            <div>
              <Badge className="mb-4">Trending Now</Badge>
              <h2 className="text-4xl font-display font-bold mb-2">Featured Collection</h2>
            </div>
            <div className="relative max-w-sm w-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search bangles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12" />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredBangles.slice(0, 8).map(b => <ProductCard key={b.id} bangle={b} />)}
            </div>
          )}
        </div>
      </section>

      {/* Offers */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8">
          <Card className="border-0 overflow-hidden shadow-2xl">
            <div className="relative h-64 bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white">
              <div className="text-center">
                <Gift className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-2">Festive Sale</h3>
                <p className="text-xl mb-4">Up to 40% OFF</p>
                <Button className="bg-white text-primary hover:bg-white/90" onClick={() => navigate('/shop')}>Shop Now</Button>
              </div>
            </div>
          </Card>
          <Card className="border-0 overflow-hidden shadow-2xl">
            <div className="relative h-64 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-2">New Arrivals</h3>
                <p className="text-xl mb-4">Latest Designs</p>
                <Button className="bg-white text-primary hover:bg-white/90" onClick={() => navigate('/shop')}>Explore</Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-16 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4">Testimonials</Badge>
            <h2 className="text-4xl font-display font-bold mb-4">What Our Customers Say</h2>
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
            </div>
            <p className="text-muted-foreground">4.9/5 based on 1,247 reviews</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(r.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="mb-4 italic">"{r.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">{r.name[0]}</div>
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="text-center group">
                <div className="w-20 h-20 mx-auto mb-4 gradient-gold rounded-full flex items-center justify-center transform group-hover:scale-110 transition-all shadow-gold">
                  <f.icon className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-primary via-accent to-primary">
        <div className="container mx-auto px-4 max-w-2xl text-center text-white">
          <Mail className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-4xl font-display font-bold mb-4">Stay Updated</h2>
          <p className="text-lg mb-8">Get exclusive offers and new arrivals</p>
          <form onSubmit={(e) => { e.preventDefault(); alert(`Subscribed: ${email}`); setEmail(""); }} className="flex gap-2 max-w-md mx-auto">
            <Input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60" required />
            <Button type="submit" className="h-12 bg-white text-primary hover:bg-white/90">Subscribe</Button>
          </form>
        </div>
      </section>

      {/* Instagram */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4">Follow Us</Badge>
            <h2 className="text-4xl font-display font-bold mb-4">#KarnatakaBangles</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg">
                <Instagram className="w-12 h-12 text-primary" />
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
                <div className="w-10 h-10 gradient-gold rounded-full flex items-center justify-center"><ShoppingBag className="w-5 h-5" /></div>
                <span className="font-display font-bold text-lg text-primary">Karnataka Bangles Stores</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Premium glass bangles since 1985</p>
              <div className="flex gap-3">
                {[Facebook, Instagram, Twitter].map((Icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary hover:text-white flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {['About Us', 'Our Story', 'Wholesale', 'Bulk Orders'].map(item => <li key={item}><a href="#" className="hover:text-primary">{item}</a></li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Customer Care</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {['Shipping Policy', 'Return Policy', 'Track Order', 'FAQ'].map(item => <li key={item}><a href="#" className="hover:text-primary">{item}</a></li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><Phone className="w-4 h-4 mt-0.5" /><span>+91 98765 43210</span></li>
                <li className="flex items-start gap-2"><Mail className="w-4 h-4 mt-0.5" /><span>info@karnatakabanglesstores.in</span></li>
                <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5" /><span>123 Commercial St, Bangalore</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Karnataka Bangles Stores. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedHomepage;