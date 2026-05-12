# Premium Ecommerce UI/UX Design System

## 🎨 Design Philosophy

**"Minimal Luxury + Mobile-First Conversion"**

- Clean, spacious layouts
- Premium typography and spacing
- Fast load times and smooth interactions
- High trust appearance
- Mobile-optimized at every step
- Accessibility-first approach

---

## 📐 Design Tokens

### Color Palette

```typescript
// src/styles/colors.css

:root {
  /* Primary Brand Colors */
  --color-primary: #0ea5e9;      /* Sky Blue - Trust */
  --color-primary-dark: #0284c7;
  --color-primary-light: #0369a1;
  
  /* Neutral Palette */
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  /* Status Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Semantic Colors */
  --color-price: #065f46;         /* Dark Green */
  --color-discount: #dc2626;      /* Red */
  --color-sale: #dc2626;
  --color-stock-low: #f59e0b;
  --color-stock-out: #6b7280;
}
```

### Typography System

```typescript
// src/styles/typography.css

/* Font Family */
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-serif: 'Merriweather', Georgia, serif;
  --font-mono: 'Fira Code', 'Courier New', monospace;
}

/* Type Scale */
:root {
  /* Display/Hero */
  --text-display-xl: 3.5rem;  /* 56px */
  --text-display-lg: 2.875rem; /* 46px */
  --text-display-md: 2.25rem; /* 36px */
  
  /* Heading */
  --text-heading-lg: 1.875rem; /* 30px */
  --text-heading-md: 1.5rem;   /* 24px */
  --text-heading-sm: 1.25rem;  /* 20px */
  --text-heading-xs: 1.125rem; /* 18px */
  
  /* Body */
  --text-body-lg: 1.125rem;    /* 18px */
  --text-body-md: 1rem;         /* 16px */
  --text-body-sm: 0.875rem;    /* 14px */
  --text-body-xs: 0.75rem;     /* 12px */
  
  /* Line Height */
  --lh-display: 1.1;
  --lh-heading: 1.3;
  --lh-body: 1.5;
  --lh-dense: 1.25;
}

/* Font Weights */
:root {
  --fw-light: 300;
  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;
  --fw-bold: 700;
  --fw-extrabold: 800;
}
```

### Spacing System

```typescript
// src/styles/spacing.css

:root {
  --space-0: 0;
  --space-0-5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-2: 0.5rem;      /* 8px */
  --space-3: 0.75rem;     /* 12px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-7: 1.75rem;     /* 28px */
  --space-8: 2rem;        /* 32px */
  --space-10: 2.5rem;     /* 40px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
}

/* Mobile-first spacers */
h1 { margin-bottom: var(--space-8); }
h2 { margin-bottom: var(--space-6); }
h3 { margin-bottom: var(--space-4); }
p { margin-bottom: var(--space-4); }
section { margin-bottom: var(--space-20); }

@media (max-width: 640px) {
  h1 { margin-bottom: var(--space-6); }
  h2 { margin-bottom: var(--space-4); }
  section { margin-bottom: var(--space-12); }
}
```

### Shadow System

```typescript
// src/styles/shadows.css

:root {
  /* Shadows for elevation */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1),
              0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1),
              0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1),
              0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1),
              0 10px 10px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.15);
  
  /* Product card hover shadow */
  --shadow-product: var(--shadow-lg);
  --shadow-product-hover: var(--shadow-xl);
  
  /* Modal/Overlay shadow */
  --shadow-modal: 0 20px 25px rgba(0, 0, 0, 0.15),
                 0 10px 10px rgba(0, 0, 0, 0.04);
}
```

### Border Radius

```typescript
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;    /* 4px */
  --radius-base: 0.375rem; /* 6px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-2xl: 1.5rem;    /* 24px */
  --radius-3xl: 2rem;      /* 32px */
  --radius-full: 9999px;   /* Circles */
}
```

---

## 🧩 Component Library

### Brand New Components

#### 1. **Premium Hero Section**

```typescript
// src/components/layout/HeroSection.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/common/LazyImage';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  variant?: 'default' | 'split' | 'carousel';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  ctaText = 'Shop Now',
  ctaLink = '/shop',
  backgroundImage,
  variant = 'default',
}) => {
  return (
    <section className="relative w-full h-screen md:h-[600px] overflow-hidden bg-gray-900">
      {/* Background */}
      {backgroundImage && (
        <>
          <LazyImage
            src={backgroundImage}
            alt="Hero background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}

      {/* Content */}
      <div className="relative h-full flex items-center justify-center px-4 md:px-8">
        <div className="text-center text-white space-y-6 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" className="rounded-full">
              {ctaText}
            </Button>
            <Button size="lg" variant="outline" className="rounded-full text-white border-white">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
};
```

#### 2. **Trust Indicators**

```typescript
// src/components/common/TrustIndicators.tsx

import React from 'react';
import { CheckCircle, Shield, Truck, RotateCw } from 'lucide-react';

export const TrustIndicators: React.FC = () => {
  const indicators = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: '100% Secure',
      description: 'SSL encrypted checkout',
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: 'Fast Delivery',
      description: 'Delivery within 2-3 days',
    },
    {
      icon: <RotateCw className="w-6 h-6" />,
      title: 'Easy Returns',
      description: '7-day return policy',
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Money Back',
      description: 'If not satisfied',
    },
  ];

  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {indicators.map((indicator, idx) => (
            <div key={idx} className="text-center space-y-3">
              <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-full">
                {indicator.icon}
              </div>
              <h3 className="font-semibold text-gray-900">{indicator.title}</h3>
              <p className="text-sm text-gray-600">{indicator.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
```

#### 3. **Sticky Mobile CTA**

```typescript
// src/components/mobile/StickyMobileCTA.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-mobile';

interface StickyMobileCTAProps {
  title: string;
  action: () => void;
  actionText?: string;
  onClose?: () => void;
}

export const StickyMobileCTA: React.FC<StickyMobileCTAProps> = ({
  title,
  action,
  actionText = 'Shop Now',
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useMediaQuery('(max-width: 640px)');

  if (!isMobile || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 safe-bottom">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{title}</p>
        </div>
        <Button size="sm" onClick={action} className="rounded-full whitespace-nowrap">
          {actionText}
        </Button>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
```

#### 4. **Product Rating Component**

```typescript
// src/components/common/RatingStar.tsx

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  reviewCount?: number;
}

export const RatingStar: React.FC<RatingStarProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRate,
  reviewCount,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: maxRating }).map((_, idx) => {
          const starRating = idx + 1;
          const isFilled = starRating <= (hoverRating || Math.round(rating));

          return (
            <button
              key={idx}
              className={cn(
                'transition-colors',
                interactive ? 'cursor-pointer' : 'cursor-default'
              )}
              onMouseEnter={() => interactive && setHoverRating(starRating)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onClick={() => interactive && onRate?.(starRating)}
              disabled={!interactive}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                )}
              />
            </button>
          );
        })}
      </div>
      {reviewCount !== undefined && (
        <span className="text-xs text-gray-600 ml-1">
          {rating.toFixed(1)} ({reviewCount})
        </span>
      )}
    </div>
  );
};
```

#### 5. **Urgency Badge Component**

```typescript
// src/components/product/UrgencyBadge.tsx

import React from 'react';
import { AlertCircle, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type UrgencyType = 'low_stock' | 'trending' | 'limited_time';

interface UrgencyBadgeProps {
  type: UrgencyType;
  value?: number;
  text?: string;
  className?: string;
}

const urgencyConfig = {
  low_stock: {
    icon: AlertCircle,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    label: (v?: number) => `Only ${v || 'few'} left!`,
  },
  trending: {
    icon: TrendingUp,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    label: (v?: number) => `Trending - ${v || '100+'}% sold`,
  },
  limited_time: {
    icon: Zap,
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    label: (v?: number) => `Limited Offer - ${v || 24}hrs left`,
  },
};

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({
  type,
  value,
  text,
  className,
}) => {
  const config = urgencyConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <Icon className="w-4 h-4 animate-pulse" />
      <span>{text || config.label(value)}</span>
    </div>
  );
};
```

---

## 📱 Mobile-First Guidelines

### Breakpoints

```typescript
const breakpoints = {
  xs: '0px',      // Mobile
  sm: '640px',    // Tablet small
  md: '768px',    // Tablet
  lg: '1024px',   // Desktop
  xl: '1280px',   // Desktop large
  '2xl': '1536px', // Desktop XL
};
```

### Mobile Optimization Checklist

- [ ] Touch targets minimum 44x44px
- [ ] Thumb-friendly navigation (bottom of screen)
- [ ] Large, readable text (minimum 16px)
- [ ] Single column layout on mobile
- [ ] Minimize horizontal scrolling
- [ ] Fast load time (< 3 seconds)
- [ ] Optimized images (WebP format)
- [ ] Sticky header/navigation
- [ ] Bottom sheet modals instead of centered
- [ ] Full-width buttons for primary actions

---

## 🎬 Animation & Micro-interactions

### Smooth Transitions

```css
/* Entrance Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Apply to elements */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.4s ease-out;
}

.animate-slide-in-right {
  animation: slideInRight 0.5s ease-out;
}

/* Hover states */
button {
  transition: all 0.2s ease-in-out;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Loading state */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Pulse effect */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## 🎯 Conversion-Focused Patterns

### 1. Progressive Disclosure

```typescript
// Show less initially, reveal more on interaction
// Reduces cognitive load

<div className="space-y-4">
  <ProductBasicInfo />
  <Expandable title="Features" defaultOpen={false}>
    <ProductFeatures />
  </Expandable>
  <Expandable title="Specifications" defaultOpen={false}>
    <ProductSpecs />
  </Expandable>
</div>
```

### 2. Social Proof

```typescript
// Show real timers for urgency
<div className="flex gap-4">
  <div>
    <span className="text-2xl font-bold">4.8⭐</span>
    <p className="text-sm text-gray-600">1,234 Reviews</p>
  </div>
  <div>
    <span className="text-2xl font-bold">500+</span>
    <p className="text-sm text-gray-600">Sold This Week</p>
  </div>
  <div>
    <span className="text-2xl font-bold">12</span>
    <p className="text-sm text-gray-600">Bought Today</p>
  </div>
</div>
```

### 3. Scarcity & Urgency

```typescript
// Time-limited display
<StockStatus
  availableCount={5}
  urgencyText="Only 5 items left"
  showTimer={true}
  saleDaysRemaining={2}
/>
```

### 4. Reduced Friction Checkout

```typescript
// Guest checkout option
// Saved payment methods
// One-click purchase
// Auto-fill from profile
```

---

## 🎨 Responsive Layout Patterns

### 1. Hero Card Grid

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {cards.map((card) => (
    <div key={card.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <img src={card.image} alt={card.title} className="w-full h-48 object-cover rounded-t-lg" />
      <div className="p-6">
        <h3>{card.title}</h3>
        <p>{card.description}</p>
        <Button className="w-full mt-4">Action</Button>
      </div>
    </div>
  ))}
</div>
```

### 2. Feature List

```typescript
<div className="space-y-8">
  {features.map((feature) => (
    <div key={feature.id} className="flex gap-6">
      <div className="flex-shrink-0">
        <feature.Icon className="w-8 h-8 text-blue-600" />
      </div>
      <div>
        <h3 className="font-semibold">{feature.title}</h3>
        <p className="text-gray-600">{feature.description}</p>
      </div>
    </div>
  ))}
</div>
```

### 3. Product Gallery

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  <div className="space-y-4">
    <img src={mainImage} alt="Main" className="w-full rounded-lg" />
    <div className="grid grid-cols-4 gap-2">
      {thumbnails.map((thumb) => (
        <img key={thumb} src={thumb} alt="Thumbnail" className="rounded cursor-pointer" />
      ))}
    </div>
  </div>
  <div className="space-y-6">
    <ProductInfo />
    <PriceSection />
    <ActionButtons />
  </div>
</div>
```

---

## 📐 Accessibility Standards (WCAG 2.1 AA)

- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Keyboard navigation support
- [ ] ARIA labels for screen readers
- [ ] Focus indicators visible
- [ ] Alt text for all images
- [ ] Form labels properly associated
- [ ] Skip links to main content
- [ ] Semantic HTML structure
- [ ] Video captions & transcripts
- [ ] Error messages clearly visible

---

## 🎭 Brand Voice & Tone

**Tone:** Friendly, professional, trustworthy, inspiring

- **Headlines:** Bold, confident, benefit-focused
- **Body Text:** Conversational, helpful, clear
- **CTAs:** Action-oriented, urgent but not pushy
- **Error Messages:** Helpful, apologetic, solution-focused

---

This design system ensures a premium, cohesive, conversion-optimized experience across all devices and use cases.
