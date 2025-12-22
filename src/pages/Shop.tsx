import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const CATEGORIES = [
  { id: "glass", name: "Glass Bangles" },
  { id: "silk", name: "Silk Thread" },
  { id: "lac", name: "Lac Bangles" },
  { id: "bridal", name: "Bridal Collection" },
  { id: "oxidized", name: "Oxidized" },
  { id: "kids", name: "Kids Special" },
];

const OCCASIONS = [
  { id: "wedding", name: "Wedding" },
  { id: "festival", name: "Festival" },
  { id: "daily", name: "Daily Wear" },
  { id: "party", name: "Party" },
];

export default function Shop() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [products, setProducts] = useState<Bangle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("latest");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const allSizes = ["2.2", "2.4", "2.6", "2.8", "2.10"];
  const allColors = ["Red", "Orange", "Yellow", "Green", "Lime", "Blue", "Pink", "Purple"];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("bangles")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
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
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter(p => {
        const category = p.name.toLowerCase();
        return selectedCategories.some(cat => category.includes(cat));
      });
    }

    // Filter by occasions
    if (selectedOccasions.length > 0) {
      result = result.filter(p => {
        const occasion = p.description?.toLowerCase() || "";
        return selectedOccasions.some(occ => occasion.includes(occ));
      });
    }

    // Filter by sizes
    if (selectedSizes.length > 0) {
      result = result.filter(p =>
        selectedSizes.some(size => p.available_sizes.includes(size))
      );
    }

    // Filter by colors
    if (selectedColors.length > 0) {
      result = result.filter(p =>
        selectedColors.some(color => p.available_colors.includes(color))
      );
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        // In a real app, this would be based on actual popularity metrics
        break;
      case "latest":
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [products, searchQuery, priceRange, selectedCategories, selectedOccasions, selectedSizes, selectedColors, sortBy]);

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleOccasionToggle = (id: string) => {
    setSelectedOccasions(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { q: searchQuery } : {});
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setPriceRange([0, 10000]);
    setSelectedCategories([]);
    setSelectedOccasions([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSortBy("latest");
  };

  const activeFiltersCount = 
    selectedCategories.length + 
    selectedOccasions.length + 
    selectedSizes.length + 
    selectedColors.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Shop Our Collection</h1>
          <p className="text-muted-foreground">Discover our premium bangles for every occasion</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <Input
              placeholder="Search for bangles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-12"
            />
            <Button type="submit" size="lg">Search</Button>
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
                  Filters
                </h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-8 pb-8 border-b">
                <Label className="font-semibold mb-4 block">Price Range</Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={10000}
                  step={100}
                  className="mb-4"
                />
                <div className="flex justify-between text-sm">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1]}</span>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-8 pb-8 border-b">
                <Label className="font-semibold mb-4 block">Categories</Label>
                <div className="space-y-3">
                  {CATEGORIES.map(cat => (
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

              {/* Occasions */}
              <div className="mb-8 pb-8 border-b">
                <Label className="font-semibold mb-4 block">Occasions</Label>
                <div className="space-y-3">
                  {OCCASIONS.map(occ => (
                    <div key={occ.id} className="flex items-center gap-2">
                      <Checkbox
                        id={occ.id}
                        checked={selectedOccasions.includes(occ.id)}
                        onCheckedChange={() => handleOccasionToggle(occ.id)}
                      />
                      <Label htmlFor={occ.id} className="font-normal cursor-pointer">{occ.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="mb-8 pb-8 border-b">
                <Label className="font-semibold mb-4 block">Sizes</Label>
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

              {/* Colors */}
              <div className="mb-8">
                <Label className="font-semibold mb-4 block">Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {allColors.map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorToggle(color)}
                      className={`px-3 py-2 rounded-lg text-sm transition ${
                        selectedColors.includes(color)
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Close button on mobile */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(false)}
                className="w-full lg:hidden"
              >
                Close Filters
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
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
                <p className="text-muted-foreground">
                  {filteredAndSortedProducts.length} products found
                </p>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest Arrivals</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
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
                <p className="text-muted-foreground mb-4">No products found matching your filters.</p>
                <Button onClick={clearAllFilters}>Clear Filters</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="cursor-pointer"
                  >
                    <ProductCard bangle={product} />
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
