/**
 * LastFewLeft Component
 * Displays products with stock between 1-5, sorted by lowest stock first
 * Only shows if there are matching products
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { getLastFewLeftProducts } from "@/lib/stockHelpers";
import { useTranslation } from "react-i18next";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  secondary_image_url?: string | null;
  number_of_stock?: number;
}

export const LastFewLeft = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchLastFewLeftProducts();
  }, []);

  const fetchLastFewLeftProducts = async () => {
    try {
      setLoading(true);
      // Fetch all active bangles with only required fields (we'll filter on the client side for real-time stock)
      const { data, error } = await supabase
        .from("bangles_public")
        .select("id, name, price, image_url, number_of_stock")
        .eq("is_active", true)
        .order("number_of_stock", { ascending: true });

      if (error) throw error;

      // Filter products with stock between 1-5
      const lastFewLeft = getLastFewLeftProducts((data as any) || []);
      setProducts(lastFewLeft as Product[]);
    } catch (err) {
      console.error("Failed to fetch last few left products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Don't show section if no products match or still loading
  if (loading) {
    return null;
  }

  if (products.length === 0) {
    return null;
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price) || 0);

  return (
    <section className="py-12 sm:py-16 px-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-xl">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {t("homepage.lastFewLeftTitle", "Last Few Left — Shop Now")}
          </h2>
        </div>

        <p className="text-muted-foreground mb-6">
          {t(
            "homepage.lastFewLeftDesc",
            "These items are running low on stock. Grab them before they're gone!"
          )}
        </p>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {products.map((product) => {
            const previewImage = product.image_url || product.secondary_image_url;

            return (
              <Link key={product.id} to={`/product/${product.id}`}>
                <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full">
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No image
                      </div>
                    )}

                    {/* Stock Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant="destructive"
                        className="flex items-center gap-1.5 animate-pulse bg-red-600"
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                        <span className="text-[11px] font-bold">
                          {product.number_of_stock} left
                        </span>
                      </Badge>
                    </div>

                    {/* Urgency Label */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-red-600 shadow-sm">
                      Limited
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="notranslate font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem] text-sm">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-accent">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            asChild
            size="lg"
            className="gradient-gold text-foreground gap-2 shadow-gold"
          >
            <Link to="/shop">
              {t("homepage.viewAllLimited", "View All Limited Stock")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

