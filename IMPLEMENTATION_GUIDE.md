# Implementation Guide: Premium Hybrid Ecommerce System

## Quick Start Setup

### 1. Environment Configuration

Create `.env.local`:
```bash
# API
VITE_API_URL=http://localhost:3000
VITE_API_KEY=your_api_key

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Payment - Razorpay
VITE_RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Payment - Stripe (optional)
VITE_STRIPE_PUBLIC_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret

# Email Service - SendGrid
SENDGRID_API_KEY=your_sendgrid_key

# WhatsApp Business API
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_key

# Analytics
VITE_GA4_MEASUREMENT_ID=G-XXXXX
VITE_META_PIXEL_ID=your_pixel_id

# Storage
AWS_S3_BUCKET=your_bucket
AWS_S3_REGION=your_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# App Settings
VITE_APP_NAME=Your Store Name
VITE_APP_CURRENCY=INR
VITE_APP_REGION=IN
VITE_ENABLE_PHYSICAL_PRODUCTS=true
VITE_ENABLE_DIGITAL_PRODUCTS=true
VITE_ENABLE_WHATSAPP=true
VITE_ENABLE_AI=true
VITE_ENABLE_ANALYTICS=true
```

### 2. Database Initialization

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set up Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" = 'your-jwt-secret-here';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    phone VARCHAR UNIQUE,
    password_hash VARCHAR,
    full_name VARCHAR,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    is_vendor BOOLEAN DEFAULT false,
    status VARCHAR DEFAULT 'active',
    whatsapp_number VARCHAR,
    preferred_language VARCHAR DEFAULT 'en',
    timezone VARCHAR,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR UNIQUE,
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(200),
    product_type VARCHAR NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_digital BOOLEAN DEFAULT false,
    file_url TEXT,
    file_size_mb DECIMAL(8,2),
    license_type VARCHAR,
    delivery_method VARCHAR,
    download_expiry_days INTEGER DEFAULT 30,
    max_downloads INTEGER,
    weight_kg DECIMAL(8,2),
    dimensions_length DECIMAL(8,2),
    dimensions_width DECIMAL(8,2),
    dimensions_height DECIMAL(8,2),
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    og_image_url TEXT,
    status VARCHAR DEFAULT 'draft',
    visibility VARCHAR DEFAULT 'public',
    is_featured BOOLEAN DEFAULT false,
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    wishlist_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    published_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(slug);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_type ON products(product_type);

-- Cart table (simplified)
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_items INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    expires_at TIMESTAMP DEFAULT (now() + interval '30 days'),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id VARCHAR,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    line_total DECIMAL(10,2),
    added_at TIMESTAMP DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR UNIQUE NOT NULL,
    status VARCHAR DEFAULT 'pending',
    subtotal DECIMAL(10,2),
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR,
    payment_status VARCHAR DEFAULT 'pending',
    payment_gateway VARCHAR,
    payment_id VARCHAR,
    payment_date TIMESTAMP,
    customer_email VARCHAR,
    customer_phone VARCHAR,
    customer_notes TEXT,
    has_digital_products BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    completed_at TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,
    is_digital BOOLEAN DEFAULT false
);

-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR,
    review_text TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT now()
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Digital downloads
CREATE TABLE IF NOT EXISTS digital_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    download_key VARCHAR UNIQUE,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER,
    expires_at TIMESTAMP,
    license_key VARCHAR,
    delivered_at TIMESTAMP DEFAULT now(),
    accessed_at TIMESTAMP
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR,
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_per_customer INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR,
    event_type VARCHAR,
    event_name VARCHAR,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    event_data JSONB,
    utm_source VARCHAR,
    utm_medium VARCHAR,
    utm_campaign VARCHAR,
    device_type VARCHAR,
    browser VARCHAR,
    os VARCHAR,
    ip_address VARCHAR,
    created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for analytics
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_product ON analytics_events(product_id);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    subject VARCHAR NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR DEFAULT 'open',
    priority VARCHAR DEFAULT 'normal',
    category VARCHAR,
    created_at TIMESTAMP DEFAULT now()
);

-- Admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR UNIQUE NOT NULL,
    setting_value JSONB,
    updated_at TIMESTAMP DEFAULT now()
);

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_name VARCHAR UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 100
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR NOT NULL,
    resource_type VARCHAR,
    resource_id VARCHAR,
    changes JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- Create vector extension for AI-powered search (optional)
CREATE EXTENSION IF NOT EXISTS vector;

-- Product embeddings for semantic search
CREATE TABLE IF NOT EXISTS product_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX ON product_embeddings USING ivfflat (embedding vector_cosine_ops);
```

Run migrations:
```bash
supabase migration up
```

---

## 3. Component Implementation Examples

### Premium Product Card Component

**`src/components/product/ProductCard.tsx`:**

```typescript
import React from 'react';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RatingStar } from '@/components/common/RatingStar';
import { LazyImage } from '@/components/common/LazyImage';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'default',
  onQuickView,
}) => {
  const [isHovering, setIsHovering] = React.useState(false);
  const { addItem } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const [isAdding, setIsAdding] = React.useState(false);

  const isSaleActive = product.comparePrice && product.comparePrice > product.basePrice;
  const discountPercent = isSaleActive
    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)
    : 0;

  const isOutOfStock = product.stock?.availableQuantity === 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addItem(product.id, 1);
      // Show success toast
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToWishlist = () => {
    addToWishlist(product.id);
  };

  return (
    <div
      className={cn(
        'group relative bg-white rounded-lg overflow-hidden transition-all duration-300',
        variant === 'featured' ? 'shadow-lg' : 'shadow',
        isHovering && 'shadow-xl'
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Image Container */}
      <Link
        to={`/product/${product.slug}`}
        className="relative block bg-gray-100 aspect-square overflow-hidden"
      >
        <LazyImage
          src={product.images?.[0]?.url || '/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isSaleActive && (
            <Badge className="bg-red-500 text-white">
              -{discountPercent}%
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-amber-500 text-white">Featured</Badge>
          )}
          {product.isDigital && (
            <Badge className="bg-blue-500 text-white">Digital</Badge>
          )}
        </div>

        {/* Overlay Actions */}
        {isHovering && !isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                onQuickView?.(product);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              disabled={isAdding}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </Link>

      {/* Info Section */}
      <div className="p-4 space-y-3">
        {/* Category */}
        {product.category && (
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {product.category.name}
          </p>
        )}

        {/* Name */}
        <Link
          to={`/product/${product.slug}`}
          className="block font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 transition-colors"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <RatingStar rating={product.averageRating} size="sm" />
          <span className="text-xs text-gray-500">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            ₹{product.basePrice.toLocaleString('en-IN')}
          </span>
          {isSaleActive && (
            <span className="text-sm text-gray-500 line-through">
              ₹{product.comparePrice?.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Stock Indicator */}
        {!isOutOfStock && product.stock?.availableQuantity! < 5 && (
          <p className="text-xs text-orange-600 font-medium">
            Only {product.stock?.availableQuantity} left!
          </p>
        )}

        {/* Add to Wishlist */}
        <button
          onClick={handleAddToWishlist}
          className={cn(
            'absolute top-3 right-3 p-2 rounded-full transition-all',
            isInWishlist(product.id)
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
          )}
        >
          <Heart
            className="w-5 h-5"
            fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
          />
        </button>
      </div>
    </div>
  );
};
```

### Checkout Payment Component

**`src/components/checkout/PaymentMethods.tsx`:**

```typescript
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CreditCard, Smartphone, Banknote, DollarSign } from 'lucide-react';
import type { PaymentMethod } from '@/types/payment';

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}> = [
  {
    id: 'razorpay',
    name: 'Credit/Debit Card or UPI',
    description: 'Fast and secure payment via Razorpay',
    icon: <CreditCard className="w-5 h-5" />,
    enabled: true,
  },
  {
    id: 'upi',
    name: 'UPI',
    description: 'Direct UPI transfer',
    icon: <Smartphone className="w-5 h-5" />,
    enabled: true,
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when your order arrives',
    icon: <Banknote className="w-5 h-5" />,
    enabled: true,
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Pay with crypto (Bitcoin, Ethereum, USDT)',
    icon: <DollarSign className="w-5 h-5" />,
    enabled: false,
  },
];

interface PaymentMethodsProps {
  selectedMethod: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  orderTotal: number;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  selectedMethod,
  onSelect,
  orderTotal,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Method</h3>

      <RadioGroup value={selectedMethod || ''} onValueChange={onSelect as any}>
        <div className="space-y-3">
          {PAYMENT_METHODS.map((method) => (
            <div key={method.id}>
              <Label
                htmlFor={method.id}
                className="relative cursor-pointer"
              >
                <div className="flex gap-3 p-4 border-2 rounded-lg transition-all hover:border-blue-300"
                  onClick={() => method.enabled && onSelect(method.id)}
                >
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    disabled={!method.enabled}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {method.icon}
                      <span className="font-medium">{method.name}</span>
                      {!method.enabled && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {method.description}
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      {/* Security Info */}
      <Card className="bg-blue-50 border-blue-200 p-4 text-sm">
        <div className="flex gap-3">
          <div className="text-lg">🔒</div>
          <div>
            <p className="font-medium text-blue-900">Secure Payment</p>
            <p className="text-blue-700 text-xs mt-1">
              All payments are encrypted and secured with industry-leading protocols.
              Your data is never stored on our servers.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
```

### Digital Product Download Component

**`src/components/digital/DigitalProductCard.tsx`:**

```typescript
import React from 'react';
import { Download, Clock, CheckCircle, File, Code2, Music, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { DigitalProduct } from '@/types/digital';

interface DigitalProductCardProps {
  product: DigitalProduct;
  download: any; // Digital delivery record
  onDownload: (downloadKey: string) => void;
  isLoading?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('code') || fileType.includes('json')) return <Code2 className="w-5 h-5" />;
  if (fileType.includes('audio') || fileType.includes('mp3')) return <Music className="w-5 h-5" />;
  if (fileType.includes('video')) return <Video className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
};

export const DigitalProductCard: React.FC<DigitalProductCardProps> = ({
  product,
  download,
  onDownload,
  isLoading,
}) => {
  const isExpired = download.expiresAt && new Date(download.expiresAt) < new Date();
  const downloadsRemaining = download.maxDownloads
    ? download.maxDownloads - download.downloadCount
    : null;

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            {getFileIcon(product.fileType)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">File Size</p>
          <p className="text-sm font-medium mt-1">{product.fileSizeMb} MB</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">License</p>
          <p className="text-sm font-medium mt-1 capitalize">{product.licenseType}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">Downloads Left</p>
          <p className="text-sm font-medium mt-1">
            {isExpired ? (
              <span className="text-red-600">Expired</span>
            ) : downloadsRemaining !== null ? (
              `${downloadsRemaining}`
            ) : (
              'Unlimited'
            )}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">Expires</p>
          <p className="text-sm font-medium mt-1">
            {download.expiresAt
              ? formatDistanceToNow(new Date(download.expiresAt), { addSuffix: true })
              : 'Never'}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1">
          <CheckCircle className="w-3 h-3" />
          Purchased
        </Badge>
        {product.licenseType === 'lifetime' && (
          <Badge className="bg-green-100 text-green-700 gap-1">
            <CheckCircle className="w-3 h-3" />
            Lifetime Access
          </Badge>
        )}
        {isExpired && (
          <Badge variant="destructive" className="gap-1">
            <Clock className="w-3 h-3" />
            Expired
          </Badge>
        )}
      </div>

      {/* License Info */}
      {product.licenseKey && (
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs text-gray-600 mb-1">License Key:</p>
          <code className="text-sm font-mono select-all">{product.licenseKey}</code>
        </div>
      )}

      {/* Download Button */}
      <Button
        className="w-full"
        onClick={() => onDownload(download.downloadKey)}
        disabled={isLoading || isExpired || (downloadsRemaining !== null && downloadsRemaining <= 0)}
      >
        <Download className="w-4 h-4 mr-2" />
        {isLoading ? 'Downloading...' : 'Download'}
      </Button>

      {/* Warning Messages */}
      {isExpired && (
        <p className="text-sm text-red-600 text-center">
          Download link has expired. Please contact support.
        </p>
      )}
      {downloadsRemaining !== null && downloadsRemaining < 3 && !isExpired && (
        <p className="text-sm text-amber-600 text-center">
          Only {downloadsRemaining} downloads remaining
        </p>
      )}
    </div>
  );
};
```

---

## 4. API Integration Examples

### Razorpay Payment Integration

**`src/lib/razorpay.ts`:**

```typescript
import { supabase } from './supabase';

interface RazorpayInitOptions {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
}

export async function initializeRazorpayPayment(
  options: RazorpayInitOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay SDK not loaded'));
      return;
    }

    const razorpayOptions = {
      key: options.keyId,
      amount: options.amount * 100, // Convert to paise
      currency: options.currency,
      order_id: options.orderId,
      customer_notification: 1,
      description: options.description,
      prefill: options.prefill,
      handler: async (response: any) => {
        try {
          // Verify payment
          const { data, error } = await supabase
            .from('payments')
            .insert({
              order_id: options.orderId,
              amount: options.amount,
              payment_gateway: 'razorpay',
              payment_id: response.razorpay_payment_id,
              status: 'processing',
              transaction_id: response.razorpay_payment_id,
            });

          if (error) throw error;

          // Call verification endpoint
          const verifyResponse = await fetch('/api/payments/verify-razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: options.orderId,
              paymentId: response.razorpay_payment_id,
              signatureId: response.razorpay_signature,
            }),
          });

          if (!verifyResponse.ok) throw new Error('Payment verification failed');

          resolve();
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled'));
        },
      },
    };

    const razorpay = new window.Razorpay(razorpayOptions);
    razorpay.open();
  });
}

// Verify payment signature
export async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signatureId: string,
  keySecret: string
): Promise<boolean> {
  const crypto = await import('crypto');
  
  const text = orderId + '|' + paymentId;
  const generated_signature = crypto
    .createHmac('sha256', keySecret)
    .update(text)
    .digest('hex');

  return generated_signature === signatureId;
}
```

### WhatsApp Integration

**`src/lib/whatsapp.ts`:**

```typescript
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  mediaUrl?: string
): Promise<any> {
  const response = await fetch(
    `https://graph.instagram.com/v17.0/${process.env.VITE_WHATSAPP_BUSINESS_ACCOUNT_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: mediaUrl ? 'image' : 'text',
        [mediaUrl ? 'image' : 'text']: mediaUrl
          ? { link: mediaUrl }
          : { body: message },
      }),
    }
  );

  return response.json();
}

export function generateWhatsAppOrderLink(
  phoneNumber: string,
  productName: string,
  price: number,
  productImage?: string
): string {
  const message = `Hi, I'm interested in:\n\n${productName}\nPrice: ₹${price}\n\nPlease provide more details.`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

export function generateWhatsAppCatalogLink(
  phoneNumber: string,
  catalogId: string
): string {
  return `https://wa.me/${phoneNumber}/?catalog_id=${catalogId}`;
}
```

### Email Service Integration

**`src/lib/email.ts`:**

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.VITE_SENDGRID_API_KEY);

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// Order confirmation email
export async function sendOrderConfirmationEmail(
  toEmail: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    deliveryDate: string;
    trackingUrl: string;
  }
): Promise<any> {
  const template: EmailTemplate = {
    subject: `Order Confirmed: ${orderData.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Order Confirmed</h1>
        <p>Hi ${orderData.customerName},</p>
        <p>Thank you for your purchase! Your order has been confirmed.</p>
        
        <h2>Order Details</h2>
        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
        <p><strong>Total Amount:</strong> ₹${orderData.totalAmount.toLocaleString('en-IN')}</p>
        <p><strong>Expected Delivery:</strong> ${orderData.deliveryDate}</p>
        
        <h3>Items</h3>
        <ul>
          ${orderData.items
            .map(
              (item) =>
                `<li>${item.name} x ${item.quantity} - ₹${item.price}</li>`
            )
            .join('')}
        </ul>
        
        <p><a href="${orderData.trackingUrl}">Track Your Order</a></p>
      </div>
    `,
  };

  return resend.emails.send({
    from: 'orders@yourstore.com',
    to: toEmail,
    ...template,
  });
}

// Digital product delivery email
export async function sendDigitalProductEmail(
  toEmail: string,
  productData: {
    productName: string;
    downloadLink: string;
    licenseKey?: string;
    expiresAt?: Date;
  }
): Promise<any> {
  return resend.emails.send({
    from: 'downloads@yourstore.com',
    to: toEmail,
    subject: `Your Digital Product: ${productData.productName}`,
    html: `
      <h1>Your Digital Product is Ready!</h1>
      <p>We're excited to share your purchase with you.</p>
      <h2>${productData.productName}</h2>
      <p><a href="${productData.downloadLink}">Download Now</a></p>
      ${
        productData.licenseKey
          ? `<p><strong>License Key:</strong> ${productData.licenseKey}</p>`
          : ''
      }
      ${
        productData.expiresAt
          ? `<p>This link expires on ${productData.expiresAt.toLocaleDateString()}</p>`
          : ''
      }
    `,
  });
}

// Abandoned cart recovery email
export async function sendAbandonedCartEmail(
  toEmail: string,
  cartData: {
    customerName: string;
    items: Array<{ name: string; price: number; quantity: number }>;
    cartTotal: number;
    recoveryLink: string;
    discountCode?: string;
    discountPercent?: number;
  }
): Promise<any> {
  return resend.emails.send({
    from: 'sales@yourstore.com',
    to: toEmail,
    subject: 'You left something behind! 👜',
    html: `
      <h1>Don't Miss Out!</h1>
      <p>Hi ${cartData.customerName},</p>
      <p>We noticed you left some items in your cart.</p>
      
      <h2>Your Cart Summary</h2>
      ${cartData.items.map((item) => `<p>${item.name} x ${item.quantity}</p>`).join('')}
      <p><strong>Total: ₹${cartData.cartTotal}</strong></p>
      
      ${
        cartData.discountCode
          ? `<p>Use code <strong>${cartData.discountCode}</strong> for ${cartData.discountPercent}% off!</p>`
          : ''
      }
      <p><a href="${cartData.recoveryLink}">Complete Your Purchase</a></p>
    `,
  });
}
```

---

## 5. Advanced Features Implementation

### AI-Powered Recommendations

**`src/services/aiService.ts`:**

```typescript
import { supabase } from '@/lib/supabase';

export async function getAIProductRecommendations(
  userId: string,
  limit: number = 5
): Promise<any[]> {
  // Get user's purchase history and browsing behavior
  const { data: userActivity } = await supabase
    .from('analytics_events')
    .select('product_id, event_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!userActivity || userActivity.length === 0) {
    // Return trending products for new users
    return getTrendingProducts(limit);
  }

  // Call AI service for recommendations
  const response = await fetch('/api/ai/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      activityHistory: userActivity,
      limit,
    }),
  });

  return response.json();
}

export async function generateProductDescription(
  productName: string,
  category: string,
  features: string[]
): Promise<string> {
  const response = await fetch('/api/ai/generate-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productName,
      category,
      features,
    }),
  });

  const { description } = await response.json();
  return description;
}

async function getTrendingProducts(limit: number) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .eq('status', 'active')
    .order('total_sales', { ascending: false })
    .limit(limit);

  return data || [];
}
```

---

This implementation guide provides everything needed to build the premium hybrid ecommerce platform with production-ready code patterns and integrations.
