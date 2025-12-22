# Quick Fix Guide: "Failed to Add Bangle" Error

## 🚀 Try These First (in order)

### 1. **Check if you selected a category** ✓
   - When adding a product, there's a category dropdown
   - **Make sure a category is selected** before clicking "Save"
   - If dropdown is empty, go to Admin → Taxonomy and create a category first

### 2. **Refresh the page** ✓
   - Press `F5` or `Ctrl+R`
   - Log out and log back in
   - This fixes session/JWT issues

### 3. **Use the diagnostic script** (1 minute)
   ```
   1. Press F12 to open browser console
   2. Go to Console tab
   3. Copy DIAGNOSTIC_SCRIPT.js and paste into console
   4. Press Enter
   5. Wait for results (looks like a checklist)
   6. Check for ❌ items
   ```

---

## 🔍 Detailed Error Investigation

### If you see the error toast:
1. **Open browser console** (F12 → Console)
2. **Look for messages starting with `[Bangle]`**
3. **Copy the error message**

### Common errors you might see:

| Error | Cause | Fix |
|-------|-------|-----|
| `"category_id" not null` | Category not selected | Select a category from dropdown |
| `column 'category_id' does not exist` | Database schema is wrong | Run Supabase migrations |
| `FK constraint` | Category ID doesn't exist | Create category in Taxonomy tab |
| `violates row-level security policy` | RLS policies blocking INSERT | Check Supabase RLS settings |
| `JWT expired` | Session expired | Refresh page and log in again |

---

## 📋 Pre-flight Checklist

Before adding a bangle, verify:
- [ ] You're logged in as admin (header shows "Admin Panel")
- [ ] At least one category exists (Admin → Taxonomy tab)
- [ ] Product name field is filled
- [ ] Product price field is filled
- [ ] Category dropdown has a selection
- [ ] You're not using an already existing product name

---

## 🛠️ Automatic Diagnostic

Run this command to auto-check everything:

**Browser Console (F12):**
```javascript
// Copy and paste DIAGNOSTIC_SCRIPT.js content here
```

This will:
- ✅ Check if authenticated
- ✅ Check if can access database
- ✅ Check if categories exist
- ✅ Test INSERT permission
- ✅ Check admin role
- ✅ Show exactly what's wrong

---

## 📚 Detailed Guides

For more information, see:
- `TROUBLESHOOT_BANGLE_ERROR.md` - Complete troubleshooting guide
- `DEBUG_UNABLE_TO_DO_ERROR.md` - Settings/RLS debugging
- `DIAGNOSTIC_SCRIPT.js` - Automated checker

---

## 🆘 Still Not Working?

1. Check browser console for **exact error message**
2. Run DIAGNOSTIC_SCRIPT.js to identify the issue
3. Look up the error in TROUBLESHOOT_BANGLE_ERROR.md
4. If still stuck, provide:
   - Screenshot of error toast
   - Console output from `[Bangle]` logs
   - Result of DIAGNOSTIC_SCRIPT.js
