# Debugging the "Unable to Do" Settings Save Error

## Enhanced Logging Added
The `handleSaveSocialLinks` function in [src/pages/Admin.tsx](src/pages/Admin.tsx) now includes detailed console logging:

```
[Settings] Saving payload: {payload object}
[Settings] Supabase upsert error: {error details}
[Settings] Successfully saved: {response data}
```

## How to Debug

### Step 1: Open Browser Console
1. Go to Admin Panel → Settings tab
2. Press `F12` to open Developer Tools
3. Click on the "Console" tab
4. Clear any previous messages

### Step 2: Attempt to Save Settings
1. Make changes to social links or WhatsApp number
2. Click "Save All Settings" button
3. Check the console output

### What to Look For

**If Save Succeeds:**
```
[Settings] Saving payload: {id: 1, instagram_link: "...", ...}
[Settings] Successfully saved: [{id: 1, ...}]
```

**If Save Fails:**
```
[Settings] Saving payload: {id: 1, instagram_link: "...", ...}
[Settings] Supabase upsert error: {message: "...", hint: "...", code: "..."}
```

## Common Issues & Solutions

### 1. Column Name Mismatch
**Error message:** "column 'instagram_link' does not exist"

**Check:** In Supabase, go to Table Editor → settings table
- Verify columns exist: `instagram_link`, `facebook_link`, `twitter_link`, `email`, `whatsapp_number`
- If missing, run migration: `supabase migration up`

### 2. RLS Policy Issue
**Error message:** "new row violates row-level security policy"

**Check:** Supabase → settings table → RLS policies
- Ensure authenticated users can INSERT and UPDATE
- If needed, add policy: `CREATE POLICY allow_insert_settings ON settings FOR INSERT TO authenticated WITH CHECK (true);`

### 3. Upsert Conflict Key Issue
**Error message:** "there is no unique or exclusion constraint matching the ON CONFLICT specification"

**Fix:** Change the query to use `merge` instead:
```typescript
// Current (may fail if no unique constraint on id):
await (supabase as any).from("settings").upsert(payload, { onConflict: "id" });

// Alternative (use delete + insert):
await (supabase as any).from("settings").delete().eq("id", 1);
await (supabase as any).from("settings").insert(payload);
```

### 4. Payload Type Mismatch
**Error message:** "invalid input syntax for type uuid" or similar

**Check:** Ensure all field values are correct types:
- `id`: number (should be `1`)
- `instagram_link`, etc.: strings (or null)
- `whatsapp_number`: string or null

### 5. Authentication Issue
**Error message:** "JWT expired" or permission denied

**Fix:** Refresh page and log back in

## Step-by-Step Investigation Guide

1. **Test in Admin Panel:**
   - Change WhatsApp number field
   - Open console (F12)
   - Click "Save All Settings"
   - Copy console output

2. **Check Database Schema:**
   - Go to Supabase Dashboard
   - Navigate to Table Editor
   - Select "settings" table
   - Check columns and types

3. **Review RLS Policies:**
   - In Supabase, go to settings table
   - Click "RLS" tab
   - Verify policies allow your user

4. **Test with Direct SQL (if needed):**
   - In Supabase SQL Editor
   - Run: `SELECT * FROM settings LIMIT 1;`
   - Should return existing row or empty result
   - If error, schema is broken

## Improved Error Messages
After investigation, error messages now show:
- `error.message` - what failed
- `error.hint` - how to fix it
- Link to browser console for full details

## Quick Fix Checklist
- [ ] Browser console shows detailed error message
- [ ] Settings table exists with correct columns
- [ ] RLS policies allow INSERT/UPDATE for authenticated users
- [ ] Payload has correct types and values
- [ ] User is authenticated and has valid JWT
- [ ] Try clearing browser cache and refreshing
