# Troubleshooting "Failed to Add Bangle" Error

## Quick Debug Steps

### Step 1: Check Browser Console for Detailed Error
1. Open Admin Panel → Products tab
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. Try to add a product
5. Look for messages starting with `[Bangle]`:
   - `[Bangle] Inserting new bangle: {...}`
   - `[Bangle] Insert error: {...}`

### Step 2: Common Error Messages & Solutions

#### Error: "category_id" not found
**Cause:** Category field is empty or category doesn't exist

**Solution:**
- Select a category from the dropdown before saving
- Check in Admin → Taxonomy tab that categories exist
- Try refreshing page to reload categories

---

#### Error: "column 'category_id' does not exist"
**Cause:** Database schema missing category_id column

**Solution:**
1. Go to Supabase Dashboard → Table Editor
2. Click on "bangles" table
3. Verify these columns exist:
   - `id` (UUID)
   - `name` (text)
   - `price` (numeric)
   - `description` (text, nullable)
   - `image_url` (text, nullable)
   - `available_sizes` (jsonb)
   - `available_colors` (jsonb)
   - `category_id` (UUID, nullable) ← **KEY COLUMN**
   - `is_active` (boolean)

4. If `category_id` is missing, run:
   ```sql
   ALTER TABLE bangles ADD COLUMN category_id UUID REFERENCES categories(id);
   ```

---

#### Error: "duplicate key value violates unique constraint"
**Cause:** A product with the same name already exists

**Solution:**
- Use a different product name
- Or delete the existing product and create a new one

---

#### Error: "violates row-level security policy"
**Cause:** RLS policies prevent INSERT

**Solution:**
1. In Supabase, go to bangles table → RLS
2. Verify there's a policy allowing authenticated users to INSERT
3. If missing, add policy:
   ```sql
   CREATE POLICY allow_insert_bangles ON bangles
   FOR INSERT TO authenticated
   WITH CHECK (true);
   ```

---

#### Error: "JWT expired" or permission denied
**Cause:** Session expired

**Solution:**
- Refresh the page
- Log out and log back in
- Check that you're logged in as an admin user

---

### Step 3: Verify Required Data

#### Check that category is selected:
```javascript
// In browser console:
// The form dialog should have a dropdown with selected category
// Check the "Category" field is not empty
```

#### Check category exists in database:
```sql
-- In Supabase SQL Editor:
SELECT id, name FROM categories LIMIT 10;
-- Should return at least one category
```

#### Check occasions exist:
```sql
SELECT id, name FROM occasions LIMIT 10;
-- Should return at least one occasion (optional)
```

---

### Step 4: Test Product Upload

**Minimal Test Case:**
1. Fill these fields:
   - **Name:** `Test Bangle`
   - **Price:** `100`
   - **Category:** Select from dropdown
   - Leave other fields empty/default

2. Click "Save"

3. Check console for error messages

**If it works**, then the issue is with optional fields (colors, sizes, image, occasions)

---

### Step 5: Detailed Error Investigation

If you see an error in the console, look for this pattern:

```
[Bangle] Inserting new bangle: {
  name: "...",
  description: "...",
  price: 100,
  image_url: "...",
  available_sizes: [...],
  available_colors: [...],
  category_id: "...",
  is_active: true
}
[Bangle] Insert error: {
  message: "...",
  hint: "...",
  code: "..."
}
```

**Copy the error details and check:**
- `message` - What failed
- `hint` - How to fix it
- `code` - Supabase error code

---

## Complete Checklist

- [ ] Admin user is logged in (check header shows "Admin Panel")
- [ ] Category dropdown has options
- [ ] Category is selected before saving
- [ ] Product name is filled in
- [ ] Product price is filled in
- [ ] Bangles table exists with `category_id` column
- [ ] Categories table exists with data
- [ ] RLS policies allow INSERT on bangles
- [ ] User JWT is valid (refresh if unsure)
- [ ] Browser console shows detailed error message
- [ ] Check Supabase table for duplicate names

---

## If Error Persists

1. **Copy the full error from console** (screenshot or text)
2. **Check the DEBUG_UNABLE_TO_DO_ERROR.md** for RLS/schema issues
3. **Verify Supabase connection:**
   - In browser console: `supabase.from('bangles').select('count').limit(1)`
   - Should return a response (not error)

---

## Production Readiness

The enhanced logging now shows:
- Exact SQL error from Supabase
- What data was being inserted
- Which step failed (insert vs. occasions management)
- Helpful hints for fixing the issue

**No more generic "Error" messages!**
