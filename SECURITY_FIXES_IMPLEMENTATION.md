# 🔧 SECURITY FIXES - IMPLEMENTATION GUIDE

## Step-by-Step Code Changes & Configuration

---

## PART 1: IMMEDIATE FIXES (DO TODAY)

### Step 1: Secure Environment Variables

**File: `.env` → DELETE from repository**

```bash
# First, remove from Git history
git filter-repo --invert-paths --path .env
# OR
git filter-branch --tree-filter 'rm -f .env' -- --all

# Force push to clean history
git push origin main --force-with-lease
```

**File: `.env.local` (NEW - Add to .gitignore)**

```bash
# .env.local (DO NOT COMMIT)
VITE_SUPABASE_PROJECT_ID=your_new_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

**File: `.env.example` (NEW - Safe to commit)**

```bash
# .env.example
# Copy this file to .env.local and fill in real values
VITE_SUPABASE_PROJECT_ID=your_project_id_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
```

**File: `.gitignore` (UPDATE)**

```bash
# Environment variables (CRITICAL)
.env
.env.local
.env.*.local
.env.production.local

# Secrets
*.key
*.pem
secrets/
.secrets

# Build artifacts
dist/
build/
.next/

# Dependencies
node_modules/
.pnp
.pnp.js

# IDE
.vscode/*
!.vscode/settings.json
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
```

---

### Step 2: Rotate All API Keys

**Cloudinary API Key Rotation:**

```
1. Go to https://cloudinary.com/console/settings/security
2. Click "Regenerate Secret"
3. Update new secret in Vercel environment variables
4. Delete old secret immediately
```

**Supabase Key Rotation:**

```
1. Go to https://app.supabase.com/project/[project-id]/settings/api
2. Click on API Keys section
3. Regenerate "service_role" key
4. Regenerate "anon" key
5. Update in Vercel environment variables
6. Delete old keys
```

**Vercel Environment Variables Setup:**

```
Vercel Dashboard:
  → Project Settings
  → Environment Variables
  → Add new variables:
  
Production:
  VITE_SUPABASE_PROJECT_ID=new_id
  VITE_SUPABASE_PUBLISHABLE_KEY=new_key
  VITE_SUPABASE_URL=https://new-project.supabase.co
  VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
  
  (Remove old keys from all environments)
```

---

### Step 3: Setup Secure File Structure

Create new folder structure:

```bash
mkdir -p src/security
mkdir -p src/middleware
mkdir -p src/lib/validation
```

---

## PART 2: HIGH PRIORITY FIXES (This Week)

### Fix 1: Add Security Headers

**File: `vercel.json` (REPLACE)**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: https://res.cloudinary.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://api.cloudinary.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
        }
      ]
    }
  ]
}
```

---

### Fix 2: Enable Row Level Security (RLS)

**File: Supabase SQL Editor**

Execute these SQL commands:

```sql
-- 1. Enable RLS on all tables
ALTER TABLE bangles_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- 2. Policies for bangles_public (PUBLIC READ)
CREATE POLICY bangles_public_read ON bangles_public
  FOR SELECT USING (is_active = true);

-- 3. Policies for orders (OWNER READ, INSERT)
CREATE POLICY orders_user_read ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY orders_user_insert ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY orders_user_update ON orders
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Policies for profiles (OWNER RW)
CREATE POLICY profiles_owner_read ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_owner_update ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Policies for admin (VERIFY IN MIDDLEWARE)
CREATE POLICY admin_manage_bangles ON bangles_public
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 6. Cart policies (OWNER RW)
CREATE POLICY cart_owner_read ON cart
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cart_owner_write ON cart
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cart_owner_delete ON cart
  FOR DELETE USING (auth.uid() = user_id);
```

---

### Fix 3: Implement CSRF Protection

**File: `src/lib/csrf.ts` (NEW)**

```typescript
import { sha256 } from 'crypto-js';

export interface CSRFToken {
  token: string;
  signature: string;
  timestamp: number;
}

/**
 * Generate a CSRF token for form protection
 */
export function generateCSRFToken(): CSRFToken {
  const token = crypto.getRandomValues(new Uint8Array(32));
  const tokenHex = Array.from(token).map(b => b.toString(16).padStart(2, '0')).join('');
  const timestamp = Date.now();
  const signature = createSignature(tokenHex, timestamp);
  
  return {
    token: tokenHex,
    signature,
    timestamp
  };
}

/**
 * Create signature for token
 */
function createSignature(token: string, timestamp: number): string {
  const data = `${token}:${timestamp}:${process.env.VITE_CSRF_SECRET}`;
  return sha256(data).toString();
}

/**
 * Verify CSRF token (server-side)
 */
export function verifyCSRFToken(token: string, signature: string, timestamp: number): boolean {
  // Check if token is fresh (within 1 hour)
  if (Date.now() - timestamp > 3600000) {
    return false;
  }
  
  const expectedSignature = createSignature(token, timestamp);
  
  // Timing-safe comparison
  return constantTimeCompare(signature, expectedSignature);
}

/**
 * Timing-safe string comparison
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}
```

---

### Fix 4: Add Rate Limiting

**File: `src/middleware/rate-limit.ts` (NEW)**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory store (use Redis for production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/auth/login': { maxRequests: 5, windowMs: 3600000 }, // 5 per hour
  '/api/auth/register': { maxRequests: 3, windowMs: 86400000 }, // 3 per day
  '/api/orders': { maxRequests: 50, windowMs: 60000 }, // 50 per minute
  '/api/checkout': { maxRequests: 10, windowMs: 60000 }, // 10 per minute
};

export function applyRateLimit(path: string, ip: string): boolean {
  const config = RATE_LIMITS[path];
  if (!config) return true; // No limit for this path

  const key = `${ip}:${path}`;
  const now = Date.now();
  
  let record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    // Create new record
    requestCounts.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return true;
  }
  
  record.count++;
  
  return record.count <= config.maxRequests;
}

export function getRateLimitHeaders(path: string, ip: string) {
  const config = RATE_LIMITS[path];
  if (!config) return {};
  
  const key = `${ip}:${path}`;
  const record = requestCounts.get(key);
  
  if (!record) {
    return {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': config.maxRequests.toString(),
      'X-RateLimit-Reset': Date.now() + config.windowMs,
    };
  }
  
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': Math.max(0, config.maxRequests - record.count).toString(),
    'X-RateLimit-Reset': record.resetTime,
  };
}
```

---

### Fix 5: Input Validation Schema

**File: `src/lib/validation/schemas.ts` (NEW)**

```typescript
import { z } from 'zod';

// Authentication Schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[!@#$%^&*]/, 'Must contain special character'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
});

// Payment Schemas
export const PaymentProofSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  utr: z.string()
    .min(10, 'Invalid UTR')
    .max(50, 'UTR too long')
    .regex(/^[A-Z0-9]+$/, 'UTR must be alphanumeric'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount exceeds limit'),
});

// Product Schemas
export const ProductSchema = z.object({
  name: z.string().min(3, 'Product name required'),
  description: z.string().max(500, 'Description too long').optional(),
  price: z.number().positive('Price must be positive'),
  retail_price: z.number().positive().optional(),
  available_sizes: z.array(z.string()).min(1, 'At least one size required'),
  available_colors: z.array(z.string()).min(1, 'At least one color required'),
});

// Order Schemas
export const OrderSchema = z.object({
  items: z.array(z.object({
    bangles_id: z.string().uuid(),
    color: z.string(),
    size: z.string(),
    quantity: z.number().positive().int(),
  })),
  delivery_address: z.object({
    address_line1: z.string().min(5),
    city: z.string(),
    state: z.string(),
    pincode: z.string().regex(/^[0-9]{6}$/),
  }),
});

// File Upload Schemas
export const FileUploadSchema = z.object({
  size: z.number().max(5 * 1024 * 1024, 'File must be less than 5MB'),
  type: z.enum(['image/jpeg', 'image/png'], 'Only JPG/PNG allowed'),
  name: z.string()
    .max(255)
    .regex(/^[\w\-. ]+$/, 'Invalid filename characters'),
});

// Validate and return typed data
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors[0].message}`);
    }
    throw error;
  }
}
```

---

### Fix 6: Secure Token Storage

**File: `src/lib/secure-auth-storage.ts` (NEW)**

```typescript
/**
 * Secure storage for authentication tokens
 * Uses HttpOnly cookies (server-side) instead of localStorage
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Store token securely in HttpOnly cookie
 * This should be called server-side in API routes
 */
export async function storeTokenSecurely(token: AuthToken) {
  // Send to server to set HttpOnly cookie
  const response = await fetch('/api/auth/set-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(token),
    credentials: 'include'
  });
  
  return response.ok;
}

/**
 * Get token from secure storage
 * This retrieves from HttpOnly cookie via API
 */
export async function getStoredToken(): Promise<AuthToken | null> {
  const response = await fetch('/api/auth/get-session', {
    credentials: 'include'
  });
  
  if (!response.ok) return null;
  return response.json();
}

/**
 * Clear stored token
 */
export async function clearStoredToken() {
  await fetch('/api/auth/clear-session', {
    method: 'POST',
    credentials: 'include'
  });
  
  // Also notify Supabase
  await supabase.auth.signOut();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getStoredToken();
  return !!token;
}
```

**File: `pages/api/auth/set-session.ts` (NEW)**

```typescript
import { serialize } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  const { access_token, refresh_token, expires_in } = req.body;
  
  if (!access_token) {
    return res.status(400).json({ error: 'Missing token' });
  }
  
  // Set HttpOnly cookie
  res.setHeader('Set-Cookie', [
    serialize('auth-token', access_token, {
      httpOnly: true,        // ✅ Can't be accessed via JavaScript
      secure: true,          // ✅ Only sent over HTTPS
      sameSite: 'strict',    // ✅ CSRF protection
      maxAge: expires_in || 86400, // Expires in 1 day
      path: '/',
      domain: process.env.VERCEL_URL || 'localhost'
    }),
    serialize('refresh-token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 86400, // 30 days
      path: '/',
      domain: process.env.VERCEL_URL || 'localhost'
    })
  ]);
  
  res.status(200).json({ success: true });
}
```

**File: `pages/api/auth/get-session.ts` (NEW)**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies['auth-token'];
  const refreshToken = req.cookies['refresh-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'No session' });
  }
  
  res.status(200).json({
    access_token: token,
    refresh_token: refreshToken
  });
}
```

**File: `pages/api/auth/clear-session.ts` (NEW)**

```typescript
import { serialize } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  // Clear cookies by setting them with maxAge: 0
  res.setHeader('Set-Cookie', [
    serialize('auth-token', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: true
    }),
    serialize('refresh-token', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: true
    })
  ]);
  
  res.status(200).json({ success: true });
}
```

---

### Fix 7: Add Admin Access Verification

**File: `src/lib/admin-verification.ts` (NEW)**

```typescript
import { supabase } from '@/integrations/supabase/client';

/**
 * Verify admin status server-side (ALWAYS verify server-side)
 */
export async function verifyAdminAccess(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error || !data?.is_admin) {
      logSecurityEvent('unauthorized_admin_access', {
        userId,
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return false;
  }
}

/**
 * Middleware to protect admin routes
 */
export async function requireAdminAuth(userId: string | undefined) {
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  const isAdmin = await verifyAdminAccess(userId);
  if (!isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }
}

/**
 * Log security events for audit trail
 */
async function logSecurityEvent(eventType: string, details: any) {
  try {
    await supabase
      .from('security_audit_logs')
      .insert({
        event_type: eventType,
        details,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
```

---

## PART 3: Database Security Configuration

### Create Audit Logging Table

**File: Supabase SQL Editor**

```sql
-- Create audit logging table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(255),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY admin_read_audit_logs ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create security audit table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(255) NOT NULL,
  severity VARCHAR(50), -- LOW, MEDIUM, HIGH, CRITICAL
  details JSONB,
  ip_address INET,
  user_id UUID,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY admin_read_security_logs ON security_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

---

## PART 4: Testing Security Fixes

### Test Security Headers

```bash
# In terminal, run:
curl -i https://your-domain.com

# Should see headers like:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
```

### Test CSRF Protection

```typescript
// In browser console
fetch('/api/order', {
  method: 'POST',
  body: JSON.stringify({ items: [...] })
  // ❌ This should fail without CSRF token
});
```

### Test Rate Limiting

```bash
# Make multiple rapid requests
for i in {1..10}; do
  curl https://your-domain.com/api/auth/login -d '{"email":"test@test.com"}'
done

# Should get rate limit error after 5 attempts
```

---

## PART 5: Monitoring & Alerts

**File: `src/lib/monitoring.ts` (NEW)**

```typescript
import * as Sentry from "@sentry/react";

// Initialize Sentry for error tracking
export function initializeMonitoring() {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          if (event.request.url?.includes('password')) {
            return null;
          }
        }
        return event;
      },
    });
  }
}

// Log security events
export function reportSecurityEvent(
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: any
) {
  Sentry.captureMessage(`Security Event: ${type}`, {
    level: severity === 'critical' ? 'fatal' : 'warning',
    contexts: {
      security: {
        eventType: type,
        severity,
        ...details
      }
    }
  });
}
```

---

## IMPLEMENTATION TIMELINE

```
Monday:
  ⬜ Step 1: Secure env variables (.env cleanup)
  ⬜ Step 2: Rotate API keys

Tuesday:
  ⬜ Step 3: Add security headers
  ⬜ Step 4: Enable RLS policies

Wednesday-Thursday:
  ⬜ Step 5: Implement CSRF
  ⬜ Step 6: Add rate limiting

Friday:
  ⬜ Step 7: Input validation
  ⬜ Step 8: Secure token storage
  ⬜ Step 9: Admin verification
  
Next Week:
  ⬜ Testing and QA
  ⬜ Deploy to production
  ⬜ Monitor for issues
```

---

## SUCCESS CRITERIA

✅ All critical secrets removed from Git  
✅ Environmental variables properly managed  
✅ Security headers implemented  
✅ RLS policies enabled  
✅ Rate limiting functional  
✅ CSRF protection working  
✅ Input validation on all forms  
✅ Admin access verified server-side  
✅ Token storage secure  
✅ Audit logging active  

---

