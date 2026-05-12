# Premium Hybrid Ecommerce Platform Architecture

## 🎯 Executive Overview

A scalable, reusable hybrid ecommerce platform supporting both **physical and digital products**, designed for maximum conversions, performance, and automation.

**Target Businesses:** Fashion brands, jewelry stores, digital product sellers, SaaS creators, template sellers, resellers, local businesses, ecommerce agencies.

---

## 🏗️ SYSTEM ARCHITECTURE

### Core Pillars

```
┌─────────────────────────────────────────────────────┐
│         PREMIUM ECOMMERCE PLATFORM                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  FRONTEND LAYER (Next.js/React/TypeScript)  │    │
│  │  - Mobile-first UI                          │    │
│  │  - Conversion-optimized components          │    │
│  │  - PWA capabilities                         │    │
│  │  - SSR/SSG for SEO                          │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  API LAYER (Server Functions/Edge)          │    │
│  │  - RESTful endpoints                        │    │
│  │  - Real-time subscriptions                  │    │
│  │  - Webhook handlers                         │    │
│  │  - Rate limiting & security                 │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  DATABASE LAYER (Supabase/Firebase)         │    │
│  │  - PostgreSQL schema                        │    │
│  │  - Real-time listeners                      │    │
│  │  - Row-level security                       │    │
│  │  - Automated backups                        │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  STORAGE LAYER (S3/Supabase Storage)        │    │
│  │  - Product images                           │    │
│  │  - Digital downloads                        │    │
│  │  - User avatars                             │    │
│  │  - CDN distribution                         │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  INTEGRATIONS LAYER                         │    │
│  │  - Payment gateways (Razorpay/Stripe)       │    │
│  │  - WhatsApp Business API                    │    │
│  │  - Email service (SendGrid/Resend)          │    │
│  │  - Analytics (GA4, Meta Pixel, Mixpanel)    │    │
│  │  - AI services (OpenAI, Anthropic)          │    │
│  └────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA

### Core Tables (PostgreSQL)

#### 1. **Users & Authentication**
```sql
-- User profiles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR UNIQUE,
  password_hash VARCHAR,
  full_name VARCHAR,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_vendor BOOLEAN DEFAULT false,
  status VARCHAR DEFAULT 'active', -- active, suspended, deleted
  whatsapp_number VARCHAR,
  preferred_language VARCHAR DEFAULT 'en',
  timezone VARCHAR,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- User authentication methods (OAuth, email, phone)
CREATE TABLE auth_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  method_type VARCHAR, -- email, phone, google, apple, whatsapp
  provider_id VARCHAR,
  is_primary BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- User addresses
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR, -- billing, shipping, both
  full_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  email VARCHAR,
  address_line_1 VARCHAR NOT NULL,
  address_line_2 VARCHAR,
  city VARCHAR NOT NULL,
  state VARCHAR NOT NULL,
  postal_code VARCHAR NOT NULL,
  country VARCHAR DEFAULT 'IN',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Vendor profiles
CREATE TABLE vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  business_name VARCHAR NOT NULL,
  business_description TEXT,
  business_logo_url TEXT,
  business_banner_url TEXT,
  website_url VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  support_email VARCHAR,
  whatsapp_number VARCHAR,
  upi_id VARCHAR,
  bank_name VARCHAR,
  bank_account_number VARCHAR,
  bank_ifsc_code VARCHAR,
  tax_id VARCHAR,
  return_policy TEXT,
  shipping_policy TEXT,
  response_time_hours INTEGER,
  commission_rate DECIMAL(5,2),
  balance DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 2. **Products (Physical & Digital)**
```sql
-- Product master
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  sku VARCHAR UNIQUE,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(200),
  product_type VARCHAR NOT NULL, -- physical, digital, bundle
  category_id UUID REFERENCES categories(id),
  sub_category_id UUID REFERENCES categories(id),
  base_price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Digital product specific
  is_digital BOOLEAN DEFAULT false,
  file_url TEXT,
  file_size_mb DECIMAL(8,2),
  license_type VARCHAR, -- single-use, lifetime, subscription
  delivery_method VARCHAR, -- instant, email, manual
  download_expiry_days INTEGER DEFAULT 30,
  max_downloads INTEGER,
  
  -- Physical product specific
  weight_kg DECIMAL(8,2),
  dimensions_length DECIMAL(8,2),
  dimensions_width DECIMAL(8,2),
  dimensions_height DECIMAL(8,2),
  
  -- SEO & Display
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  meta_keywords VARCHAR,
  og_image_url TEXT,
  
  -- Business logic
  status VARCHAR DEFAULT 'draft', -- draft, active, archived
  visibility VARCHAR DEFAULT 'public', -- public, private, hidden
  is_featured BOOLEAN DEFAULT false,
  search_keywords TEXT,
  
  -- Analytics
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

-- Product images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR,
  display_order INTEGER,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Product variants
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR,
  sku_suffix VARCHAR,
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  attribute_values JSONB, -- {size: 'M', color: 'red'}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Stock management
CREATE TABLE product_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  warehouse_id UUID, -- for multi-warehouse support
  available_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  damaged_quantity INTEGER DEFAULT 0,
  last_counted_at TIMESTAMP,
  reorder_level INTEGER DEFAULT 10,
  updated_at TIMESTAMP DEFAULT now()
);

-- Product attributes
CREATE TABLE product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  attribute_name VARCHAR, -- size, color, material
  attribute_value VARCHAR,
  display_order INTEGER
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Collections/Bundles
CREATE TABLE product_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendor_profiles(id),
  name VARCHAR NOT NULL,
  description TEXT,
  banner_image_url TEXT,
  discount_type VARCHAR, -- percentage, fixed, bundle
  discount_value DECIMAL(10,2),
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE collection_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES product_collections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER
);
```

#### 3. **Inventory & Stock**
```sql
-- Stock movements (audit trail)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  movement_type VARCHAR, -- inbound, outbound, adjustment, return
  quantity INTEGER,
  reference_type VARCHAR, -- order, purchase, return, damage
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Low stock alerts
CREATE TABLE stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  alert_type VARCHAR, -- low_stock, out_of_stock, overstock
  threshold INTEGER,
  is_active BOOLEAN DEFAULT true,
  notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

#### 4. **Pricing & Discounts**
```sql
-- Pricing rules
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendor_profiles(id),
  name VARCHAR NOT NULL,
  rule_type VARCHAR, -- bulk, tiered, seasonal, volume
  rules JSONB, -- {min_quantity: 10, discount_percent: 10}
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendor_profiles(id),
  code VARCHAR UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR, -- percentage, fixed, free_shipping
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_per_customer INTEGER DEFAULT 1,
  applicable_products JSONB, -- array of product IDs or 'all'
  applicable_categories JSONB,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Coupon usage tracking
CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP DEFAULT now()
);
```

#### 5. **Orders & Transactions**
```sql
-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendor_profiles(id),
  order_number VARCHAR UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled, refunded
  
  -- Pricing
  subtotal DECIMAL(10,2),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  coupon_code VARCHAR,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Payment
  payment_method VARCHAR, -- card, upi, netbanking, cod, crypto
  payment_status VARCHAR DEFAULT 'pending', -- pending, processing, confirmed, failed, refunded
  payment_gateway VARCHAR, -- razorpay, stripe, paytm
  payment_id VARCHAR,
  payment_date TIMESTAMP,
  
  -- Shipping
  shipping_address_id UUID REFERENCES user_addresses(id),
  billing_address_id UUID REFERENCES user_addresses(id),
  shipping_method VARCHAR,
  tracking_number VARCHAR,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  
  -- Customer info
  customer_email VARCHAR,
  customer_phone VARCHAR,
  customer_notes TEXT,
  
  -- Order type
  order_type VARCHAR DEFAULT 'regular', -- regular, subscription, pre_order, backorder
  
  -- Digital products flag
  has_digital_products BOOLEAN DEFAULT false,
  digital_delivery_method VARCHAR, -- instant, email, dashboard
  
  -- Analytics
  traffic_source VARCHAR, -- organic, direct, social, email, whatsapp
  utm_source VARCHAR,
  utm_medium VARCHAR,
  utm_campaign VARCHAR,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR NOT NULL,
  product_sku VARCHAR,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  is_digital BOOLEAN DEFAULT false,
  can_be_fulfilled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Digital product delivery
CREATE TABLE digital_deliveries (
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

-- Order timeline/status tracking
CREATE TABLE order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR,
  new_status VARCHAR,
  updated_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'INR',
  payment_gateway VARCHAR, -- razorpay, stripe, paypal
  payment_id VARCHAR,
  status VARCHAR DEFAULT 'processing', -- processing, success, failed, refunded
  payment_method VARCHAR, -- card, upi, netbanking, wallet
  transaction_id VARCHAR UNIQUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Refunds
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR DEFAULT 'pending', -- pending, processing, completed, failed
  refund_id VARCHAR, -- payment gateway refund ID
  refund_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 6. **Customer Engagement**
```sql
-- Reviews & Ratings
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR,
  review_text TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'pending', -- pending, approved, rejected
  is_featured BOOLEAN DEFAULT false,
  images_urls TEXT[], -- array of image URLs
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Wishlist
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Product comparisons
CREATE TABLE product_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  products JSONB, -- array of product IDs
  created_at TIMESTAMP DEFAULT now()
);

-- Email preferences
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  promotional_emails BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  product_recommendations BOOLEAN DEFAULT true,
  newsletter BOOLEAN DEFAULT true,
  abandoned_cart_emails BOOLEAN DEFAULT true,
  review_requests BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT now()
);

-- Contact form submissions
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR,
  subject VARCHAR NOT NULL,
  message TEXT NOT NULL,
  inquiry_type VARCHAR, -- general, support, partnership, feedback
  status VARCHAR DEFAULT 'new', -- new, in-progress, resolved
  assigned_to UUID REFERENCES users(id),
  response TEXT,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

#### 7. **Analytics & Marketing**
```sql
-- Analytics events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR,
  event_type VARCHAR, -- view, click, add_to_cart, purchase, wishlist
  event_name VARCHAR,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  event_data JSONB,
  utm_source VARCHAR,
  utm_medium VARCHAR,
  utm_campaign VARCHAR,
  device_type VARCHAR, -- mobile, tablet, desktop
  browser VARCHAR,
  os VARCHAR,
  ip_address VARCHAR,
  referer VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

-- Email campaigns
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendor_profiles(id),
  name VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  content TEXT,
  template_id VARCHAR,
  recipient_count INTEGER,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'draft', -- draft, scheduled, sent
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Abandoned carts
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR,
  cart_items JSONB,
  cart_total DECIMAL(10,2),
  recovery_email_sent BOOLEAN DEFAULT false,
  recovery_email_sent_at TIMESTAMP,
  recovered BOOLEAN DEFAULT false,
  recovered_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + interval '7 days')
);
```

#### 8. **Admin & Settings**
```sql
-- Admin settings
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR UNIQUE NOT NULL,
  setting_value JSONB,
  data_type VARCHAR,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Feature flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name VARCHAR UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  rollout_percentage INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT now()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR NOT NULL,
  resource_type VARCHAR,
  resource_id VARCHAR,
  changes JSONB,
  ip_address VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

-- Support tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  subject VARCHAR NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR DEFAULT 'open', -- open, in_progress, resolved, closed
  priority VARCHAR DEFAULT 'normal', -- low, normal, high, urgent
  category VARCHAR, -- returns, shipping, payment, product_quality, other
  assigned_to UUID REFERENCES users(id),
  images_urls TEXT[],
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Ticket messages
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  message TEXT,
  attachments_urls TEXT[],
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## 📁 Folder Structure (Enhanced)

```
src/
├── components/
│   ├── ui/                          # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── modal.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── pagination.tsx
│   │   ├── skeleton.tsx
│   │   └── ...more
│   │
│   ├── layout/                      # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Navigation.tsx
│   │   ├── MobileBottomNav.tsx
│   │   ├── BreadcrumbNav.tsx
│   │   └── PageHeader.tsx
│   │
│   ├── product/                     # Product components
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductList.tsx
│   │   ├── ProductImage.tsx
│   │   ├── ProductImageGallery.tsx
│   │   ├── ProductVariantSelector.tsx
│   │   ├── ProductQuickView.tsx
│   │   ├── ProductSpecifications.tsx
│   │   ├── StockBadge.tsx
│   │   ├── DigitalProductCard.tsx
│   │   ├── BundleProductCard.tsx
│   │   ├── ProductCarousel.tsx
│   │   └── ProductRecommendations.tsx
│   │
│   ├── cart/                        # Cart components
│   │   ├── CartIcon.tsx
│   │   ├── CartSidebar.tsx
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   ├── PromoCodeInput.tsx
│   │   ├── CartEmpty.tsx
│   │   └── SaveForLater.tsx
│   │
│   ├── checkout/                    # Checkout components
│   │   ├── CheckoutHeader.tsx
│   │   ├── OrderSummary.tsx
│   │   ├── ShippingOptions.tsx
│   │   ├── AddressForm.tsx
│   │   ├── PaymentMethods.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── RazorpayPayment.tsx
│   │   ├── StripePayment.tsx
│   │   ├── OrderConfirmation.tsx
│   │   ├── CheckoutProgress.tsx
│   │   ├── SecurityBadges.tsx
│   │   └── TrustIndicators.tsx
│   │
│   ├── search/                      # Search & Filter
│   │   ├── SearchBar.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── PriceRangeFilter.tsx
│   │   ├── SearchResults.tsx
│   │   ├── SearchFilters.tsx
│   │   ├── SortOptions.tsx
│   │   └── SearchNoResults.tsx
│   │
│   ├── auth/                        # Authentication
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── SocialAuth.tsx
│   │   ├── PhoneAuth.tsx
│   │   ├── OTPVerification.tsx
│   │   ├── EmailVerification.tsx
│   │   ├── PasswordReset.tsx
│   │   ├── TwoFactorAuth.tsx
│   │   └── AuthGuard.tsx
│   │
│   ├── profile/                     # User Profile
│   │   ├── UserProfile.tsx
│   │   ├── ProfileForm.tsx
│   │   ├── AddressBook.tsx
│   │   ├── PaymentMethods.tsx
│   │   ├── OrderHistory.tsx
│   │   ├── Wishlist.tsx
│   │   ├── DownloadHistory.tsx
│   │   ├── NotificationPreferences.tsx
│   │   └── AccountSettings.tsx
│   │
│   ├── admin/                       # Admin Dashboard
│   │   ├── AdminLayout.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ProductManager.tsx
│   │   ├── OrderManager.tsx
│   │   ├── CustomerManager.tsx
│   │   ├── InventoryManager.tsx
│   │   ├── Analytics.tsx
│   │   ├── ReportsGenerator.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── CouponManager.tsx
│   │   ├── EmailCampaigns.tsx
│   │   ├── TicketManager.tsx
│   │   ├── AuditLogs.tsx
│   │   └── UserManagement.tsx
│   │
│   ├── common/                      # Common components
│   │   ├── Loading.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── NoData.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── Spinner.tsx
│   │   ├── Badge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LazyImage.tsx
│   │   ├── RatingStar.tsx
│   │   ├── VideoPlayer.tsx
│   │   └── ShareButton.tsx
│   │
│   ├── whatsapp/                    # WhatsApp Integration
│   │   ├── WhatsAppCTA.tsx
│   │   ├── WhatsAppChat.tsx
│   │   ├── WhatsAppOrderButton.tsx
│   │   ├── WhatsAppShareButton.tsx
│   │   └── WhatsAppCatalog.tsx
│   │
│   └── ai/                          # AI Features
│       ├── AIRecommendations.tsx
│       ├── AIChatbot.tsx
│       ├── AIProductSearch.tsx
│       └── AIImageUploader.tsx
│
├── pages/                           # Page components
│   ├── Index.tsx                    # Homepage
│   ├── Shop.tsx                     # Shop/Browse
│   ├── ProductDetail.tsx            # Product detail
│   ├── Cart.tsx                     # Cart page
│   ├── Checkout.tsx                 # Checkout page
│   ├── OrderConfirmation.tsx        # Order confirmation
│   ├── OrderTracking.tsx            # Track order
│   ├── Profile.tsx                  # User profile
│   ├── Auth.tsx                     # Auth pages
│   ├── Admin/
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Orders.tsx
│   │   ├── Customers.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── DigitalProducts.tsx          # Digital products browser
│   ├── MyDownloads.tsx              # User downloads page
│   ├── Wishlist.tsx                 # Wishlist page
│   ├── Contact.tsx                  # Contact page
│   ├── Blog.tsx                     # Blog page
│   ├── FAQ.tsx                      # FAQ page
│   ├── About.tsx                    # About page
│   ├── Terms.tsx                    # Terms & conditions
│   ├── Privacy.tsx                  # Privacy policy
│   ├── Returns.tsx                  # Return policy
│   ├── Shipping.tsx                 # Shipping info
│   ├── Support.tsx                  # Support tickets
│   └── NotFound.tsx                 # 404 page
│
├── contexts/                        # React contexts
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   ├── DigitalProductContext.tsx
│   ├── NotificationContext.tsx
│   ├── ThemeContext.tsx
│   ├── SearchContext.tsx
│   └── AdminContext.tsx
│
├── hooks/                           # Custom hooks
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useProduct.ts
│   ├── useOrder.ts
│   ├── usePayment.ts
│   ├── useFetch.ts
│   ├── useLocalStorage.ts
│   ├── useInfiniteScroll.ts
│   ├── useDebounce.ts
│   ├── useMediaQuery.ts
│   ├── usePagination.ts
│   ├── useFilters.ts
│   ├── useDigitalDownload.ts
│   ├── useWhatsApp.ts
│   └── useAnalytics.ts
│
├── lib/                             # Utilities & helpers
│   ├── api.ts                       # API client
│   ├── supabase.ts                  # Supabase client
│   ├── stripe.ts                    # Stripe integration
│   ├── razorpay.ts                  # Razorpay integration
│   ├── whatsapp.ts                  # WhatsApp integration
│   ├── email.ts                     # Email service
│   ├── analytics.ts                 # Analytics tracker
│   ├── storage.ts                   # Cloud storage
│   ├── auth.ts                      # Auth utilities
│   ├── validation.ts                # Form validation
│   ├── formatters.ts                # Data formatters
│   ├── constants.ts                 # Constants
│   ├── errors.ts                    # Error handling
│   ├── seo.ts                       # SEO utilities
│   ├── performance.ts               # Performance optimization
│   └── utils.ts                     # General utils
│
├── services/                        # Business logic
│   ├── productService.ts
│   ├── orderService.ts
│   ├── paymentService.ts
│   ├── authService.ts
│   ├── userService.ts
│   ├── cartService.ts
│   ├── digitalProductService.ts
│   ├── emailService.ts
│   ├── analyticsService.ts
│   ├── whatsappService.ts
│   ├── inventoryService.ts
│   ├── couponService.ts
│   ├── reviewService.ts
│   └── vendorService.ts
│
├── types/                           # TypeScript types
│   ├── index.ts
│   ├── product.ts
│   ├── order.ts
│   ├── user.ts
│   ├── payment.ts
│   ├── cart.ts
│   ├── digital.ts
│   ├── vendor.ts
│   ├── admin.ts
│   └── api.ts
│
├── styles/                          # Global styles
│   ├── globals.css
│   ├── animations.css
│   ├── variables.css
│   ├── utilities.css
│   └── responsive.css
│
├── config/                          # Configuration
│   ├── site.config.ts
│   ├── payment.config.ts
│   ├── storage.config.ts
│   ├── email.config.ts
│   ├── analytics.config.ts
│   └── routes.config.ts
│
├── middleware/                      # API middleware
│   ├── auth.ts
│   ├── validation.ts
│   ├── errorHandler.ts
│   ├── rateLimit.ts
│   ├── cors.ts
│   └── logging.ts
│
├── api/                             # API routes (if using Next.js)
│   ├── auth/
│   │   ├── login.ts
│   │   ├── signup.ts
│   │   ├── logout.ts
│   │   └── refresh.ts
│   ├── products/
│   │   ├── index.ts
│   │   ├── [id].ts
│   │   └── search.ts
│   ├── orders/
│   │   ├── index.ts
│   │   ├── [id].ts
│   │   └── track.ts
│   ├── payments/
│   │   ├── webhook.ts
│   │   ├── razorpay.ts
│   │   └── stripe.ts
│   ├── cart/
│   │   ├── index.ts
│   │   └── items.ts
│   ├── users/
│   │   ├── profile.ts
│   │   ├── addresses.ts
│   │   └── preferences.ts
│   ├── uploads/
│   │   ├── image.ts
│   │   └── digital.ts
│   ├── digital/
│   │   ├── download.ts
│   │   └── verify.ts
│   ├── admin/
│   │   ├── dashboard.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   └── analytics.ts
│   └── webhooks/
│       ├── razorpay.ts
│       ├── stripe.ts
│       └── email.ts
│
├── locales/                         # i18n translations
│   ├── en.json
│   ├── hi.json
│   ├── gu.json
│   ├── ta.json
│   ├── te.json
│   ├── kn.json
│   ├── ml.json
│   ├── mr.json
│   ├── bn.json
│   └── pa.json
│
├── public/                          # Static assets
│   ├── images/
│   │   ├── logo.png
│   │   ├── favicon.ico
│   │   ├── hero/
│   │   ├── icons/
│   │   ├── placeholders/
│   │   └── ...
│   ├── fonts/
│   ├── icons/
│   └── manifests/
│
└── env/                             # Environment files
    ├── .env.example
    ├── .env.local (local dev)
    ├── .env.staging
    └── .env.production
```

---

## 🎨 UI/UX Component Architecture

### Premium Component System

#### 1. **Hero Section Components**
```typescript
// Hero with multiple variants
- SimpleHero (CTA + image)
- CarouselHero (Slides)
- VideoHero (Background video)
- SplitHero (Text + Image split)
- FullScreenHero (Immersive)
```

#### 2. **Product Display Components**
```typescript
// Physical Products
- ProductCard (Grid view)
- ProductListItem (List view)
- ProductHover (Hover effects)
- StockIndicator (Inventory badge)

// Digital Products
- DigitalProductCard (Special styling)
- FilePreview (Quick preview)
- LicenseDisplay (License info)

// Variants
- ProductVariantPicker (Inline selector)
- VariantGrid (Visual variants)
- AttributeSelector (Color, size, etc.)
```

#### 3. **Cart & Checkout**
```typescript
- CartDropdown (Header cart)
- CartPage (Full page)
- CheckoutStepper (Progress indicator)
- PaymentGateway (Payment UI)
- AddressPicker (Saved addresses)
- ShippingCalculator (Real-time calc)
```

#### 4. **Trust & Badges**
```typescript
- SecurityBadges (SSL, secure, verified)
- TrustIndicators (Ratings, reviews count)
- DeliveryBadge (Fast shipping)
- MoneyBackGuarantee (Guarantee badge)
- PaymentMethods (Accepts X)
```

#### 5. **Mobile-First Components**
```typescript
- StickyMobileCTA (Fixed bottom CTA)
- MobileProductSheet (Bottom sheet)
- SwipeGallery (Touch swipe)
- CollapsibleFilters (Accordion)
- BottomTabNav (Mobile navigation)
```

---

## 🔌 API Structure

### Core API Endpoints

```bash
# Authentication
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/phone-verify
POST   /api/auth/otp-verify
POST   /api/auth/social-login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

# Products
GET    /api/products
GET    /api/products/:id
GET    /api/products/search
GET    /api/products/:id/reviews
POST   /api/products/:id/reviews
GET    /api/products/:id/related
GET    /api/categories
GET    /api/categories/:id/products

# Cart
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:id
DELETE /api/cart/items/:id
POST   /api/cart/apply-coupon
DELETE /api/cart/remove-coupon
POST   /api/cart/validate

# Orders
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
GET    /api/orders/:id/track
POST   /api/orders/:id/cancel
POST   /api/orders/:id/return

# Payments
POST   /api/payments/razorpay
POST   /api/payments/stripe
POST   /api/payments/verify-razorpay
POST   /api/payments/verify-stripe
GET    /api/payments/:id

# Digital Products
GET    /api/digital/downloads
POST   /api/digital/:id/download
GET    /api/digital/:id/verify
POST   /api/digital/delivery-links

# Users
GET    /api/users/profile
PATCH  /api/users/profile
GET    /api/users/addresses
POST   /api/users/addresses
PATCH  /api/users/addresses/:id
DELETE /api/users/addresses/:id
GET    /api/users/wishlist
POST   /api/users/wishlist/:id
DELETE /api/users/wishlist/:id

# Admin APIs
GET    /api/admin/dashboard
GET    /api/admin/products
POST   /api/admin/products
PATCH  /api/admin/products/:id
GET    /api/admin/orders
GET    /api/admin/analytics
GET    /api/admin/customers
POST   /api/admin/coupons
GET    /api/admin/settings

# WhatsApp
POST   /api/whatsapp/send-message
POST   /api/whatsapp/webhook
GET    /api/whatsapp/status

# Webhooks
POST   /api/webhooks/razorpay
POST   /api/webhooks/stripe
POST   /api/webhooks/email

# Analytics
POST   /api/analytics/track
GET    /api/analytics/events
```

---

## 🔄 Integration Points

### 1. **Payment Gateways**
- Razorpay (Primary for India)
- Stripe (Global)
- PayPal alternative

### 2. **Email Service**
- SendGrid or Resend
- Transactional templates
- Marketing campaigns

### 3. **WhatsApp Integration**
- WhatsApp Business API
- Order notifications
- Customer support
- Catalog sharing

### 4. **Analytics**
- Google Analytics 4
- Meta Pixel (Facebook)
- TikTok Pixel
- Custom event tracking

### 5. **Storage**
- Supabase Storage (Images)
- S3 alternative (Digital files)
- CDN distribution

### 6. **AI Services**
- OpenAI (Recommendations, chatbot)
- Product descriptions
- Image recognition

---

## ⚡ Performance Optimization Strategy

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Optimization Techniques
```typescript
1. Image Optimization
   - WebP format
   - Lazy loading
   - Srcset for responsive images
   - CDN caching

2. Code Splitting
   - Route-based splitting
   - Dynamic imports
   - Component lazy loading

3. Caching Strategy
   - Browser caching (Service Workers)
   - CDN caching
   - Database query caching
   - API response caching

4. Bundle Optimization
   - Tree shaking
   - Minification
   - Compression (Gzip, Brotli)
   - Code analysis

5. Database Optimization
   - Query indexing
   - Connection pooling
   - Query caching
```

---

## 🔒 Security Architecture

### Authentication & Authorization
```typescript
// JWT-based authentication
- Secure token generation
- Refresh token rotation
- CORS configuration
- CSRF protection

// Role-based access control
- User roles (customer, vendor, admin, super_admin)
- Permission-based routes
- Row-level security in DB
- API rate limiting
```

### Payment Security
```typescript
// PCI DSS Compliance
- No sensitive data in logs
- Encrypted storage
- Tokenized payments
- Webhook signature verification
- SSL/TLS everywhere
```

### Data Protection
```typescript
// Encryption
- At rest: Database encryption
- In transit: TLS 1.3
- Sensitive fields encrypted
```

---

## 📈 SEO & Performance Guidelines

### Technical SEO
- XML sitemap
- robots.txt
- Schema markup (JSON-LD)
- Meta tags (title, description, OG tags)
- Structured data for products
- Canonical URLs

### Content SEO
- Blog integration
- Meta descriptions
- Alt text for images
- Internal linking strategy
- Mobile-first indexing

### Performance SEO
- Page speed optimization
- Mobile responsiveness
- Core Web Vitals
- Image optimization
- CDN usage

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up project structure
- [ ] Configure Supabase schema
- [ ] Implement authentication
- [ ] Create base UI components
- [ ] Set up CI/CD pipeline

### Phase 2: Core Features (Weeks 3-4)
- [ ] Product management system
- [ ] Physical products catalog
- [ ] Shopping cart
- [ ] Payment integration (Razorpay)
- [ ] Order management

### Phase 3: Digital Products (Week 5)
- [ ] Digital product upload system
- [ ] Secure download mechanism
- [ ] License key generation
- [ ] Download tracking

### Phase 4: Enhancement (Week 6)
- [ ] WhatsApp integration
- [ ] Admin dashboard
- [ ] Analytics implementation
- [ ] Email marketing setup

### Phase 5: Optimization (Week 7)
- [ ] Performance optimization
- [ ] SEO implementation
- [ ] Security hardening
- [ ] Testing & QA

### Phase 6: Launch (Week 8)
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Documentation

---

## 📊 Monetization Strategy

### Revenue Streams
1. **Direct Sales** (Physical + Digital)
2. **Subscription Products** (SaaS, memberships)
3. **Commission** (Vendor/Reseller marketplace)
4. **Affiliate System** (Referral rewards)
5. **White-Label** (SaaS licensing)
6. **AI Features** (Premium analytics, recommendations)

### Business Model Options
- **B2C:** Direct to consumer
- **B2B2C:** Marketplace for vendors
- **D2C:** Creator economy
- **SaaS:** Resell as platform

---

## 🔧 Tech Stack

```
Frontend:
- React 18+ with TypeScript
- Vite (build tool)
- TailwindCSS + Shadcn/ui
- TanStack Query (data fetching)
- Zustand/Context (state management)
- React Router (routing)
- Zod (validation)

Backend:
- Node.js + Express (if self-hosted)
- Supabase (database + auth + storage)
- Edge functions for serverless logic

Payments:
- Razorpay SDK
- Stripe SDK

Communication:
- Resend/SendGrid (email)
- Twilio (SMS/WhatsApp)

Hosting:
- Vercel (frontend)
- Supabase Hosted (backend)
- Cloudflare (CDN)

Analytics & Monitoring:
- PostHog (analytics)
- Sentry (error tracking)
- Datadog (monitoring)
```

---

## 📋 Feature Checklist

### MVP Features
- [x] Product catalog (physical)
- [ ] Digital products
- [ ] Shopping cart
- [ ] Checkout (COD + Razorpay)
- [ ] Order management
- [ ] User authentication
- [ ] Profile management
- [ ] Admin dashboard

### Phase 1 Features
- [ ] Advanced filtering
- [ ] Product reviews
- [ ] Wishlist
- [ ] Coupon system
- [ ] Email notifications
- [ ] Analytics dashboard

### Phase 2 Features
- [ ] WhatsApp commerce
- [ ] Vendor management
- [ ] Affiliate system
- [ ] AI recommendations
- [ ] Multi-currency support
- [ ] Advanced reporting

### Phase 3+ Features
- [ ] Subscription products
- [ ] Live shopping features
- [ ] AI chatbot
- [ ] Marketplace (B2B2C)
- [ ] Mobile apps (iOS/Android)
- [ ] White-label SaaS

---

## 🎯 Success Metrics

### Business KPIs
- Conversion rate: > 2%
- Average order value (AOV): Track growth
- Customer lifetime value (LTV): > 5x CAC
- Repeat purchase rate: > 30%

### Technical KPIs
- Page load time: < 2.5s
- API response time: < 200ms
- Uptime: > 99.9%
- Error rate: < 0.1%

### UX KPIs
- Cart abandonment: < 60%
- Mobile traffic conversion: Parity with desktop
- Average session duration: > 3min
- Bounce rate: < 40%

---

This architecture provides a complete, scalable, reusable platform that can be adapted for any ecommerce niche while maintaining premium quality and conversion focus.
