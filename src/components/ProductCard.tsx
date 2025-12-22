import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id?: string;
  name?: string;
  price?: number;
  imageUrl?: string;
  colors?: string[];
  sizes?: string[];
  bangle?: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    available_colors: string[];
    available_sizes: string[];
  };
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

export function ProductCard(props: ProductCardProps) {
  // Support both individual props and bangle object
  const id = props.bangle?.id || props.id || "";
  const name = props.bangle?.name || props.name || "";
  const price = props.bangle?.price || props.price || 0;
  const imageUrl = props.bangle?.image_url || props.imageUrl;
  const colors = props.bangle?.available_colors || props.colors || [];
  const sizes = props.bangle?.available_sizes || props.sizes || [];
  const parsedColors = colors.map(parseColor);

  return (
    <Link to={`/product/${id}`}>
      <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 border-border bg-card">
        <div className="aspect-square overflow-hidden bg-secondary">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="flex gap-1 justify-center mb-2">
                  {parsedColors.slice(0, 4).map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full ring-2 ring-background"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground text-sm">Glass Bangles</span>
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-accent">₹{price}</span>
            <Badge variant="secondary" className="text-xs">
              {sizes.length} sizes
            </Badge>
          </div>
          <div className="flex gap-1">
            {parsedColors.slice(0, 6).map((color, index) => (
              <div
                key={index}
                className="w-5 h-5 rounded-full ring-1 ring-border"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {parsedColors.length > 6 && (
              <span className="text-xs text-muted-foreground ml-1">+{parsedColors.length - 6}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
