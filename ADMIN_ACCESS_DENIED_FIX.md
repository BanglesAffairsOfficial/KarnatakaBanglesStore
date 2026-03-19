# Admin Access Denied - ROOT CAUSE & FIX

## Problem
Admin users were getting "Access denied" when trying to access admin pages.

## Root Cause
A **parameter order mismatch** in the `has_role()` function across multiple files:

1. **Function Definition** (migration file):
   - Was: `CREATE FUNCTION has_role(r app_role, u uuid)` — Role FIRST, then User
   
2. **Frontend RPC Call** (AuthContext.tsx):
   - `supabase.rpc('has_role', { _user_id: userId, _role: 'admin' })`
   - Expected User FIRST, then Role
   
3. **Database Policies** (SQL migrations):
   - Were inconsistently using: `public.has_role('admin', auth.uid())` — Role FIRST
   - Some were missing `public.` prefix
   - Some were missing `::uuid` cast

This mismatch meant:
- The user ID was being passed where a role was expected
- The role was being passed where a user ID was expected
- No admin users could be found (returned false incorrectly)

## Solution Applied

Fixed 3 files to standardize the parameter order to **User ID FIRST, Role SECOND**:

### 1. `/supabase/migrations/20251222000100_create_full_schema_if_not_exists.sql`
```sql
-- BEFORE:
CREATE FUNCTION has_role(r app_role, u uuid) ...

-- AFTER:
CREATE FUNCTION has_role(_user_id uuid, _role app_role) ...
```
Also fixed all RLS policies to use: `public.has_role(auth.uid()::uuid, 'admin'::app_role)`

### 2. `/supabase/migrations/20251221125850_57249ba7-4e5c-4dfd-94c4-e7d369b20b42.sql`
```sql
-- BEFORE:
USING (has_role(auth.uid(), 'admin'::app_role));

-- AFTER:
USING (public.has_role(auth.uid()::uuid, 'admin'::app_role));
```
Added `public.` prefix and `::uuid` cast.

### 3. `/src/integrations/supabase/types.ts`
Updated TypeScript function signature to match new parameter order:
```typescript
has_role: {
  Args: {
    _user_id: string
    _role: app_role
  }
  Returns: boolean
}
```

## Next Steps
1. Regenerate database migrations from Supabase (or apply these changes)
2. Test admin login - should now work!
3. Clear any cached authentication state if needed

## Verification
Check that admin user's role exists in Supabase:
```sql
SELECT * FROM public.user_roles WHERE user_id = '<admin-user-id>';
```
Should return a row with `role = 'admin'`
