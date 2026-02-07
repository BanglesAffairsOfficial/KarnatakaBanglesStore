import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Filter, X, ChevronDown } from "lucide-react";
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
  is_active?: boolean;
}

export default function Shop() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { canWholesale } = useAuth();
  const isWholesale = canWholesale;

  const [products, setProducts] = useState<Bangle[]>([]);
  const [categories, setCategories] = useState<Array<{id:string,name:string}>>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("latest");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const getDisplayPrice = (p: Bangle) => {
    const retail = p.retail_price ?? p.price ?? 0;
    const wholesale = p.price ?? retail;
    return isWholesale ? wholesale : retail;
  };

  const allSizes = ["2.2", "2.4", "2.6", "2.8", "2.10"];

  useEffect(() => {
    fetchProducts();
    fetchTaxonomy();
  }, []);

  // Keep filters in sync with URL params (so ?category=... from homepage works reliably)
  useEffect(() => {
    const catParam = searchParams.get("category");
    setSelectedCategories(catParam ? [catParam] : []);
    const qParam = searchParams.get("q") || "";
    setSearchQuery(qParam);
  }, [searchParams]);

  const fetchProducts = async () => {
    const { data, error } = await (supabase as any)
      .from("bangles_public")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped = data.map((p: any) => ({
        ...p,
        category_id: p.category_id ? String(p.category_id) : null,
        is_active: p.is_active ?? true,
        secondary_image_url: p.secondary_image_url || p.image_url_2 || null,
      }));
      setProducts(mapped);
      const computedMax = mapped.reduce((max, p) => Math.max(max, getDisplayPrice(p as any)), 0);
      if (computedMax > 0) {
        const paddedMax = Math.ceil(computedMax / 1000) * 1000 + 1000;
        setMaxPrice(paddedMax);
        setPriceRange([0, paddedMax]);
      }
    }
    setLoading(false);
  };

  const fetchTaxonomy = async () => {
    const { data: cats } = await (supabase as any).from('categories').select('*').order('display_order', { ascending: true });
    if (cats) setCategories(cats.map((c: any) => ({ ...c, id: String(c.id) })));
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    // Filter by search query
    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by price range
    result = result.filter(p => {
      const price = getDisplayPrice(p);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter(p => {
        const productCategory = p.category_id ? String(p.category_id) : "";
        return selectedCategories.includes(productCategory);
      });
    }

    // Filter by sizes
    if (selectedSizes.length > 0) {
      result = result.filter(p =>
        selectedSizes.some(size => p.available_sizes.includes(size))
      );
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
        break;
      case "price-high":
        result.sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
        break;
      case "popular":
        // In a real app, this would be based on actual popularity metrics
        break;
      case "latest":
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [products, searchQuery, priceRange, selectedCategories, selectedSizes, sortBy]);

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (searchQuery) params.q = searchQuery;
    const activeCategory = selectedCategories[0];
    if (activeCategory) params.category = activeCategory;
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setPriceRange([0, maxPrice]);
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSortBy("latest");
  };

  const activeFiltersCount = 
    selectedCategories.length + 
    selectedSizes.length;

  const handlePriceInputChange = (index: 0 | 1, value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    let [min, max] = priceRange;
    if (index === 0) {
      min = Math.max(0, Math.min(num, max));
    } else {
      max = Math.min(Math.max(num, min), Math.max(maxPrice, 0));
    }
    setPriceRange([min, max]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">{t("shop.title")}</h1>
          <p className="text-muted-foreground">{t("shop.subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <Input
              placeholder={t("shop.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-12"
            />
            <Button type="submit" size="lg">{t("shop.search")}</Button>
          </div>
        </form>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:col-span-1`}>
            <div className="bg-card rounded-xl shadow-elegant p-6 border border-border sticky top-20">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  {t("shop.filters.title")}
                </h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    {t("shop.filters.clear")}
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-8 pb-8 border-b">
                <Label className="font-semibold mb-4 block">{t("shop.filters.priceRange")}</Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={maxPrice}
                  step={100}
                  className="mb-4"
                />
                <div className="flex items-center gap-2 text-sm">
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => handlePriceInputChange(0, e.target.value)}
                    className="h-9 w-24"
                    min={0}
                    max={maxPrice}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => handlePriceInputChange(1, e.target.value)}
                    className="h-9 w-24"
                    min={0}
                    max={maxPrice}
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-8 pb-8 border-b">
                <Label className="font-semibold mb-4 block">{t("shop.filters.categories")}</Label>
                <div className="space-y-3">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <Checkbox
                        id={cat.id}
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={() => handleCategoryToggle(cat.id)}
                      />
                      <Label htmlFor={cat.id} className="font-normal cursor-pointer">{cat.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="mb-8 pb-8 border-b">
                <Label className="font-semibold mb-4 block">{t("shop.filters.sizes")}</Label>
                <div className="space-y-3">
                  {allSizes.map(size => (
                    <div key={size} className="flex items-center gap-2">
                      <Checkbox
                        id={`size-${size}`}
                        checked={selectedSizes.includes(size)}
                        onCheckedChange={() => handleSizeToggle(size)}
                      />
                      <Label htmlFor={`size-${size}`} className="font-normal cursor-pointer">{size}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close button on mobile */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(false)}
                className="w-full lg:hidden"
              >
                {t("shop.filters.close")}
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {t("shop.filters.title")} {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
                <p className="text-muted-foreground">
                  {t("shop.results", { count: filteredAndSortedProducts.length })}
                </p>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("shop.sort.label")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">{t("shop.sort.latest")}</SelectItem>
                  <SelectItem value="price-low">{t("shop.sort.priceLow")}</SelectItem>
                  <SelectItem value="price-high">{t("shop.sort.priceHigh")}</SelectItem>
                  <SelectItem value="popular">{t("shop.sort.popular")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">{t("shop.noResults")}</p>
                <Button onClick={clearAllFilters}>{t("shop.filters.clearAll")}</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredAndSortedProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="cursor-pointer"
                  >
                    <ProductCard
                      bangle={{ ...product, price: getDisplayPrice(product) }}
                      categoryName={categories.find(c => c.id === product.category_id)?.name}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

