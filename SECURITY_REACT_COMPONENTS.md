# 🔐 REACT COMPONENT SECURITY FIXES

## Safe Code Examples & Secure Patterns

---

## 1. SAFE INPUT FORM COMPONENTS

### ❌ VULNERABLE Form Component

```tsx
// ❌ DON'T DO THIS
export function VulnerableLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // No validation, no CSRF protection
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    // No rate limiting enforcement
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        // ❌ No validation
      />
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        // ❌ Password in state (bad for memory dumps)
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### ✅ SECURE Form Component

```tsx
// ✅ DO THIS
import { useState } from 'react';
import { useFormCache } from '@/hooks/useFormCache';
import { LoginSchema } from '@/lib/validation/schemas';
import { generateCSRFToken, type CSRFToken } from '@/lib/csrf';

export function SecureLoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCSRFToken] = useState<CSRFToken | null>(null);
  
  // Use ref instead of state for sensitive data
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  // Generate CSRF token on mount
  useEffect(() => {
    setCSRFToken(generateCSRFToken());
  }, []);
  
  const validateForm = () => {
    const email = emailRef.current?.value || '';
    const password = passwordRef.current?.value || '';
    
    try {
      LoginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!csrfToken) {
      setErrors({ general: 'Security token missing. Please refresh.' });
      return;
    }
    
    setLoading(true);
    
    try {
      const email = emailRef.current?.value || '';
      const password = passwordRef.current?.value || '';
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken.token,
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Include cookies
      });
      
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setErrors({ general: 'Too many login attempts. Try again later.' });
        } else {
          setErrors({ general: data.error || 'Login failed' });
        }
        return;
      }
      
      // Clear form
      if (emailRef.current) emailRef.current.value = '';
      if (passwordRef.current) passwordRef.current.value = '';
      
      // Redirect
      window.location.href = '/dashboard';
    } catch (error) {
      setErrors({ general: 'Network error' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          ref={emailRef}
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          disabled={loading}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="error" role="alert">
            {errors.email}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          ref={passwordRef}
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={loading}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="error" role="alert">
            {errors.password}
          </p>
        )}
      </div>
      
      {errors.general && (
        <div className="error-box" role="alert">
          {errors.general}
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="button button-primary"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      
      {/* CSRF token in hidden field */}
      <input type="hidden" name="_csrf" value={csrfToken?.token} />
    </form>
  );
}
```

---

## 2. SECURE PAYMENT FORM

### ✅ Payment Form with Validation

```tsx
// pages/Payment.tsx (UPDATED)
import { useState, useRef } from 'react';
import { FileUploadSchema, PaymentProofSchema } from '@/lib/validation/schemas';
import { validateImageFile } from '@/lib/file-security';

export default function PaymentPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // Use refs for sensitive data
  const utrRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    try {
      // Validate file schema
      FileUploadSchema.parse({
        size: selected.size,
        type: selected.type,
        name: selected.name,
      });
      
      // Validate and sanitize image
      const sanitized = await validateImageFile(selected);
      
      // Create new File object from sanitized buffer
      const blob = new Blob([sanitized], { type: 'image/jpeg' });
      fileRef.current = new File([blob], 'payment-proof.jpg', { type: 'image/jpeg' });
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.file;
        return newErrors;
      });
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        file: error instanceof Error ? error.message : 'Invalid file'
      }));
    }
  };
  
  const handleSubmit = async () => {
    if (!order || !orderId) return;
    
    const utr = utrRef.current?.value || '';
    const file = fileRef.current;
    
    // Validate inputs
    const newErrors: Record<string, string> = {};
    
    try {
      PaymentProofSchema.parse({
        orderId,
        utr,
        amount: order.total_amount || 0,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
      }
    }
    
    if (!file) {
      newErrors.file = 'Payment screenshot required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('utr', utr);
      formData.append('amount', order.total_amount?.toString() || '0');
      formData.append('file', file);
      
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const data = await response.json();
        setErrors({ general: data.error || 'Payment verification failed' });
        return;
      }
      
      // Clear sensitive data
      if (utrRef.current) utrRef.current.value = '';
      
      // Show success
      toast({ title: 'Payment submitted', description: 'We will verify your payment.' });
      navigate('/order-history');
    } catch (error) {
      setErrors({ general: 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div>
        <label htmlFor="utr">UPI Transaction ID</label>
        <input
          id="utr"
          ref={utrRef}
          type="text"
          placeholder="Enter UTR"
          required
          disabled={submitting}
          autoComplete="off"
        />
        {errors.utr && <p className="error">{errors.utr}</p>}
      </div>
      
      <div>
        <label htmlFor="file">Payment Screenshot</label>
        <input
          id="file"
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          disabled={submitting}
        />
        {errors.file && <p className="error">{errors.file}</p>}
      </div>
      
      {errors.general && <p className="error">{errors.general}</p>}
      
      <button type="submit" disabled={submitting}>
        {submitting ? 'Verifying...' : 'Submit Payment Proof'}
      </button>
    </form>
  );
}
```

---

## 3. SECURE ORDER FORM

### ✅ Order Form with CSRF & Validation

```tsx
// pages/Checkout.tsx (UPDATED)
import { useState, useEffect } from 'react';
import { generateCSRFToken, type CSRFToken } from '@/lib/csrf';
import { OrderSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

export default function Checkout() {
  const [csrfToken, setCSRFToken] = useState<CSRFToken | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  const { items, totalAmount } = useCart();
  const { user } = useAuth();
  
  // Initialize CSRF token
  useEffect(() => {
    setCSRFToken(generateCSRFToken());
  }, []);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!csrfToken) {
      setErrors({ general: 'Security error. Please refresh page.' });
      return;
    }
    
    if (!user) {
      setErrors({ general: 'Please login to place order' });
      return;
    }
    
    // Validate form data
    const formData = new FormData(e.currentTarget);
    const orderData = {
      items,
      delivery_address: {
        address_line1: formData.get('address_line1'),
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode'),
      },
    };
    
    try {
      OrderSchema.parse(orderData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken.token, // Include CSRF token
        },
        body: JSON.stringify({
          ...orderData,
          _csrf: csrfToken.token,
          _csrfSignature: csrfToken.signature,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          setErrors({ general: 'Too many requests. Please wait.' });
        } else {
          const data = await response.json();
          setErrors({ general: data.error || 'Order creation failed' });
        }
        return;
      }
      
      const order = await response.json();
      navigate(`/payment/${order.id}`);
    } catch (error) {
      setErrors({ general: 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      {/* Delivery Address */}
      <fieldset>
        <legend>Delivery Address</legend>
        
        <input
          type="text"
          name="address_line1"
          placeholder="House number, building name"
          required
          disabled={submitting}
          aria-describedby={errors.delivery_address?.address_line1 ? 'address-error' : undefined}
        />
        {errors['delivery_address.address_line1'] && (
          <p id="address-error" className="error">
            {errors['delivery_address.address_line1']}
          </p>
        )}
        
        <input
          type="text"
          name="city"
          placeholder="City"
          required
          disabled={submitting}
        />
        
        <input
          type="text"
          name="state"
          placeholder="State"
          required
          disabled={submitting}
        />
        
        <input
          type="text"
          name="pincode"
          placeholder="Pincode (6 digits)"
          pattern="\d{6}"
          required
          disabled={submitting}
        />
      </fieldset>
      
      {/* Order Summary */}
      <section className="order-summary">
        <h3>Order Total: ₹{totalAmount}</h3>
        <p>Items: {items.length}</p>
      </section>
      
      {/* Error Messages */}
      {errors.general && (
        <div className="error-box" role="alert">
          {errors.general}
        </div>
      )}
      
      {/* CSRF Token */}
      <input type="hidden" name="_csrf" value={csrfToken?.token} />
      <input type="hidden" name="_csrfSignature" value={csrfToken?.signature} />
      
      {/* COD Badge */}
      <div className="cod-badge">
        ✓ Pay on Delivery Available
      </div>
      
      <button
        type="submit"
        disabled={submitting || items.length === 0}
        className="button button-primary button-large"
      >
        {submitting ? 'Processing...' : 'Proceed to Payment'}
      </button>
    </form>
  );
}
```

---

## 4. SECURE ADMIN PANEL

### ✅ Admin Page Guard

```tsx
// pages/Admin.tsx (UPDATED)
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { verifyAdminAccess } from '@/lib/admin-verification';

export default function Admin() {
  const { user, isAdmin, roleChecked } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !roleChecked) {
        setLoading(true);
        return;
      }
      
      if (!isAdmin) {
        // Verify server-side (important!)
        const access = await verifyAdminAccess(user.id);
        if (!access) {
          navigate('/');
          return;
        }
      }
      
      setHasAccess(true);
      setLoading(false);
    };
    
    checkAccess();
  }, [user, isAdmin, roleChecked]);
  
  if (loading) return <LoadingSpinner />;
  
  if (!hasAccess) {
    return (
      <div className="error-page">
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }
  
  return (
    <div className="admin-layout">
      {/* Admin content */}
    </div>
  );
}
```

---

## 5. SAFE API DATA HANDLING

### ✅ Secure Data Fetching Hook

```tsx
// hooks/useSecureFetch.ts (NEW)
import { useState, useCallback } from 'react';
import { validateInput } from '@/lib/validation/schemas';
import { z } from 'zod';

interface UseFetchOptions<T> {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  validationSchema?: z.ZodSchema<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useSecureFetch<T = any>(
  url: string,
  options: UseFetchOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetch = useCallback(
    async (body?: Record<string, any>) => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include', // Include cookies
        });
        
        if (!response.ok) {
          // Don't expose internal errors
          if (response.status === 500) {
            throw new Error('Server error');
          }
          
          const errorData = await response.json();
          throw new Error(errorData.error || 'Request failed');
        }
        
        let result = await response.json();
        
        // Validate response schema if provided
        if (options.validationSchema) {
          try {
            result = options.validationSchema.parse(result);
          } catch (error) {
            throw new Error('Invalid response format');
          }
        }
        
        setData(result);
        options.onSuccess?.(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setError(message);
        options.onError?.(message);
      } finally {
        setLoading(false);
      }
    },
    [url, options]
  );
  
  return { data, error, loading, fetch };
}
```

**Usage Example:**

```tsx
import { useSecureFetch } from '@/hooks/useSecureFetch';
import { ProductSchema } from '@/lib/validation/schemas';

export function ProductList() {
  const { data: products, loading, error, fetch } = useSecureFetch(
    '/api/products',
    {
      method: 'GET',
      validationSchema: z.array(ProductSchema),
      onError: (error) => console.error('Failed to load:', error)
    }
  );
  
  useEffect(() => {
    fetch();
  }, [fetch]);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div className="product-list">
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## 6. PREVENT XSS ATTACKS

### ✅ Safe Content Rendering

```tsx
// ❌ VULNERABLE
function VulnerableDisplay({ content }: { content: string }) {
  return (
    <div dangerousSetInnerHTML={{ __html: content }} />
  );
}

// ✅ SAFE (Option 1: React auto-escapes)
function SafeDisplay1({ content }: { content: string }) {
  return <div>{content}</div>;
}

// ✅ SAFE (Option 2: DOMPurify for HTML)
import DOMPurify from 'dompurify';

function SafeDisplay2({ content }: { content: string }) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|sms|news|xmpp):|[^a-z]|[a-z+.\-]*(?:[^a-z+.\-:]|$))/i,
  });
  
  return <div dangerousSetInnerHTML={{ __html: sanitized }} />;
}

// ✅ SAFE (Option 3: Component-based rendering)
function SafeDisplay3({ content }: { content: string }) {
  // Markdown to React conversion
  return <ReactMarkdown>{content}</ReactMarkdown>;
}
```

---

## 7. SECURE ERROR HANDLING

### ✅ Don't Expose Sensitive Errors

```tsx
// ❌ VULNERABLE - Exposes database errors
async function handleDelete(id: string) {
  try {
    await deleteItem(id);
  } catch (error) {
    toast({
      // Exposes error details (SQL syntax, table names, etc)
      description: error.message
    });
  }
}

// ✅ SAFE - Generic user message
async function handleDelete(id: string) {
  try {
    await deleteItem(id);
    toast({ description: 'Item deleted successfully' });
  } catch (error) {
    // Log real error server-side
    console.error('Delete failed:', error);
    
    // Show generic message to user
    toast({
      description: 'Failed to delete item. Please try again.'
    });
  }
}
```

---

## Key Takeaways

✅ **Always validate server-side**  
✅ **Never expose sensitive errors**  
✅ **Use refs for sensitive data**  
✅ **Validate before sending**  
✅ **Include CSRF tokens**  
✅ **Use credentials: 'include' with cookies**  
✅ **Sanitize HTML content**  
✅ **Implement rate limiting**  
✅ **Log security events**  
✅ **Test security regularly**  

---

