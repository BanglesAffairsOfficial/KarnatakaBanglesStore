# Debugging 400 Bad Request - Step by Step

The 400 error means the payload doesn't match the database schema. This guide will help identify which field is causing the issue.

## Step 1: Run the Advanced Diagnostic Script

1. **Refresh your page** to load the latest code
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Copy the entire contents of `ADVANCED_DIAGNOSTIC.js`** (from the repo root)
5. **Paste it into the console**
6. **Press Enter**

The script will test fields one by one and show you exactly which field causes the 400 error.

## Step 2: Check the Console Output

The script will show output like:

```
✅ Minimal payload works!
Testing with field "name":
  Payload: {"name":"Test_1703..."} 
  ✅ Success

Testing with field "description":
  Payload: {"name":"Test_1703...","description":"Test..."}
  ✅ Success

Testing with field "available_sizes":
  Payload: {"name":"Test_1703...","available_sizes":["2.2"]}
  ❌ Failed: Invalid JSON format
  
...
```

The first **❌ Failed** you see is the problematic field.

## Step 3: Common Issues & Solutions

### Issue: `available_sizes` or `available_colors` failed

**Cause:** The schema expects these as TEXT (stringified JSON), not native arrays

**Solution:** They need to be stored as JSON strings:
```javascript
available_sizes: JSON.stringify(["2.2", "2.4"]),
available_colors: JSON.stringify([{name: "Red", hex: "#dc2626"}]),
```

### Issue: `image_url` failed

**Cause:** Might not accept null values

**Solution:** Use empty string instead:
```javascript
image_url: form.image_url || "",
```

### Issue: `category_id` failed

**Cause:** UUID format issue or null value when required

**Solution:** Ensure category_id is always a valid UUID string:
```javascript
category_id: selectedCategoryId || "", // or null if optional
```

### Issue: `is_active` failed

**Cause:** Column might not exist

**Solution:** Remove it from the payload:
```javascript
// Don't send is_active if it doesn't exist in schema
```

### Issue: Unknown column error

**Cause:** Sending a field that doesn't exist in the table

**Solution:** Remove that field from the payload

## Step 4: Check Your Supabase Schema

While the script runs, also verify your schema:

1. Go to [Supabase Dashboard](https://supabase.com)
2. Click on your project
3. Go to **Table Editor**
4. Click on **bangles** table
5. Check the column list and types

Expected columns (adjust based on your actual schema):
- `id` (UUID)
- `name` (Text)
- `description` (Text, optional)
- `price` (Numeric)
- `image_url` (Text, optional)
- `available_sizes` (JSON or Text)
- `available_colors` (JSON or Text)
- `category_id` (UUID, optional)
- `is_active` (Boolean)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Step 5: If Script Shows Which Field Failed

Once you know the problematic field:

1. **Note the field name**
2. **Check if that column exists** in Supabase
3. **Check the column type** (Text, Numeric, UUID, JSON, Boolean, etc.)
4. **Check if it's nullable** or has constraints
5. **Tell me the field and the error message**

## What Changed in the Latest Fix

✅ **Enhanced logging shows:**
- Exact payload in formatted JSON
- Each field's value, type, and validity
- Specific 400 error details
- Which step in the process failed

✅ **The ADVANCED_DIAGNOSTIC.js script:**
- Tests payload field by field
- Identifies exactly which field causes 400
- Shows the exact error message for each field
- Suggests which fields are required vs optional

## Next Steps

1. **Run ADVANCED_DIAGNOSTIC.js**
2. **Tell me which field fails** (the first ❌)
3. **I'll fix the payload format** to match your schema

The diagnostic script is powerful and will pinpoint the issue! 🎯
