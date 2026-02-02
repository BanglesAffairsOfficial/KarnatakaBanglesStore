// src/utils/colorHelpers.ts

// Predefined color mapping for common colors
export const COLOR_MAP: Record<string, string> = {
  red: "#dc2626",
  orange: "#ea580c",
  yellow: "#eab308",
  green: "#16a34a",
  lime: "#65a30d",
  blue: "#2563eb",
  pink: "#db2777",
  purple: "#9333ea",
  gold: "#f59e0b",
  silver: "#94a3b8",
  black: "#1f2937",
  white: "#f9fafb",
  brown: "#92400e",
  cyan: "#06b6d4",
  indigo: "#4f46e5",
  rose: "#f43f5e",
  teal: "#14b8a6",
  violet: "#8b5cf6",
  radium: "#00c76a",
  wine: "#722f37",
  jamuni: "#5b2b6f",
  lavender: "#c8b7e8",
  peacock: "#0f4c5c",
  pista: "#b5d99c",
  surf: "#30aadd",
  sentro: "#3ba99c",
  parrot: "#80c904",
  strawberry: "#e83f6f",
  mehendi: "#7a9a01",
  peach: "#ffb07c",
  ferozi: "#0fc7c7",
  turquoise: "#40e0d0",
  carrot: "#ed6a1f",
  onion: "#b56576",
  grey: "#9ca3af",
  "rose gold": "#ff9500",
  rani: "#c71585",
  "navy blue": "#1d3557",
  kishmashi: "#c9b164",
  dhaani: "#b5ce5a",
  "c green": "#2e8b57",
  olive: "#00ffbf",
  maroon: "#800000",
  navy: "#000080",
  "dark multi color": "#4b5563",
  "light multi color": "#e5e7eb",
};

// Optional swatch images for multi-color options
export const COLOR_SWATCH_IMAGES: Record<string, string> = {
  "dark multi color": "/DarkMulti.jpg",
  "light multi color": "/LightMulti.jpg",
};

export interface ColorInfo {
  name: string;
  hex: string;
  swatchImage?: string;
  active?: boolean;
}

/**
 * Parse color from various formats to a consistent ColorInfo object
 * Handles: objects with {name, hex}, plain strings, and JSON strings
 */
export const parseColor = (color: string | any): ColorInfo => {
  const withSwatch = (name: string, hex: string, swatchImage?: string, active?: boolean): ColorInfo => ({
    name,
    hex,
    ...(swatchImage ? { swatchImage } : {}),
    ...(active === false ? { active: false } : {}),
  });
  const normalizeHexForName = (name: string, fallbackHex: string) => {
    const mapped = COLOR_MAP[name.toLowerCase()];
    return mapped || fallbackHex;
  };

  // Case 1: Already an object with name and hex (from custom color picker)
  if (typeof color === 'object' && color !== null) {
    if (color.hex && color.name) {
      const swatchImage = color.swatchImage || COLOR_SWATCH_IMAGES[color.name.toLowerCase()];
      const normalized = color.hex.startsWith('#') ? color.hex : `#${color.hex}`;
      const hex = normalizeHexForName(color.name, normalized);
      return withSwatch(color.name, hex, swatchImage, color.active);
    }
    // Object with just hex
    if (color.hex) {
      const hex = color.hex.startsWith('#') ? color.hex : `#${color.hex}`;
      return withSwatch('Custom', hex, color.swatchImage);
    }
  }

  // Case 2: String that looks like JSON object
  if (typeof color === 'string' && color.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(color);
      if (parsed.hex && parsed.name) {
        const normalized = parsed.hex.startsWith('#') ? parsed.hex : `#${parsed.hex}`;
        const hex = normalizeHexForName(parsed.name, normalized);
        const swatchImage = parsed.swatchImage || COLOR_SWATCH_IMAGES[parsed.name.toLowerCase()];
        return withSwatch(parsed.name, hex, swatchImage);
      }
    } catch (e) {
      // Continue to next case
    }
  }

  // Case 3: Plain string (color name like "Red", "Blue")
  const colorStr = String(color).trim();
  const lower = colorStr.toLowerCase();
  const swatchImage = COLOR_SWATCH_IMAGES[lower];
  
  // Check if it's a hex color
  if (colorStr.startsWith('#')) {
    return withSwatch('Custom', colorStr, swatchImage);
  }
  
  // Look up in predefined colors, or use gray as fallback
  const hex = COLOR_MAP[lower] || '#888888';
  
  return withSwatch(colorStr, hex, swatchImage);
};

/**
 * Parse an array of colors from the database
 * Handles various formats from your admin panel
 */
export const parseColors = (colors: any): ColorInfo[] => {
  if (!colors) return [];
  
  // If it's already an array
  if (Array.isArray(colors)) {
    return colors.map(parseColor).filter(c => c.hex !== '#888888' || c.name !== 'Custom');
  }
  
  // If it's a JSON string
  if (typeof colors === 'string') {
    try {
      const parsed = JSON.parse(colors);
      if (Array.isArray(parsed)) {
        return parsed.map(parseColor).filter(c => c.hex !== '#888888' || c.name !== 'Custom');
      }
    } catch (e) {
      console.error('Failed to parse colors:', e);
    }
  }
  
  return [];
};

/**
 * Get color hex code by name (for predefined colors)
 */
export const getColorHex = (colorName: string): string => {
  return COLOR_MAP[colorName?.toLowerCase()] || '#888888';
};

/**
 * Check if a color is a valid hex color
 */
export const isValidHex = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Generate a lighter shade of a color for hover effects
 */
export const lightenColor = (hex: string, percent: number = 20): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
};

/**
 * Get CSS style for displaying a color swatch.
 * Uses an image for multi-color options when available.
 */
export const getColorSwatchStyle = (color: ColorInfo) => {
  const swatch = color.swatchImage || COLOR_SWATCH_IMAGES[color.name?.toLowerCase()];
  if (swatch) {
    return {
      backgroundImage: `url(${swatch})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }
  return { backgroundColor: color.hex };
};
