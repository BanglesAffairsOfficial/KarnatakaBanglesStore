// components/ProductCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Bangle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  secondary_image_url?: string | null;
  available_sizes?: string[];
  is_active?: boolean;
}

interface ProductCardProps {
  bangle: Bangle;
  categoryName?: string;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(price) || 0
  );

export const ProductCard = ({ bangle, categoryName }: ProductCardProps) => {
  const previewImage = bangle.image_url || bangle.secondary_image_url || null;
  const sizes = Array.isArray(bangle.available_sizes) ? bangle.available_sizes : [];
  const outOfStock = bangle.is_active === false;

  return (
    <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
        {previewImage ? (
          <img
            src={previewImage}
            alt={bangle.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-muted-foreground text-sm">
            No image available
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary">
            New
          </div>
          {outOfStock && (
            <div className="bg-destructive/90 text-destructive-foreground px-3 py-1 rounded-full text-[11px] font-semibold">
              Out of Stock
            </div>
          )}
        </div>

        {categoryName && (
          <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
            {categoryName}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="notranslate font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
          {bangle.name}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-accent">{formatPrice(bangle.price)}</span>
        </div>

        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {sizes.slice(0, 5).map((size, i) => (
              <Badge key={i} variant="secondary" className="text-xs px-2 py-0">
                {size}
              </Badge>
            ))}
            {sizes.length > 5 && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                and more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
