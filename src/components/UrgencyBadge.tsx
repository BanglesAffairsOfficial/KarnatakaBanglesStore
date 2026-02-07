/**
 * UrgencyBadge Component
 * Displays stock-based urgency messages with appropriate styling
 * Does not show exact stock numbers for UX integrity
 */

import { Badge } from "@/components/ui/badge";
import { getStockStatus, getStockMessage, showUrgencyBadge, getUrgencyBadgeClass, StockStatus } from "@/lib/stockHelpers";
import { AlertCircle, TrendingDown } from "lucide-react";

interface UrgencyBadgeProps {
  stock?: number | null;
  variant?: "badge" | "inline" | "detailed";
  showIcon?: boolean;
}

/**
 * Renders urgency badge based on stock level
 * Variants:
 * - badge: Standard badge display (default)
 * - inline: Inline text display
 * - detailed: More prominent display with icon
 */
export const UrgencyBadge = ({ stock, variant = "badge", showIcon = true }: UrgencyBadgeProps) => {
  if (!showUrgencyBadge(stock)) {
    return null;
  }

  const { message, status, disabled } = getStockMessage(stock);

  if (!message) {
    return null;
  }

  const icon = status === StockStatus.OUT_OF_STOCK ? <AlertCircle className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;

  if (variant === "inline") {
    return (
      <span className={`${getUrgencyBadgeClass(status)} cursor-default`}>
        {showIcon && icon}
        {message}
      </span>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`${getUrgencyBadgeClass(status)} cursor-default shadow-sm`}>
        {showIcon && icon}
        <span>{message}</span>
      </div>
    );
  }

  // Default badge variant
  return (
    <Badge variant={disabled ? "destructive" : "secondary"} className="flex items-center gap-1.5 cursor-default">
      {showIcon && icon}
      {message}
    </Badge>
  );
};

/**
 * Minimal urgency dot indicator (useful for product cards)
 * Shows a colored dot without text
 */
export const UrgencyDot = ({ stock }: { stock?: number | null }) => {
  if (!showUrgencyBadge(stock)) {
    return null;
  }

  const { status } = getStockMessage(stock);

  let bgColor = "bg-red-500";
  if (status === StockStatus.LIMITED_STOCK) {
    bgColor = "bg-amber-500";
  } else if (status === StockStatus.BUY_BEFORE_SOLD_OUT) {
    bgColor = "bg-orange-500";
  }

  return <div className={`w-3 h-3 rounded-full ${bgColor} animate-pulse`} title="Limited stock available" />;
};

/**
 * Out of stock overlay component
 */
export const OutOfStockOverlay = ({ stock }: { stock?: number | null }) => {
  if ((stock ?? 0) > 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-lg">
      <div className="bg-white/95 px-4 py-2 rounded-lg text-center">
        <p className="font-semibold text-red-600">Out of Stock</p>
      </div>
    </div>
  );
};
