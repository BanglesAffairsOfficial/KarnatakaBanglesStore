# Deployment, Scaling & Operations Guide

## 🚀 Deployment Strategy

### Multi-Environment Setup

```
Development → Staging → Production
    ↓          ↓           ↓
  Vite      Vercel      Vercel
  Local     Preview     Production
  
+ Supabase Dev DB → Supabase Staging → Supabase Production
```

### Environment Configuration

**`.env.production`:**
```bash
# Vercel deployment (auto-configured)
VERCEL_URL=yourstore.com

# APIs
VITE_API_URL=https://api.yourstore.com
VITE_API_KEY=prod_key_xxxxx

# Supabase (Production)
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key_xxxxx

# Payment Gateways (Production Keys)
VITE_RAZORPAY_KEY_ID=razorpay_live_xxxxx
RAZORPAY_KEY_SECRET=razorpay_secret_xxxxx

# Email Service
SENDGRID_API_KEY=sendgrid_prod_key_xxxxx

# Analytics
VITE_GA4_MEASUREMENT_ID=G-XXXXX
VITE_META_PIXEL_ID=pixel_prod_id_xxxxx

# Security
JWT_SECRET=highly_random_secret_string_min_32_chars
ENCRYPTION_KEY=encryption_key_for_sensitive_data

# Performance
ENABLE_CACHING=true
CACHE_TTL=3600
CDN_URL=https://cdn.yourstore.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
DATADOG_API_KEY=your_datadog_key
```

### Vercel Deployment

**`vercel.json` (Production):**
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_key",
    "VITE_RAZORPAY_KEY_ID": "@razorpay_key"
  },
  "functions": {
    "api/**/*.ts": {
      "memory": 3008,
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/**",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=0, s-maxage=60"
        }
      ]
    },
    {
      "source": "/assets/**",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.yourstore.com/:path*"
    }
  ]
}
```

### GitHub Actions CI/CD Pipeline

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL_TEST }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_KEY_TEST }}
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_KEY }}
          VITE_RAZORPAY_KEY_ID: ${{ secrets.RAZORPAY_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel Staging
        run: npx vercel deploy --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_SCOPE }}
        env:
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel Production
        run: npx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_SCOPE }}
        env:
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ Production deployment completed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Production deployment successful\n<https://yourstore.com|Visit Store>"
                  }
                }
              ]
            }
```

---

## 📊 Scalability Architecture

### Horizontal Scaling Strategy

```
                    ┌─────────────────┐
                    │  CDN (Cloudflare) │
                    └────────┬──────────┘
                             │
                    ┌────────┴──────────┐
                    │  Vercel Edge      │
                    │  (Global)         │
                    └────────┬──────────┘
                             │
                ┌────────────┴─────────────┐
                │    Load Balancer         │
                └────────────┬─────────────┘
                │    
        ┌───────┼───────┬───────┐
        │       │       │       │
    ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
    │ Web │ │ Web │ │ Web │ │ Web │  ← Vercel Functions
    │API-1│ │API-2│ │API-3│ │API-n│     (Auto-scaling)
    └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
       │       │       │       │
       └───────┼───────┼───────┘
               │
        ┌──────▼──────┐
        │ Supabase DB │  ← Read Replicas for scaling
        │ Connection  │
        │ Pool        │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │ PostgreSQL  │  ← Primary
        │ Production  │
        └─────────────┘
```

### Database Optimization for Scale

```sql
-- Connection pooling
-- Use Supabase's connection pooler: transaction mode
-- Max connections: 100+ per project

-- Query optimization
CREATE INDEX CONCURRENTLY idx_orders_user_created 
ON orders(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_products_status_featured 
ON products(status, is_featured) 
WHERE status = 'active';

-- Partitioning for large tables
CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- Caching strategy
-- Use Redis for frequently accessed data
-- Implement cache invalidation patterns
```

### Caching Layers

```
1. Browser Cache (Service Worker)
   ├─ Static assets: 1 year
   ├─ HTML: 1 hour
   └─ API responses: Custom TTL

2. CDN Cache (Cloudflare)
   ├─ Images: 1 month
   ├─ JS/CSS: 1 week
   └─ HTML: 5 minutes

3. Application Cache (Redis)
   ├─ Product catalog: 1 hour
   ├─ User sessions: 24 hours
   ├─ Recommendations: 6 hours
   └─ Analytics: Real-time

4. Database Cache
   ├─ Query results: Automatic via Supabase
   └─ Connection pooling: Transaction mode
```

### Auto-Scaling Configuration

**Supabase Auto-Scaling:**
- CPU: Scale up at 80%, scale down at 30%
- Connections: Max 100, queue remaining
- Storage: Auto-expand in 100GB increments

**Vercel Edge Functions:**
- Automatically scales based on traffic
- Regional distribution across global servers
- Cold start < 100ms

---

## 🔍 Monitoring & Analytics

### Key Metrics Dashboard

```typescript
// src/lib/monitoring.ts

import * as Sentry from '@sentry/react';
import { PostHog } from 'posthog-js';

// Initialize Sentry for error tracking
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

// Initialize PostHog for product analytics
PostHog.init(process.env.VITE_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com',
  loaded: (posthog) => {
    if (process.env.NODE_ENV === 'development') {
      posthog.opt_out_capturing();
    }
  },
});

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  PostHog.capture(eventName, properties);
  
  // Also track in custom analytics
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      properties,
      timestamp: new Date().toISOString(),
    }),
  });
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    contexts: { custom: context },
  });
};
```

### Core Web Vitals Monitoring

```typescript
// src/lib/webVitals.ts

import {
  getCLS,
  getFID,
  getFCP,
  getLCP,
  getTTFB,
} from 'web-vitals';

export function monitorWebVitals() {
  getCLS((metric) => {
    console.log('CLS:', metric.value);
    if (metric.value > 0.1) {
      trackEvent('web_vital_overflow', {
        metric: 'CLS',
        value: metric.value,
      });
    }
  });

  getFID((metric) => {
    console.log('FID:', metric.value);
    if (metric.value > 100) {
      trackEvent('web_vital_overflow', {
        metric: 'FID',
        value: metric.value,
      });
    }
  });

  getLCP((metric) => {
    console.log('LCP:', metric.value);
    if (metric.value > 2500) {
      trackEvent('web_vital_overflow', {
        metric: 'LCP',
        value: metric.value,
      });
    }
  });

  getTTFB((metric) => {
    console.log('TTFB:', metric.value);
  });
}
```

### Uptime & Performance Monitoring

**Monitoring Services:**
- **Uptime:** Pingdom or Statuspage.io (99.95% target)
- **Performance:** New Relic or Datadog APM
- **Error Tracking:** Sentry with budget alerts
- **Logs:** Supabase logs or CloudWatch

---

## 🛡️ Security Hardening

### Security Checklist

- [ ] **HTTPS Only** - SSL/TLS 1.3 on all endpoints
- [ ] **CORS Configuration** - Whitelist specific origins
- [ ] **Rate Limiting**
  - API: 100 requests/minute per IP
  - Auth: 5 attempts/minute per email
  - Payments: 10 attempts/hour
- [ ] **Input Validation** - Zod schemas for all inputs
- [ ] **SQL Injection Prevention** - Parameterized queries only
- [ ] **XSS Protection** - CSP headers, sanitization
- [ ] **CSRF Protection** - SameSite cookies, tokens
- [ ] **Authentication** - JWT with refresh token rotation
- [ ] **Authorization** - Role-based access control (RBAC)
- [ ] **Secrets Management** - Environment variables only
- [ ] **PCI DSS** - No sensitive data logging
- [ ] **Encryption** - AES-256 for sensitive data at rest
- [ ] **API Keys** - Rotate quarterly
- [ ] **Backups** - Daily encrypted backups to secondary region

### Security Headers

```typescript
// vercel.json or middleware
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'"
  }
];
```

---

## 📈 Performance Optimization Strategies

### Asset Optimization

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotli',
      ext: '.br',
    }),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          'utils': ['date-fns', 'clsx'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
```

### Image Optimization

```typescript
// src/components/common/LazyImage.tsx

import { ImgHTMLAttributes, useState } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: string;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  placeholder = '/placeholder.jpg',
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  );
}
```

### Code Splitting

```typescript
// src/pages/index.tsx

import { lazy, Suspense } from 'react';
import { Loading } from '@/components/common/Loading';

const AdminDashboard = lazy(() => import('@/pages/Admin'));
const DigitalProducts = lazy(() => import('@/pages/DigitalProducts'));

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminDashboard />
      <DigitalProducts />
    </Suspense>
  );
}
```

---

## 🔄 Backup & Disaster Recovery

### Backup Strategy

```bash
Daily Backups:
├─ Database: Automated Supabase backups (7-day retention)
├─ Storage: S3 cross-region replication
├─ Configuration: GitHub repository (version control)
└─ Secrets: Encrypted backup in separate vault

Weekly Backups:
├─ Full database dump to secondary region
└─ Manual testing of restore procedures

Monthly:
└─ Full disaster recovery drill
```

### Database Backup Strategy

```sql
-- Automated daily backups (Supabase)
-- Weekly manual exports to S3

-- Create backup
pg_dump --no-password \
  postgresql://user:password@db.host/dbname \
  | gzip > backup-$(date +%Y%m%d).sql.gz

-- Store in S3
aws s3 cp backup-$(date +%Y%m%d).sql.gz \
  s3://backup-bucket/daily/

-- Retention policy: Keep 30 days
aws s3 lifecycle put-bucket-lifecycle-configuration \
  --bucket backup-bucket \
  --lifecycle-configuration file://lifecycle.json
```

---

## 📊 Business Intelligence & Reporting

### Analytics Dashboard Metrics

1. **Revenue Metrics**
   - Total Revenue (Daily/Weekly/Monthly)
   - Average Order Value (AOV)
   - Revenue per User
   - Lifetime Value (LTV)

2. **Conversion Metrics**
   - Conversion Rate (%)
   - Cart Abandonment Rate
   - Checkout Completion Rate
   - Return Customer Rate

3. **Product Metrics**
   - Best Sellers
   - Trending Products
   - Product Category Performance
   - Digital vs Physical Split

4. **Customer Metrics**
   - New vs Returning Customers
   - Customer Acquisition Cost (CAC)
   - Customer Retention Rate
   - Customer Satisfaction (NPS)

5. **Traffic Metrics**
   - Unique Visitors
   - Page Views
   - Bounce Rate
   - Average Session Duration

---

## 🎯 Growth & Optimization Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Core ecommerce features
- [x] Payment integration
- [x] Admin dashboard
- [ ] Analytics setup

### Phase 2: Scale (Weeks 3-6)
- [ ] AI recommendations
- [ ] Advanced inventory
- [ ] Multi-vendor support
- [ ] WhatsApp integration

### Phase 3: Optimize (Weeks 7-8)
- [ ] Performance tuning
- [ ] SEO enhancement
- [ ] Mobile app (React Native)
- [ ] Advanced analytics

### Phase 4: Expand (Weeks 9-12)
- [ ] B2B marketplace
- [ ] Subscription products
- [ ] Live shopping features
- [ ] International expansion

---

## 📝 Production Checklist

Before launching to production:

- [ ] Security audit completed
- [ ] Performance tests passed (LCP < 2.5s)
- [ ] Load testing completed (1000+ concurrent)
- [ ] Backup & recovery tested
- [ ] SSL certificate installed
- [ ] DNS configured
- [ ] CDN configured
- [ ] Error tracking configured
- [ ] Analytics configured
- [ ] Email templates tested
- [ ] Payment gateway tested
- [ ] Documentation complete
- [ ] Team training completed
- [ ] Support procedures documented
- [ ] Monitoring alerts configured
- [ ] Incident response plan created

---

This deployment guide ensures enterprise-grade reliability, scalability, and performance for the premium ecommerce platform.
