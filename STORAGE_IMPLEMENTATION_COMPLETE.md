# Supabase Storage System - Complete Implementation

## 📋 Overview

A production-ready Supabase storage management system for the Karnataka Bangle Store eCommerce platform. Handles uploads, delivery, and lifecycle management for 5 specialized storage buckets with complete RLS security policies.

---

## 🏗️ Architecture

### Storage Buckets

```
┌─ PUBLIC BUCKETS ──────────────────┐
│ ├─ banners (5MB)                   │
│ ├─ products (10MB)                 │
│ └─ categories (5MB)                │
└────────────────────────────────────┘

┌─ PRIVATE BUCKETS ────────────────┐
│ ├─ profiles (5MB)                  │
│ └─ business_proofs (20MB)          │
└────────────────────────────────────┘
```

### Folder Structure

```
banners/hero/[timestamp-random].jpg

products/
├── product-001/
│   ├── [timestamp-random].jpg
│   ├── [timestamp-random].jpg
│   └── [timestamp-random].jpg
└── product-002/
    └── [timestamp-random].jpg

categories/
├── category-001/[timestamp-random].jpg
└── category-002/[timestamp-random].jpg

profiles/
├── user-id-1/[timestamp-random].jpg
├── user-id-2/[timestamp-random].jpg
└── user-id-3/[timestamp-random].jpg

business_proofs/
├── user-id-1/
│   ├── gst_certificate/[document].pdf
│   ├── pan_card/[document].jpg
│   └── business_license/[document].pdf
└── user-id-2/
    └── gst_certificate/[document].pdf
```

---

## 📦 Files Created

### 1. **Storage Helpers** - Core Functionality
📄 `src/lib/storageHelpers.ts` (500+ lines)

**Includes:**
- ✅ Core upload function with validation
- ✅ 5 specialized upload functions
- ✅ Public URL generation
- ✅ Signed URL generation (private buckets)
- ✅ File deletion (single, multiple, folder)
- ✅ Batch operations
- ✅ Image resizing
- ✅ Access control verification

**Exports:**
```typescript
// Upload functions
uploadBanner()
uploadProductImage()
uploadCategoryImage()
uploadProfilePicture()
uploadBusinessProof()

// URL functions
getPublicUrl()
getSignedUrl()
getSignedUrls()

// Delete functions
deleteFile()
deleteFiles()
deleteFolderContents()
deleteOldFiles()
replaceFile()

// List & Info
listFiles()
getBucketInfo()
canAccessFile()
```

### 2. **SQL Migration** - Database Setup
📄 `supabase/migrations/20260320000000_setup_storage_buckets.sql` (250+ lines)

**Creates:**
- ✅ All 5 storage buckets
- ✅ RLS policies for public buckets (read for all, write for authenticated)
- ✅ RLS policies for private buckets (read/write own files only)
- ✅ Performance indexes
- ✅ Comprehensive documentation

**Policies:**
- Public bucket policies (banners, products, categories)
- Private bucket policies (profiles, business_proofs)
- User-scoped access control

### 3. **Setup Guide** - Documentation
📄 `STORAGE_SETUP_GUIDE.md` (400+ lines)

**Covers:**
- ✅ Architecture overview
- ✅ Step-by-step setup instructions
- ✅ Bucket configuration
- ✅ Comprehensive usage examples
- ✅ Error handling guide
- ✅ Security best practices
- ✅ Troubleshooting guide
- ✅ API reference

### 4. **Setup Script** - Automation
📄 `scripts/setupStorage.js` (150+ lines)

**Features:**
- ✅ Programmatic bucket creation
- ✅ Configuration validation
- ✅ Automated verification
- ✅ Error handling
- ✅ Logging and reporting

**Usage:**
```bash
node scripts/setupStorage.js
```

### 5. **Integration Examples** - Real-world Usage
📄 `src/lib/storageExamples.tsx` (600+ lines)

**Examples:**
- ✅ Product management with images
- ✅ Banner management
- ✅ Profile picture upload
- ✅ B2B document upload
- ✅ Category image management
- ✅ Batch operations
- ✅ Error handling & retry logic
- ✅ Access verification
- ✅ Testing helpers

---

## 🚀 Quick Start

### Step 1: Create Buckets

**Option A: Dashboard** (Recommended for first setup)
- Go to Supabase Dashboard → Storage → Buckets
- Create 5 buckets using configurations from `STORAGE_SETUP_GUIDE.md`

**Option B: Script** (Automation)
```bash
export SUPABASE_URL=https://[project].supabase.co
export SUPABASE_ADMIN_KEY=[service-role-key]
node scripts/setupStorage.js
```

### Step 2: Deploy SQL Policies

```bash
# Using Supabase CLI
supabase db push

# Or manually paste SQL from:
# supabase/migrations/20260320000000_setup_storage_buckets.sql
```

### Step 3: Import and Use

```typescript
import { uploadProductImage, deleteFile } from "@/lib/storageHelpers";

// Upload
const result = await uploadProductImage(file, productId);
if (result.success) {
  console.log("URL:", result.url);
}

// Delete
await deleteFile("products", result.path!);
```

---

## 💡 Core Features

### 1. **Automatic Image Resizing**
```typescript
// Automatically resize to 1920×900
uploadBanner(file)

// Auto-resize to 400×400
uploadProfilePicture(file)
```

### 2. **Folder Organization**
```typescript
// Products: products/[product-id]/[file]
uploadProductImage(file, productId)

// Categories: categories/[category-id]/[file]
uploadCategoryImage(file, categoryId)

// Profiles: profiles/[user-id]/[file]
uploadProfilePicture(file)
```

### 3. **Automatic Cleanup**
```typescript
// Delete old files, keep N recent
await deleteOldFiles("profiles", userId, 3)
```

### 4. **Batch Operations**
```typescript
// Delete multiple files
await deleteFiles("products", [path1, path2, path3])

// Get signed URLs for multiple files
await getSignedUrls("profiles", [path1, path2], 3600)
```

### 5. **Security & Access Control**
```typescript
// Public buckets - anyone can read
getPublicUrl("products", path)

// Private buckets - authenticated users only
const { signedUrl } = await getSignedUrl("profiles", path, 3600)
```

### 6. **File Validation**
- ✅ File type validation (MIME types)
- ✅ File size limits
- ✅ Dimension validation
- ✅ Authentication checks

---

## 🔒 Security

### RLS Policies

| Bucket | Read | Write | Delete |
|--------|------|-------|--------|
| **banners** | Public | Authenticated | Authenticated |
| **products** | Public | Authenticated | Authenticated |
| **categories** | Public | Authenticated | Authenticated |
| **profiles** | Own files only | Own files only | Own files only |
| **business_proofs** | Own files only | Own files only | Own files only |

### Signed URLs

```typescript
// Generate time-limited access (24 hours default)
const { signedUrl } = await getSignedUrl("profiles", path, 86400)

// Customizable expiry
const { signedUrl } = await getSignedUrl("business_proofs", path, 3600) // 1 hour
```

### File Validation

```typescript
// Automatic validation on upload
- File type checking (MIME)
- File size limits
- Dimension checking
- User authentication
```

---

## 📊 Usage Examples

### Upload Product Image
```typescript
const result = await uploadProductImage(file, "bangle-001");
// URL: /storage/v1/object/public/products/bangle-001/[file]
```

### Upload & Auto-Resize Banner
```typescript
const result = await uploadBanner(file);
// Auto-resizes to 1920×900
// URL: /storage/v1/object/public/banners/hero/[file]
```

### Private File Access
```typescript
const { signedUrl } = await getSignedUrl("profiles", `${userId}/profile.jpg`);
// Signed URL valid for 24 hours
// User can share this link securely
```

### List Product Images
```typescript
const { files } = await listFiles("products", "bangle-001");
files.forEach(f => console.log(f.name, f.url));
```

### Cleanup Old Images
```typescript
// Keep only 3 most recent profile pictures
await deleteOldFiles("profiles", userId, 3);
```

---

## 🎯 Component Integration

### With Existing ImageUpload Component

```typescript
// src/components/ImageUpload.tsx already handles:
// - Image compression
// - File validation
// - Progress tracking

// Import storage helpers for specific buckets:
import { uploadBanner, uploadProductImage } from "@/lib/storageHelpers";
```

### New Storage-Ready Components

```typescript
import { BannerManager } from "@/lib/storageExamples";
import { ProductImageUpload } from "@/lib/storageExamples";
import { ProfilePictureUpload } from "@/lib/storageExamples";

export default function AdminPanel() {
  return (
    <>
      <BannerManager />
      <ProductImageUpload productId="001" />
      <ProfilePictureUpload />
    </>
  );
}
```

---

## ⚙️ Configuration

### Environment Variables

```env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[key]
```

### File Size Limits

```typescript
const BUCKET_CONFIG = {
  banners: { maxSize: 5 * 1024 * 1024 },      // 5MB
  products: { maxSize: 10 * 1024 * 1024 },    // 10MB
  categories: { maxSize: 5 * 1024 * 1024 },   // 5MB
  profiles: { maxSize: 5 * 1024 * 1024 },     // 5MB
  business_proofs: { maxSize: 20 * 1024 * 1024 }, // 20MB
};
```

### Allowed File Types

```typescript
const BUCKET_CONFIG = {
  banners: ["image/jpeg", "image/png", "image/webp"],
  products: ["image/jpeg", "image/png", "image/webp"],
  categories: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  profiles: ["image/jpeg", "image/png", "image/webp"],
  business_proofs: ["application/pdf", "image/jpeg", "image/png"],
};
```

---

## 🧪 Testing

### Unit Tests Setup

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react

# Create test file
touch src/lib/__tests__/storageHelpers.test.ts
```

### Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { generateFileName, validateFileSize } from '@/lib/storageHelpers';

describe('storageHelpers', () => {
  it('generates unique filenames', () => {
    const name1 = generateFileName('image.jpg');
    const name2 = generateFileName('image.jpg');
    expect(name1).not.toBe(name2);
  });

  it('validates file size', () => {
    const file = new File(['x'.repeat(10)], 'test.jpg');
    const result = validateFileSize(file, 100);
    expect(result.valid).toBe(true);
  });
});
```

---

## 🐛 Troubleshooting

### Upload Fails - "413 Payload Too Large"
```typescript
// Check bucket size limits
const info = await getBucketInfo("products");
console.log("Max size:", info.maxSizeMB);
```

### Signed URL Expired
```typescript
// Generate fresh URL
const { signedUrl } = await getSignedUrl("profiles", path, 86400);
```

### "Cannot access bucket" Error
```typescript
// Verify bucket exists
await supabase.storage.listBuckets();

// Check RLS policies
// SELECT * FROM pg_policies WHERE tablename = 'objects';
```

### CORS Issues
```javascript
// Configure CORS in Supabase dashboard:
// Settings → API → CORS Allowed origins
// Add: https://your-domain.com
```

---

## 📈 Scaling & Best Practices

### 1. **Pagination for Large Folders**
```typescript
// Don't load all files at once
const { files } = await listFiles("products", "category", 100);
// Handle pagination with limit/offset
```

### 2. **Caching Strategy**
```typescript
// Cache public URLs (they don't expire)
const url = getPublicUrl("products", path);
// Cache signed URLs for 23 hours (regenerate before expiry)
```

### 3. **Cleanup Scheduled Tasks**
```typescript
// Run daily to cleanup old files
schedule.daily('cleanup-old-images', async () => {
  for (const userId of userIds) {
    await deleteOldFiles("profiles", userId, 3);
  }
});
```

### 4. **Monitor Storage Usage**
```typescript
// Track bandwidth and storage
// Use Supabase Analytics Dashboard
```

---

## 📚 Documentation

- **Setup Guide**: `STORAGE_SETUP_GUIDE.md`
- **API Reference**: `src/lib/storageHelpers.ts` (JSDoc comments)
- **Examples**: `src/lib/storageExamples.tsx`
- **Migration**: `supabase/migrations/20260320000000_setup_storage_buckets.sql`

---

## 🔗 Related Files

- ImageUpload component: `src/components/ImageUpload.tsx`
- Auth Context: `src/contexts/AuthContext.tsx`
- Supabase Client: `src/integrations/supabase/client.ts`
- EditHomePage: `src/pages/EditHomePage.tsx`

---

## ✅ Checklist

- [ ] Create 5 storage buckets (Dashboard or script)
- [ ] Deploy SQL migration for RLS policies
- [ ] Test upload functions with sample files
- [ ] Integrate with existing components
- [ ] Test private file access
- [ ] Configure CORS settings
- [ ] Set up monitoring
- [ ] Train team on usage
- [ ] Document custom bucket usage

---

## 🎓 Learning Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [RLS Policy Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Signed URLs](https://supabase.com/docs/guides/storage/signed-urls)
- [File Operations](https://supabase.com/docs/reference/javascript/storage-list)

---

## 📞 Support

For issues or questions:
1. Check `STORAGE_SETUP_GUIDE.md` troubleshooting section
2. Review examples in `src/lib/storageExamples.tsx`
3. Check Supabase SQL policies in migration
4. Verify environment variables

---

**Created**: March 19, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
