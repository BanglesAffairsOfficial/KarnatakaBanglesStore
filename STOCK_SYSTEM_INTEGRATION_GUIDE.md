# Stock-Based Urgency System - Integration Guide

## Quick Start

### Step 1: Apply Database Migration ✓
The migration file has been created at:
```
supabase/migrations/20260205_add_stock_field.sql
```

This adds the `number_of_stock` column to the `bangles` table.

**Apply via Supabase CLI:**
```bash
supabase migration up
```

### Step 2: Admin Panel is Ready ✓
The admin panel (`src/pages/Admin.tsx`) now has:
- ✓ Stock quantity input field in "Edit Bangle" dialog
- ✓ Form validation requiring stock >= 0
- ✓ Data persistence to database

**No action needed** - Start entering stock values for your products!

### Step 3: Components are Ready ✓
All components have been created and configured:
- ✓ `src/lib/stockHelpers.ts` - Stock logic utilities
- ✓ `src/components/UrgencyBadge.tsx` - Urgency message component
- ✓ `src/components/LastFewLeft.tsx` - Last few left section
- ✓ `src/components/ProductCard.tsx` - Updated with stock badges
- ✓ `src/pages/ProductDetail.tsx` - Updated with stock display

### Step 4: Add LastFewLeft to Home Page (Optional but Recommended)

Open `src/pages/Index.tsx` and add:

```tsx
// Add import at the top
import { LastFewLeft } from "@/components/LastFewLeft";

// In the render/return function, add this where you want the section to appear
// (typically after featured products or before related products)
<LastFewLeft />
```

**Example placement in Index.tsx:**
```tsx
export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <HeroCarousel />
      
      {/* Featured Products */}
      {/* ... existing featured products section ... */}
      
      {/* ✅ ADD THIS NEW SECTION */}
      <LastFewLeft />
      
      {/* Categories */}
      {/* ... existing categories section ... */}
    </div>
  );
}
```

### Step 5: Translations are Ready ✓
All translations have been added to `src/locales/en.json`:
- ✓ Stock urgency messages
- ✓ Homepage section titles
- ✓ All strings are ready for i18n

## Features Now Active

### For Customers:
- 🟢 **Product Cards**: Show urgency badges (All pages: Shop, Categories, Search)
- 🟢 **Product Detail**: Display stock status and urgency message
- 🟢 **Out of Stock**: Clear visual indication, disabled purchase
- 🟢 **Last Few Left Section**: Auto-populating section on home page (when integrated)

### For Admins:
- 🟢 **Stock Management**: Edit stock quantity per product
- 🟢 **Single Source of Truth**: All stock data in one field
- 🟢 **Easy Updates**: Simple numeric input in admin panel

## Stock Level Messaging

The system automatically shows different messages based on stock levels:

| Stock Level | Message | Display | Purchase |
|------------|---------|---------|----------|
| 0 | Out of stock | ❌ Blocked | ❌ Disabled |
| 1-5 | Last few left — shop now | 🔴 Urgent | ✅ Enabled |
| 6-15 | Buy now, before it sells out | 🟠 High Urgency | ✅ Enabled |
| 16-30 | Limited stock available | 🟡 Medium Urgency | ✅ Enabled |
| 31+ | (no message) | ✅ Hidden | ✅ Enabled |

## Files Modified

### Core Files:
1. ✓ `src/lib/stockHelpers.ts` - New utility file
2. ✓ `src/components/UrgencyBadge.tsx` - New component
3. ✓ `src/components/LastFewLeft.tsx` - New component
4. ✓ `src/components/ProductCard.tsx` - Updated
5. ✓ `src/pages/ProductDetail.tsx` - Updated
6. ✓ `src/pages/Admin.tsx` - Updated

### Database:
7. ✓ `supabase/migrations/20260205_add_stock_field.sql` - New migration

### Localization:
8. ✓ `src/locales/en.json` - Updated with new translations

## Testing the System

### 1. Admin Panel Test
```
1. Go to Admin Panel → Products
2. Click "Edit" on any product
3. Verify stock input field is visible
4. Enter stock value (e.g., 3)
5. Save and check it persists
```

### 2. Product Card Test
```
1. Go to Shop page
2. Verify urgency badges show for products with 1-30 stock
3. Verify out of stock products show overlay
4. Verify no badge shows for 31+ stock products
```

### 3. Product Detail Test
```
1. Click on a product
2. Verify stock status displays below price
3. Test different stock levels (0, 5, 15, 30, 50)
4. Verify urgency message changes
```

### 4. LastFewLeft Test
```
1. Go to Home page (after integration)
2. Create/modify products to have 1-5 stock
3. Verify "Last Few Left" section appears
4. Verify products are sorted by lowest stock first
5. Verify section hides when no 1-5 stock products exist
```

## Common Tasks

### Update a Product's Stock
```
1. Admin Panel → Products tab
2. Search for product or scroll to find it
3. Click "Edit Bangle"
4. Scroll to "Stock Quantity" field
5. Enter new quantity
6. Click "Save Bangle"
```

### Add LastFewLeft to Home
```
1. Open src/pages/Index.tsx
2. Add import: import { LastFewLeft } from "@/components/LastFewLeft";
3. Add component in render where desired
4. Save file (hot reload)
```

### Change Urgency Thresholds
```
1. Open src/lib/stockHelpers.ts
2. Find STOCK_THRESHOLDS constant
3. Edit min/max values
4. Save file (hot reload)
```

### Change Urgency Messages
```
1. Open src/lib/stockHelpers.ts
2. Find STOCK_MESSAGES constant
3. Edit message strings
4. Save file (hot reload)
```

## Performance Notes

- ✅ Stock queries use database index for fast filtering
- ✅ Urgency badges render conditionally (not for 31+ stock)
- ✅ LastFewLeft caches results in component state
- ✅ No performance impact on page load times

## Troubleshooting

### Stock field not visible in Admin
- Ensure migration: `supabase migration up`
- Check browser console for errors
- Refresh page

### Urgency badges not showing
- Check product stock > 0
- Verify ProductCard receives bangle prop with number_of_stock
- Check browser console

### LastFewLeft not appearing
- Ensure component is imported and added to Index.tsx
- Create products with 1-5 stock
- Check browser console for errors

### Wrong messages displaying
- Verify STOCK_THRESHOLDS in stockHelpers.ts
- Check that stock values are being saved to database
- Ensure ProductDetail is receiving bangle with number_of_stock

## Next Steps

1. **Start adding stock values** to your products in the admin panel
2. **Verify urgency messages** display correctly across all pages
3. **Monitor customer response** to urgency messages
4. **Adjust thresholds** if needed based on business metrics
5. **Consider future enhancements** (see main documentation)

## Support

For detailed information, see: `STOCK_URGENCY_SYSTEM.md`

For code examples and API reference, see individual component files:
- `src/lib/stockHelpers.ts` - Detailed function documentation
- `src/components/UrgencyBadge.tsx` - Component usage examples
- `src/components/LastFewLeft.tsx` - Component implementation

---

**Status**: ✅ All components implemented and ready to use
**Date**: February 5, 2026
**Version**: 1.0
