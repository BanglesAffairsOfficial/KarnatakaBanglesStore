# Root Cause Analysis: 400 Bad Request

The 400 error means one or more fields in your payload don't match the Supabase schema. Here's what likely happened:

## Most Likely Causes (in order of probability)

### 1. **JSON Fields Format** (70% probability)
Your `available_sizes` and `available_colors` need to be stored as:
- **Option A:** Native JSON (what we're trying now)
- **Option B:** Stringified JSON (what might be required)

If the diagnostic script shows these fields fail, the schema likely expects stringified JSON.

### 2. **Missing Required Column** (15% probability)
The schema might require a column that's not being sent:
- `created_at` (auto-filled, shouldn't need to send)
- `updated_at` (auto-filled, shouldn't need to send)
- Some other required field

The diagnostic script will identify this.

### 3. **Type Mismatch** (10% probability)
A field is being sent as the wrong type:
- `price` must be numeric
- `category_id` must be UUID format
- `is_active` must be boolean
- Text fields must be strings

### 4. **Extra Fields** (5% probability)
Sending fields that don't exist in the schema.

## How to Fix

### If Diagnostic Script Identifies a Field

**Example:** If `available_colors` fails with "Invalid JSON format"

```javascript
// Current (failing):
available_colors: [{name: "Red", hex: "#dc2626"}]

// Change to stringified JSON:
available_colors: JSON.stringify([{name: "Red", hex: "#dc2626"}])
```

### If It's a Missing Column

1. Check Supabase schema
2. If column exists but seems to fail, check:
   - Column type (Text vs JSON vs JSONB)
   - Nullable vs NOT NULL constraint
   - Default values

### If It's is_active or unknown columns

Remove from payload if not in schema:
```javascript
// Remove these lines:
// is_active: form.is_active,
```

## Quick Test (Without Running Full Diagnostic)

Try this minimal test:

```javascript
// Paste in console (F12 → Console)
const supabase = window.__supabase;

const test = {
  name: 'Test_' + Date.now(),
  price: 100,
};

supabase.from('bangles').insert(test).then(r => {
  console.log('Works!', r);
  if(r.data) supabase.from('bangles').delete().eq('name', test.name);
}).catch(e => {
  console.log('Failed:', e);
});
```

If this works, the problem is with colors/sizes. If it fails, the problem is with the basic fields.

## Expected Fix

Based on common Supabase issues, the most likely fix will be to stringify the JSON fields:

**In Admin.tsx, around line 239:**

```javascript
// Change this:
available_colors: colorData,
available_sizes: sizesArray,

// To this:
available_colors: JSON.stringify(colorData),
available_sizes: JSON.stringify(sizesArray),
```

But we need the diagnostic script to confirm which field is the issue.

## What You Should Do

1. **Run ADVANCED_DIAGNOSTIC.js** (copy from repo, paste in console F12)
2. **Look for the first ❌ Failed message**
3. **Tell me:**
   - Which field failed
   - The exact error message shown
   - Screenshot if possible

Then I'll apply the exact fix needed based on your schema!

**The diagnostic script is the most reliable way to identify the root cause.** 🔍
