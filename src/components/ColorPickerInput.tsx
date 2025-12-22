import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ColorItem {
  name: string;
  hex: string;
}

interface ColorPickerInputProps {
  colors: ColorItem[];
  onChange: (colors: ColorItem[]) => void;
}

export function ColorPickerInput({ colors, onChange }: ColorPickerInputProps) {
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#ff0000");

  const addColor = () => {
    if (newColorName.trim() && newColorHex) {
      const exists = colors.some(
        (c) => c.name.toLowerCase() === newColorName.trim().toLowerCase()
      );
      if (!exists) {
        onChange([...colors, { name: newColorName.trim(), hex: newColorHex }]);
        setNewColorName("");
        setNewColorHex("#ff0000");
      }
    }
  };

  const removeColor = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Label>Available Colors (with custom names)</Label>
      
      {/* Existing colors */}
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary"
          >
            <div
              className="w-5 h-5 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-sm font-medium">{color.name}</span>
            <button
              type="button"
              onClick={() => removeColor(index)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label={`Remove ${color.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new color */}
      <div className="flex items-end gap-2 p-3 bg-muted rounded-lg">
        <div className="space-y-1">
          <Label className="text-xs">Color Picker</Label>
          <input
            type="color"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="w-12 h-10 rounded cursor-pointer border border-border"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Color Name</Label>
          <Input
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            placeholder="e.g., Royal Blue"
            onKeyPress={(e) => e.key === "Enter" && addColor()}
          />
        </div>
        <Button type="button" onClick={addColor} size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Pick a color using the color picker and give it a custom name.
      </p>
    </div>
  );
}
