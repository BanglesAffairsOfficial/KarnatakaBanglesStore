import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { NumericStepper } from "@/components/NumericStepper";
import { Trash2, ShoppingBag } from "lucide-react";
import { getColorSwatchStyle, parseColor } from "@/lib/colorHelpers";

interface BangleColor {
  name: string;
  hex: string;
  swatchImage?: string;
}

interface Selection {
  color: string;
  size: string;
  quantity: number;
}

interface BanglesSelectionBoardProps {
  sizes?: string[];
  colors?: BangleColor[];
  onProceed?: (selections: Selection[], total: number) => void;
}

const DEFAULT_SIZES = ["2.2", "2.4", "2.6", "2.8", "2.10"];

const DEFAULT_COLORS: BangleColor[] = [
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

export function BanglesSelectionBoard({
  sizes = DEFAULT_SIZES,
  colors = DEFAULT_COLORS,
  onProceed,
}: BanglesSelectionBoardProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const normalizedColors = useMemo(() => {
    const parsed = (colors || []).map((c) => parseColor(c as any));
    const deduped = parsed.reduce<BangleColor[]>((acc, color) => {
      if (!acc.find((c) => c.name.toLowerCase() === color.name.toLowerCase())) {
        acc.push(color);
      }
      return acc;
    }, []);
    return deduped.length > 0 ? deduped : DEFAULT_COLORS;
  }, [colors]);

  const handleQuantityChange = (colorName: string, size: string, value: number) => {
    const key = `${colorName}-${size}`;
    setQuantities((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getQuantity = (colorName: string, size: string): number => {
    const key = `${colorName}-${size}`;
    return quantities[key] || 0;
  };

  const selections: Selection[] = useMemo(() => {
    return Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([key, qty]) => {
        const [color, size] = key.split("-");
        return { color, size, quantity: qty };
      })
      .sort((a, b) => {
        const colorOrder =
          normalizedColors.findIndex((c) => c.name === a.color) -
          normalizedColors.findIndex((c) => c.name === b.color);
        if (colorOrder !== 0) return colorOrder;
        return sizes.indexOf(a.size) - sizes.indexOf(b.size);
      });
  }, [quantities, normalizedColors, sizes]);

  const totalQuantity = useMemo(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  }, [quantities]);

  const handleClear = () => {
    setQuantities({});
  };

  const getSwatchStyle = (colorName: string) => {
    const color = normalizedColors.find((c) => c.name === colorName);
    return getColorSwatchStyle(color || { name: colorName, hex: "#888888" });
  };

  const handleProceed = () => {
    if (onProceed) {
      onProceed(selections, totalQuantity);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">
            Online Bangles Site
          </h1>
          <div className="w-32 h-1 gradient-gold mx-auto rounded-full mb-4" />
          <p className="text-muted-foreground text-lg">Premium Quality Glass Bangles</p>
        </div>

        {/* Selection Board */}
        <div className="bg-card rounded-xl shadow-elegant p-6 mb-8 border border-border">
          <h2 className="text-2xl font-display font-semibold text-foreground mb-6 flex items-center gap-3">
            <span className="w-8 h-8 gradient-gold rounded-full flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-foreground" />
            </span>
            Bangles Selection Board
          </h2>

          {/* Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-border bg-secondary p-3 text-left font-semibold text-foreground min-w-[120px]">
                    <div className="text-sm uppercase tracking-wide">Size →</div>
                    <div className="text-xs text-muted-foreground font-normal mt-1">
                      Colors ↓
                    </div>
                  </th>
                  {sizes.map((size) => (
                    <th
                      key={size}
                      className="border border-border bg-secondary p-3 text-center font-bold text-foreground min-w-[100px]"
                    >
                      <span className="text-lg">{size}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalizedColors.map((color, index) => (
                  <tr
                    key={color.name}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="border border-border p-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg shadow-sm ring-2 ring-border"
                          style={getColorSwatchStyle(color)}
                        />
                        <span className="font-medium text-foreground">{color.name}</span>
                      </div>
                    </td>
                    {sizes.map((size) => (
                      <td key={`${color.name}-${size}`} className="border border-border p-2">
                        <NumericStepper
                          value={getQuantity(color.name, size)}
                          onChange={(value) => handleQuantityChange(color.name, size, value)}
                          min={0}
                          max={999}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clear Button */}
          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={handleClear}
              className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-xl shadow-elegant p-6 border border-border">
          <h2 className="text-2xl font-display font-semibold text-foreground mb-6 flex items-center gap-3">
            <span className="w-8 h-8 gradient-maroon rounded-full flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary-foreground" />
            </span>
            Order Summary
          </h2>

          {selections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p>No bangles selected yet.</p>
              <p className="text-sm mt-2">
                Use the + and - buttons in the grid above to add items.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 mb-6">
                {selections.map((item, index) => (
                  <div
                    key={`${item.color}-${item.size}`}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm ring-2 ring-border"
                        style={getSwatchStyle(item.color)}
                      />
                      <div>
                        <span className="font-semibold text-foreground">{item.color}</span>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="text-muted-foreground">Size {item.size}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-accent">{item.quantity}</span>
                      <span className="text-muted-foreground ml-2">pcs</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-display font-semibold text-foreground">
                    Total Bangles
                  </span>
                  <div className="text-right">
                    <span className="text-4xl font-bold text-gradient-gold">{totalQuantity}</span>
                    <span className="text-muted-foreground ml-2 text-lg">pieces</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {selections.length} color-size combination{selections.length !== 1 ? "s" : ""}{" "}
                  selected
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-8">
                <Button
                  onClick={handleProceed}
                  className="w-full h-14 text-lg font-semibold gradient-gold text-foreground hover:opacity-90 transition-opacity shadow-gold"
                >
                  Proceed to Order
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground text-sm">
          <p>Online Bangles Site • Premium Glass Bangles Since 2004</p>
          <p className="mt-1">Contact: +91 98765 43210 • karnatakabanglesstores.in</p>
        </div>
      </div>
    </div>
  );
}
