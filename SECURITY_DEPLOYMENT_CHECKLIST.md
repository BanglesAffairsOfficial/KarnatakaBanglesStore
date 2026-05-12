# ⚡ SECURITY DEPLOYMENT CHECKLIST & QUICK REFERENCE

## CRITICAL ACTIONS - DO IMMEDIATELY

### [ ] 1. ROTATE ALL API KEYS (30 MINUTES)

```bash
# Task Checklist:
[ ] Open Cloudinary console: https://cloudinary.com/console/settings/security
    [ ] Click "Regenerate Secret"
    [ ] Copy new API_SECRET

[ ] Open Supabase: https://app.supabase.com/project/[id]/settings/api
    [ ] Regenerate anon key
    [ ] Regenerate service_role key
    [ ] Copy new keys

[ ] Update Vercel Environment Variables:
    [ ] Go to vercel.com → Project Settings → Environment Variables
    [ ] Update all new values
    [ ] Remove old values
    [ ] Redeploy

[ ] Verify in Git history for old values:
    git log --all -p | grep -i "cloudinary_api_secret"
    git log --all -p | grep -i "supabase_key"
    
[ ] If found, clean Git history:
    git filter-repo --invert-paths --path .env
    git push origin main --force-with-lease
```

**Estimated Time:** 30 minutes  
**Risk if Skipped:** 🔴 CRITICAL - Complete data breach

---

### [ ] 2. REMOVE .env FILE FROM REPOSITORY (20 MINUTES)

```bash
# In VS Code / Terminal:
[ ] File → Delete .env (confirm)

[ ] In terminal:
    git rm --cached .env
    git commit -m "Remove exposed .env file"
    git push

[ ] Verify .env is not tracked:
    git ls-files | grep -i ".env"  # Should be empty

[ ] Create .env.local (NEVER commit):
    [ ] Copy values from Vercel environment
    [ ] Add to .gitignore
    
[ ] Create .env.example (Safe to commit):
    [ ] Template with dummy values
    [ ] Commit to repo

[ ] Update .gitignore:
    [ ] Add .env*
    [ ] Add *.key and *.pem
    [ ] Add secrets/
```

**Estimated Time:** 20 minutes  
**Risk if Skipped:** 🔴 CRITICAL - Anyone can clone and see secrets

---

### [ ] 3. ADD SECURITY HEADERS (15 MINUTES)

```bash
# In VS Code:
[ ] Open vercel.json
[ ] Replace content with security headers from SECURITY_FIXES_IMPLEMENTATION.md
[ ] Commit: git commit -am "Add security headers"
[ ] git push
[ ] Wait for Vercel deployment

# Verify headers are set:
[ ] curl -i https://your-domain.com
[ ] Check for X-Frame-Options, HSTS, CSP headers
```

**Estimated Time:** 15 minutes  
**Risk if Skipped:** 🟡 MEDIUM - Vulnerable to frame injection, clickjacking

---

### [ ] 4. ENABLE ROW LEVEL SECURITY (RLS) (45 MINUTES)

```bash
# In Supabase Dashboard:
[ ] Click SQL Editor
[ ] Copy-paste SQL commands from SECURITY_FIXES_IMPLEMENTATION.md
[ ] Execute each:
    - ALTER TABLE bangles_public ENABLE ROW LEVEL SECURITY;
    - ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    - ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    - [Continue for all tables]

[ ] Create RLS policies (copy from implementation guide)
[ ] Verify RLS is enabled:
    [ ] Go to Authentication → Policies
    [ ] All tables should show RLS: ON

[ ] Test RLS:
    [ ] Try to query orders without authentication
    [ ] Should fail or return empty
```

**Estimated Time:** 45 minutes  
**Risk if Skipped:** 🔴 CRITICAL - Unauthorized data access

---

## HIGH PRIORITY FIXES (THIS WEEK)

### [ ] 5. IMPLEMENT CSRF PROTECTION (2-3 HOURS)

**Files to Create:**
```bash
[ ] src/lib/csrf.ts
```

**Files to Update:**
```bash
[ ] src/contexts/AuthContext.tsx - Add CSRF token
[ ] src/pages/Auth.tsx - Include CSRF in forms
[ ] src/pages/Cart.tsx - Add CSRF to checkout
[ ] src/pages/Payment.tsx - Add CSRF validation
```

**Verify:**
```bash
[ ] Forms include hidden _csrf input field
[ ] CSRF validation in backend
[ ] CSRF failures return 403 status
```

---

### [ ] 6. ADD INPUT VALIDATION (2-3 HOURS)

**Files to Create:**
```bash
[ ] src/lib/validation/schemas.ts
```

**Files to Update:**
```bash
[ ] src/pages/Auth.tsx - Add schema validation
[ ] src/pages/Payment.tsx - Add PaymentProofSchema
[ ] src/pages/Cart.tsx - Add OrderSchema
```

**Verify:**
```bash
[ ] All forms validate before submit
[ ] Server-side validation on API routes
[ ] Invalid inputs rejected with 400 status
```

---

### [ ] 7. IMPLEMENT RATE LIMITING (1-2 HOURS)

**Files to Create:**
```bash
[ ] src/middleware/rate-limit.ts
```

**Files to Update:**
```bash
[ ] pages/api/auth/login.ts - Apply rate limiting
[ ] pages/api/auth/register.ts - Apply rate limiting
[ ] pages/api/orders/create.ts - Apply rate limiting
```

**Verify:**
```bash
[ ] 5 failed logins → blocked for 1 hour
[ ] Test with curl:
    for i in {1..10}; do curl /api/auth/login; done
[ ] 429 status appears after limit
```

---

### [ ] 8. SECURE TOKEN STORAGE (1-2 HOURS)

**Files to Create:**
```bash
[ ] src/lib/secure-auth-storage.ts
[ ] pages/api/auth/set-session.ts
[ ] pages/api/auth/get-session.ts
[ ] pages/api/auth/clear-session.ts
```

**Files to Update:**
```bash
[ ] src/contexts/AuthContext.tsx - Use HttpOnly cookies
[ ] src/integrations/supabase/client.ts - Update storage config
```

**Verify:**
```bash
[ ] No tokens in localStorage (open DevTools → Application)
[ ] Tokens in HttpOnly cookies (DevTools → Storage → Cookies)
[ ] Cannot access token via console: document.cookie.auth_token
```

---

### [ ] 9. ADMIN ACCESS VERIFICATION (1 HOUR)

**Files to Create:**
```bash
[ ] src/lib/admin-verification.ts
```

**Files to Update:**
```bash
[ ] src/pages/Admin.tsx - Add server-side verification
[ ] pages/api/admin/[endpoint].ts - Check admin status
```

**Verify:**
```bash
[ ] Non-admin users cannot access /admin
[ ] Modifying localStorage isAdmin=true doesn't grant access
[ ] Server-side verification prevents exploitation
```

---

## MEDIUM PRIORITY FIXES (NEXT 2-3 WEEKS)

### [ ] 10. ADD FILE UPLOAD VALIDATION (2 HOURS)

```bash
[ ] Create: src/lib/file-security.ts
[ ] Update: src/pages/Payment.tsx
[ ] Test: Try uploading .exe, .zip, .txt files
[ ] Verify: Only JPG/PNG accepted
```

---

### [ ] 11. ADD MONITORING & LOGGING (1-2 HOURS)

```bash
[ ] Create: src/lib/monitoring.ts
[ ] npm install sentry
[ ] Configure SENTRY_DSN in Vercel
[ ] Create: Database audit log tables
[ ] Test: Trigger error, check Sentry dashboard
```

---

### [ ] 12. ADD SECURE ERROR HANDLING (1-2 HOURS)

```bash
[ ] Review all catch blocks
[ ] Never expose database errors to users
[ ] Log real errors server-side
[ ] Show generic messages to users
```

---

## TESTING CHECKLIST

### Security Tests
```bash
[ ] Test 1: Check for exposed secrets in Git
    git log --all -p --grep="secret\|password\|key" | head -20

[ ] Test 2: Verify security headers
    curl -i https://your-domain.com | grep -i "security\|frame\|xss"

[ ] Test 3: Test rate limiting
    for i in {1..10}; do curl /api/auth/login 2>/dev/null; done

[ ] Test 4: Verify CSRF protection
    curl -X POST /api/orders/create -d '{}' (should fail)

[ ] Test 5: Test RLS policies
    Try to access other user's orders (should fail)

[ ] Test 6: Test input validation
    curl /api/orders/create -d '{"amount": -1000}' (should fail)

[ ] Test 7: Verify secure cookies
    Open DevTools → Application → Cookies (no auth-token visible in JS)

[ ] Test 8: Test admin access
    Login as non-admin, try to access /admin (should redirect)

[ ] Test 9: Test file upload security
    Try uploading .exe file (should be rejected)

[ ] Test 10: Check for XSS
    Try injecting <script> in product search (should be escaped)
```

---

## DEPLOYMENT STEPS

### Pre-Production Checklist

```bash
[ ] All critical issues fixed
[ ] All high issues fixed
[ ] Security tests passing
[ ] No secrets in Git
[ ] RLS enabled
[ ] Security headers set
[ ] Rate limiting working
[ ] Monitoring configured
[ ] Backup strategy documented
[ ] Incident response plan created
```

### Deployment Process

```bash
# 1. Final verification
[ ] Run security tests
[ ] Review changes
[ ] Get approval from team

# 2. Create release branch
git checkout -b security/hardening-release
git branch -u origin/security/hardening-release

# 3. Commit changes
git add .
git commit -m "Security hardening: Fix critical vulnerabilities

- Rotate all API keys
- Add security headers
- Enable RLS policies
- Implement CSRF protection
- Add input validation
- Add rate limiting
- Secure token storage
- Verify admin access server-side"

# 4. Create pull request
git push origin security/hardening-release

[ ] Go to GitHub/GitLab
[ ] Create PR to main branch
[ ] Request code review
[ ] Get approval

# 5. Deploy to production
[ ] Vercel auto-deploys on merge
[ ] Monitor deployment logs
[ ] Check error tracking (Sentry)
[ ] Verify security tests pass

# 6. Post-deployment verification
[ ] Test login flow
[ ] Test order creation
[ ] Check error logs
[ ] Monitor for suspicious activity
```

---

## WEEK 1 TIMELINE

**Monday:**
```
9:00 AM - Rotate API keys (Cloudinary, Supabase)
10:00 AM - Remove .env from Git
11:00 AM - Add security headers (vercel.json)
1:00 PM - Enable RLS policies
3:00 PM - Implement CSRF protection
```

**Tuesday:**
```
9:00 AM - Add input validation schemas
11:00 AM - Implement rate limiting
1:00 PM - Secure token storage
3:00 PM - Admin access verification
```

**Wednesday:**
```
9:00 AM - File upload validation
11:00 AM - Add monitoring/logging
1:00 PM - Test security fixes
3:00 PM - Review and refine
```

**Thursday-Friday:**
```
Deploy to staging
Test thoroughly
Fix any issues
Deploy to production
Monitor for issues
```

---

## ONGOING MAINTENANCE

### Weekly
```bash
[ ] Review admin audit logs
[ ] Check for failed login attempts
[ ] Monitor error tracking (Sentry)
[ ] Check rate limit violations
```

### Monthly
```bash
[ ] Run dependency security audit
    npm audit
    npm audit fix

[ ] Test disaster recovery
[ ] Review access logs
[ ] Update security documentation
[ ] Security training for team
```

### Quarterly
```bash
[ ] Full penetration testing
[ ] Review all RLS policies
[ ] Update security headers
[ ] Rotate sensitive credentials
```

### Annually
```bash
[ ] Full security audit (third-party)
[ ] Security certification (if needed)
[ ] Policy updates
[ ] Team security training
```

---

## SUPPORT & RESOURCES

### If You Get Stuck

**Problem:** "How do I verify RLS is working?"
**Solution:** 
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**Problem:** "How do I see security events?"
**Solution:** 
```sql
SELECT * FROM security_audit_logs 
ORDER BY created_at DESC LIMIT 10;
```

**Problem:** "How do I test CSRF protection?"
**Solution:**
```bash
# Try POST without CSRF token
curl -X POST https://your-domain.com/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{"items": []}'

# Should get 403 Forbidden
```

**Problem:** "How do I rotate Supabase keys?"
**Solution:** 
Go to app.supabase.com → [project] → Settings → API → Keys → Regenerate

---

## COMMON ERRORS & FIXES

### Error: "CSRF token invalid"
```
✅ Fix: Make sure token is generated fresh on page load
✅ Fix: Ensure token is sent in headers (not just body)
✅ Fix: Check token hasn't expired (1 hour)
```

### Error: "Row level policy violation"
```
✅ Fix: User must be authenticated (auth.uid() works)
✅ Fix: Check RLS policies match your use case
✅ Fix: Verify auth.uid() returns expected user ID
```

### Error: "File upload too large"
```
✅ Fix: Check MAX_FILE_SIZE in PaymentPage component
✅ Fix: Server-side should also validate size
✅ Fix: Cloudinary has 20MB limit for authenticated requests
```

### Error: "Rate limit exceeded"
```
✅ Fix: Wait for time window to reset
✅ Fix: Use different IP address for testing
✅ Fix: Check rate limit configuration (too strict?)
```

---

## SECURITY METRICS TO TRACK

```
🔴 Critical Issues
  - Exposed secrets: 0
  - Unauthorized data access: 0
  - Failed RLS policies: 0

🟠 High Issues
  - Failed CSRF validations: Log these
  - Rate limit violations: < 10/day
  - Authentication failures: < 50/day

🟡 Medium Issues
  - Invalid inputs rejected: Log rate
  - Admin access denials: Acceptable
  - File upload rejections: Expected
```

---

## FINAL NOTES

✅ **Security is never "done"** - Commit to regular reviews  
✅ **Users trust you** - Protect their data like it's yours  
✅ **Act fast on vulnerabilities** - Every day puts them at risk  
✅ **Document everything** - Your team needs to know the plan  
✅ **Test regularly** - Don't assume fixes work  
✅ **Stay updated** - New vulnerabilities discovered daily  

---

**Last Updated:** May 2026  
**Next Review:** August 2026  
**Audit Frequency:** Quarterly  

