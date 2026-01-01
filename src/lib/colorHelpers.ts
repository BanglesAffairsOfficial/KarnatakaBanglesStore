// src/utils/colorHelpers.ts

// Predefined color mapping for common colors
export const COLOR_MAP: Record<string, string> = {
  Red: "#dc2626",
  Orange: "#ea580c",
  Yellow: "#eab308",
  Green: "#16a34a",
  Lime: "#65a30d",
  Blue: "#2563eb",
  Pink: "#db2777",
  Purple: "#9333ea",
  Gold: "#f59e0b",
  Silver: "#94a3b8",
  Black: "#1f2937",
  White: "#f9fafb",
  Brown: "#92400e",
  Cyan: "#06b6d4",
  Indigo: "#4f46e5",
  Rose: "#f43f5e",
  Teal: "#14b8a6",
  Violet: "#8b5cf6",
};

export interface ColorInfo {
  name: string;
  hex: string;
}

/**
 * Parse color from various formats to a consistent ColorInfo object
 * Handles: objects with {name, hex}, plain strings, and JSON strings
 */
export const parseColor = (color: string | any): ColorInfo => {
  // Case 1: Already an object with name and hex (from custom color picker)
  if (typeof color === 'object' && color !== null) {
    if (color.hex && color.name) {
      return {
        name: color.name,
        hex: color.hex.startsWith('#') ? color.hex : `#${color.hex}`
      };
    }
    // Object with just hex
    if (color.hex) {
      return {
        name: 'Custom',
        hex: color.hex.startsWith('#') ? color.hex : `#${color.hex}`
      };
    }
  }

  // Case 2: String that looks like JSON object
  if (typeof color === 'string' && color.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(color);
      if (parsed.hex && parsed.name) {
        return {
          name: parsed.name,
          hex: parsed.hex.startsWith('#') ? parsed.hex : `#${parsed.hex}`
        };
      }
    } catch (e) {
      // Continue to next case
    }
  }

  // Case 3: Plain string (color name like "Red", "Blue")
  const colorStr = String(color).trim();
  
  // Check if it's a hex color
  if (colorStr.startsWith('#')) {
    return {
      name: 'Custom',
      hex: colorStr
    };
  }
  
  // Look up in predefined colors, or use gray as fallback
  const hex = COLOR_MAP[colorStr] || '#888888';
  
  return {
    name: colorStr,
    hex: hex
  };
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
  return COLOR_MAP[colorName] || '#888888';
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