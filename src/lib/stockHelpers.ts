/**
 * Stock-based urgency messaging system
 * Defines stock thresholds and messages for e-commerce urgency signals
 */

/**
 * Stock status levels for the urgency system
 */
export enum StockStatus {
  OUT_OF_STOCK = "out_of_stock",
  LAST_FEW_LEFT = "last_few_left", // 1-5 items
  BUY_BEFORE_SOLD_OUT = "buy_before_sold_out", // 6-15 items
  LIMITED_STOCK = "limited_stock", // 16-30 items
  ABUNDANT_STOCK = "abundant_stock", // 30+ items (no urgency)
}

/**
 * Urgency message configuration for each stock level
 */
const STOCK_MESSAGES: Record<StockStatus, { message: string; showUrgency: boolean; disabled: boolean }> = {
  [StockStatus.OUT_OF_STOCK]: {
    message: "Out of stock",
    showUrgency: true,
    disabled: true,
  },
  [StockStatus.LAST_FEW_LEFT]: {
    message: "Last few left — shop now",
    showUrgency: true,
    disabled: false,
  },
  [StockStatus.BUY_BEFORE_SOLD_OUT]: {
    message: "Buy now, before it sells out",
    showUrgency: true,
    disabled: false,
  },
  [StockStatus.LIMITED_STOCK]: {
    message: "Limited stock available",
    showUrgency: true,
    disabled: false,
  },
  [StockStatus.ABUNDANT_STOCK]: {
    message: "",
    showUrgency: false,
    disabled: false,
  },
};

/**
 * Stock threshold configuration
 */
const STOCK_THRESHOLDS = {
  OUT_OF_STOCK: 0,
  LAST_FEW_LEFT_MIN: 1,
  LAST_FEW_LEFT_MAX: 5,
  BUY_BEFORE_SOLD_OUT_MIN: 6,
  BUY_BEFORE_SOLD_OUT_MAX: 15,
  LIMITED_STOCK_MIN: 16,
  LIMITED_STOCK_MAX: 30,
  ABUNDANT_STOCK_MIN: 31,
};

/**
 * Determines the stock status based on quantity
 * @param stock - Number of items in stock
 * @returns StockStatus enum value
 */
export const getStockStatus = (stock: number | null | undefined): StockStatus => {
  const stockNum = stock ?? 0;

  if (stockNum <= STOCK_THRESHOLDS.OUT_OF_STOCK) return StockStatus.OUT_OF_STOCK;
  if (stockNum >= STOCK_THRESHOLDS.LAST_FEW_LEFT_MIN && stockNum <= STOCK_THRESHOLDS.LAST_FEW_LEFT_MAX)
    return StockStatus.LAST_FEW_LEFT;
  if (stockNum >= STOCK_THRESHOLDS.BUY_BEFORE_SOLD_OUT_MIN && stockNum <= STOCK_THRESHOLDS.BUY_BEFORE_SOLD_OUT_MAX)
    return StockStatus.BUY_BEFORE_SOLD_OUT;
  if (stockNum >= STOCK_THRESHOLDS.LIMITED_STOCK_MIN && stockNum <= STOCK_THRESHOLDS.LIMITED_STOCK_MAX)
    return StockStatus.LIMITED_STOCK;

  return StockStatus.ABUNDANT_STOCK;
};

/**
 * Gets the urgency message for a given stock quantity
 * @param stock - Number of items in stock
 * @returns Object with message and metadata
 */
export const getStockMessage = (
  stock: number | null | undefined
): {
  message: string;
  status: StockStatus;
  showUrgency: boolean;
  disabled: boolean;
} => {
  const status = getStockStatus(stock);
  const config = STOCK_MESSAGES[status];

  return {
    message: config.message,
    status,
    showUrgency: config.showUrgency,
    disabled: config.disabled,
  };
};

/**
 * Checks if a product should show urgency badge
 * @param stock - Number of items in stock
 * @returns boolean
 */
export const showUrgencyBadge = (stock: number | null | undefined): boolean => {
  const stockNum = stock ?? 0;
  return stockNum > STOCK_THRESHOLDS.OUT_OF_STOCK && stockNum <= STOCK_THRESHOLDS.LIMITED_STOCK_MAX;
};

/**
 * Checks if a product is out of stock
 * @param stock - Number of items in stock
 * @returns boolean
 */
export const isOutOfStock = (stock: number | null | undefined): boolean => {
  return (stock ?? 0) <= STOCK_THRESHOLDS.OUT_OF_STOCK;
};

/**
 * Gets CSS class for urgency badge styling
 * @param status - StockStatus enum value
 * @returns CSS class string
 */
export const getUrgencyBadgeClass = (status: StockStatus): string => {
  const baseClass = "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2";

  switch (status) {
    case StockStatus.OUT_OF_STOCK:
      return `${baseClass} bg-red-100 text-red-700 border border-red-200`;
    case StockStatus.LAST_FEW_LEFT:
      return `${baseClass} bg-red-100 text-red-700 border border-red-200 animate-pulse`;
    case StockStatus.BUY_BEFORE_SOLD_OUT:
      return `${baseClass} bg-orange-100 text-orange-700 border border-orange-200`;
    case StockStatus.LIMITED_STOCK:
      return `${baseClass} bg-amber-100 text-amber-700 border border-amber-200`;
    default:
      return baseClass;
  }
};

/**
 * Filters products to only include those with stock between 1 and 5
 * @param products - Array of products with stock information
 * @returns Filtered array sorted by lowest stock first
 */
export const getLastFewLeftProducts = <
  T extends {
    number_of_stock?: number;
    id?: string;
  }
>(
  products: T[]
): T[] => {
  return products
    .filter((product) => {
      const stock = product.number_of_stock ?? 0;
      return stock >= STOCK_THRESHOLDS.LAST_FEW_LEFT_MIN && stock <= STOCK_THRESHOLDS.LAST_FEW_LEFT_MAX;
    })
    .sort((a, b) => (a.number_of_stock ?? 0) - (b.number_of_stock ?? 0));
};

/**
 * Gets the urgency color variant for different contexts
 * @param status - StockStatus enum value
 * @returns Color variant string
 */
export const getUrgencyColorVariant = (
  status: StockStatus
): "destructive" | "secondary" | "outline" | "default" => {
  switch (status) {
    case StockStatus.OUT_OF_STOCK:
      return "destructive";
    case StockStatus.LAST_FEW_LEFT:
      return "destructive";
    case StockStatus.BUY_BEFORE_SOLD_OUT:
      return "secondary";
    case StockStatus.LIMITED_STOCK:
      return "secondary";
    default:
      return "outline";
  }
};
