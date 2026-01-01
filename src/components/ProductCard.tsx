// components/ProductCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseColors } from "@/lib/colorHelpers"

interface Bangle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available_colors: string[] | any;
  available_sizes: string[] | any;
  created_at: string;
}

interface ProductCardProps {
  bangle: Bangle;
  categoryName?: string;
}

export const ProductCard = ({ bangle, categoryName }: ProductCardProps) => {
  // Parse colors properly
  const colors = parseColors(bangle.available_colors).slice(0, 6);
  
  // Parse sizes if needed
  const sizes = Array.isArray(bangle.available_sizes) 
    ? bangle.available_sizes 
    : [];

  return (
    <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
        {bangle.image_url ? (
          <img 
            src={bangle.image_url} 
            alt={bangle.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex gap-2 flex-wrap justify-center">
              {colors.length > 0 ? (
                colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full ring-2 ring-white shadow-lg"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))
              ) : (
                <div className="text-muted-foreground text-sm">No image available</div>
              )}
            </div>
          </div>
        )}
        
        {/* New Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary">
          New
        </div>

        {/* Category Badge */}
        {categoryName && (
          <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
            {categoryName}
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className="p-4">
        {/* Product Name */}
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
          {bangle.name}
        </h3>

        {/* Price and Colors Row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-accent">₹{bangle.price}</span>
          
          {/* Color Dots */}
          {colors.length > 0 && (
            <div className="flex gap-1 items-center">
              {colors.slice(0, 4).map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
              {colors.length > 4 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sizes */}
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {sizes.slice(0, 5).map((size, i) => (
              <Badge key={i} variant="secondary" className="text-xs px-2 py-0">
                {size}
              </Badge>
            ))}
            {sizes.length > 5 && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                +{sizes.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Available Colors Text */}
        {colors.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {colors.length} color{colors.length !== 1 ? 's' : ''} available
          </p>
        )}
      </CardContent>
    </Card>
  );
};