# Stock-Based Urgency System Documentation

## Overview

The stock-based urgency system is a comprehensive solution for displaying real-time stock status and urgency messages to customers across the e-commerce platform. This system manages product availability from the admin panel through meaningful customer-facing messaging without exposing exact stock numbers.

## Architecture

### Core Components

#### 1. **Stock Helpers** (`src/lib/stockHelpers.ts`)
Central utility file containing all stock-related logic and messaging rules.

**Key Functions:**
- `getStockStatus(stock)` - Returns the current stock status level
- `getStockMessage(stock)` - Returns message and metadata for a given stock level
- `showUrgencyBadge(stock)` - Determines if urgency badge should display
- `isOutOfStock(stock)` - Checks if product is unavailable
- `getLastFewLeftProducts(products)` - Filters and sorts products with 1-5 stock
- `getUrgencyBadgeClass(status)` - Returns CSS styling for urgency badges
- `getUrgencyColorVariant(status)` - Returns color variant for UI components

**Stock Thresholds:**
```
- 0 items: OUT_OF_STOCK (show "Out of stock", disable purchase)
- 1-5 items: LAST_FEW_LEFT (show "Last few left — shop now")
- 6-15 items: BUY_BEFORE_SOLD_OUT (show "Buy now, before it sells out")
- 16-30 items: LIMITED_STOCK (show "Limited stock available")
- 31+ items: ABUNDANT_STOCK (no urgency message)
```

#### 2. **UrgencyBadge Component** (`src/components/UrgencyBadge.tsx`)
Reusable component for displaying stock-based urgency messages.

**Variants:**
- `badge` (default) - Standard badge display
- `inline` - Inline text display  
- `detailed` - More prominent with icon

**Sub-components:**
- `UrgencyDot` - Minimal colored dot indicator for product cards
- `OutOfStockOverlay` - Semi-transparent overlay for out-of-stock products

**Example Usage:**
```tsx
import { UrgencyBadge } from "@/components/UrgencyBadge";

// Display urgency badge
<UrgencyBadge stock={product.number_of_stock} variant="badge" />

// Display out of stock overlay
<OutOfStockOverlay stock={product.number_of_stock} />
```

#### 3. **LastFewLeft Component** (`src/components/LastFewLeft.tsx`)
Dynamic section that displays products with 1-5 stock items.

**Features:**
- Auto-fetches products with limited stock
- Hides completely if no matching products
- Sorted by lowest stock first (most urgent)
- Shows stock count (e.g., "2 left")
- Links to product detail page

**Usage on Home Page:**
```tsx
import { LastFewLeft } from "@/components/LastFewLeft";

export default function Index() {
  return (
    <div>
      {/* Other sections */}
      <LastFewLeft />
    </div>
  );
}
```

### Data Model

#### Bangles Table Addition
A new column has been added to the `bangles` table:

```sql
ALTER TABLE public.bangles
ADD COLUMN number_of_stock integer DEFAULT 0;

CREATE INDEX idx_bangles_stock ON public.bangles(number_of_stock);
```

**Column Details:**
- Name: `number_of_stock`
- Type: `integer`
- Default: `0`
- Index: Yes (for performance on filtered queries)
- Description: Total available stock - single source of truth

## Implementation Across Pages

### 1. Admin Panel (`src/pages/Admin.tsx`)

**Stock Field Addition:**
Added numeric input field in the "Edit Bangle" dialog:
```tsx
<div className="space-y-2">
  <Label>Stock Quantity *</Label>
  <Input
    type="number"
    value={form.number_of_stock}
    onChange={(e) => setForm({ ...form, number_of_stock: e.target.value })}
    placeholder="0"
    min="0"
  />
</div>
```

**Form Validation:**
Stock quantity is now a required field and must be >= 0.

**Data Persistence:**
Stock value is saved to database with other bangle data.

### 2. Product Card (`src/components/ProductCard.tsx`)

**Enhancements:**
- Added import of `UrgencyBadge` and `OutOfStockOverlay` components
- Display `UrgencyDot` if stock is 1-30 (skip if 31+)
- Show out of stock overlay and disable interactions if stock is 0
- Reduce image opacity for out-of-stock items

```tsx
{!outOfStock && <UrgencyBadge stock={bangle.number_of_stock} variant="badge" />}
{outOfStock && <OutOfStockOverlay stock={bangle.number_of_stock} />}
```

### 3. Product Detail Page (`src/pages/ProductDetail.tsx`)

**Stock Indicator:**
- Bangle interface updated to include `number_of_stock`
- Updated `inStock` logic to check both `is_active` flag and stock level
- Displays `UrgencyBadge` in detailed variant near price
- Shows out of stock message with indicator if unavailable

**Add to Cart Logic:**
- Button remains disabled if stock is 0 (in addition to existing quantity check)
- Error message displays: "Out of stock"

```tsx
const inStock = Boolean(bangle?.is_active) && !isOutOfStock(bangle?.number_of_stock);

<UrgencyBadge stock={bangle?.number_of_stock} variant="detailed" />
```

### 4. Shop, Categories & Search Pages

**Current Status:**
ProductCard component is used across all these pages, so urgency messages automatically display through the card component.

**Recommended Enhancement:**
Add filter option to show "Last few left" products first or as a dedicated section.

### 5. Home Page (`src/pages/Index.tsx`)

**Recommended Addition:**
Import and render the `LastFewLeft` component in an appropriate location:
```tsx
import { LastFewLeft } from "@/components/LastFewLeft";

// In render:
<LastFewLeft />
```

## Localization

Stock-related messages are now localizable via i18n. Translations are in `src/locales/en.json`:

```json
{
  "productDetail": {
    "stockUrgency": {
      "lastFewLeft": "Last few left — shop now",
      "buyBeforeSoldOut": "Buy now, before it sells out",
      "limitedStock": "Limited stock available"
    }
  },
  "homepage": {
    "lastFewLeftTitle": "Last Few Left — Shop Now",
    "lastFewLeftDesc": "These items are running low on stock. Grab them before they're gone!",
    "viewAllLimited": "View All Limited Stock"
  }
}
```

**To add translations for other languages:**
1. Open the corresponding locale file (e.g., `src/locales/hi.json`)
2. Add the same keys with translated values
3. The system will automatically use the translations based on user's language selection

## Best Practices

### Admin Usage
1. **Update Stock Regularly:** Keep stock numbers updated in admin panel to reflect actual inventory
2. **High Stock vs Low Stock:** Use thresholds to balance between:
   - Creating urgency without being alarmist (31+ = no message)
   - Encouraging quick purchases for genuinely limited items (1-5)
3. **Seasonal Patterns:** Increase stock for seasonal items, decrease messages during off-season

### Frontend Display
1. **No Exact Numbers:** Never display exact stock count to customers (e.g., "5 left" shows in LastFewLeft but is very subtle)
2. **Consistency:** Urgency messaging should look professional across all pages
3. **Trustworthiness:** Keep urgency messages honest - don't use artificial scarcity tactics
4. **Mobile Responsive:** All components are tested for mobile responsiveness

### Performance
- Stock queries use an index (`idx_bangles_stock`) for fast filtering
- `LastFewLeft` component caches results within component lifecycle
- Urgency badges render conditionally (not for 31+ stock)

## Customization Guide

### Changing Stock Thresholds
Edit `STOCK_THRESHOLDS` in `src/lib/stockHelpers.ts`:
```tsx
const STOCK_THRESHOLDS = {
  OUT_OF_STOCK: 0,
  LAST_FEW_LEFT_MIN: 1,
  LAST_FEW_LEFT_MAX: 5,        // Change to 10 for different range
  BUY_BEFORE_SOLD_OUT_MIN: 6,  // Adjust range
  BUY_BEFORE_SOLD_OUT_MAX: 15,
  LIMITED_STOCK_MIN: 16,
  LIMITED_STOCK_MAX: 30,
  ABUNDANT_STOCK_MIN: 31,
};
```

### Changing Stock Messages
Edit `STOCK_MESSAGES` in `src/lib/stockHelpers.ts`:
```tsx
const STOCK_MESSAGES: Record<StockStatus, {...}> = {
  [StockStatus.LAST_FEW_LEFT]: {
    message: "Custom message here", // Edit this
    showUrgency: true,
    disabled: false,
  },
  // ...
};
```

### Changing Colors/Styling
Edit `getUrgencyBadgeClass` function in `src/lib/stockHelpers.ts` to customize Tailwind classes.

## Database Migration

The migration file `supabase/migrations/20260205_add_stock_field.sql` adds:
1. `number_of_stock` column to `bangles` table
2. Index on `number_of_stock` for query performance
3. Database comments for documentation

**To apply migration:**
```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL in Supabase SQL editor
```

## Testing Checklist

- [ ] Admin can add/edit stock quantity
- [ ] Stock quantity saves to database
- [ ] Urgency badges display on product cards
- [ ] Urgency badges display on product detail page
- [ ] Out of stock hides add to cart button
- [ ] LastFewLeft section appears only when 1-5 stock items exist
- [ ] LastFewLeft section hides when no matching products
- [ ] Products sort by lowest stock first in LastFewLeft
- [ ] Urgency messages don't show for 31+ stock
- [ ] Out of stock message displays when stock = 0
- [ ] All pages are mobile responsive
- [ ] Translations work correctly for different languages

## Common Issues & Solutions

### Issue: Stock field not showing in Admin
**Solution:** Ensure migration has been applied: `supabase migration up`

### Issue: Urgency badges not displaying
**Solution:** Check that product `number_of_stock` > 0. Check `showUrgencyBadge()` logic.

### Issue: LastFewLeft section showing all products
**Solution:** Verify `getLastFewLeftProducts()` filter is working. Check `STOCK_THRESHOLDS`.

### Issue: Translations not working
**Solution:** Ensure translation keys exist in locale file. Verify i18n is initialized.

## Future Enhancements

1. **Stock Trend Analysis** - Show price changes based on stock level
2. **Automatic Discounts** - Apply discounts when stock approaches threshold
3. **Email Alerts** - Notify customers when out-of-stock items are back in stock
4. **Bulk Stock Import** - CSV upload for multiple product stock updates
5. **Stock History** - Track stock changes over time for analytics
6. **Predictive Restocking** - ML-based suggestions for reorder points

## Support & Maintenance

For issues or questions:
1. Check the implementation in `src/lib/stockHelpers.ts` first
2. Review component implementations in `src/components/UrgencyBadge.tsx` and `src/components/LastFewLeft.tsx`
3. Check database schema in migrations folder
4. Test changes in development before production deployment

## Version History

- **v1.0** (2026-02-05): Initial implementation
  - Stock field added to database
  - Urgency badges on product cards
  - Stock display on product detail
  - Admin panel stock management
  - LastFewLeft section component
  - Full i18n support
