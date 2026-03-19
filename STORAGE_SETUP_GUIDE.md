# Supabase Storage Setup Guide - Karnataka Bangle Store

## Overview

This document provides a complete guide for setting up and using Supabase Storage for the Karnataka Bangle Store eCommerce platform.

## Storage Architecture

```
Buckets Created:
├── banners (PUBLIC) - Hero slider images (5MB max)
├── products (PUBLIC) - Product images (10MB max)
├── categories (PUBLIC) - Category icons (5MB max)
├── profiles (PRIVATE) - User profile pictures (5MB max)
└── business_proofs (PRIVATE) - B2B documents (20MB max)
```

## Setup Instructions

### 1. Create Storage Buckets via Dashboard

Since Supabase doesn't support bucket creation through SQL migrations, use the Dashboard:

**Steps:**
1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Create each bucket with settings below:

#### Bucket: `banners`
- **Name**: banners
- **Public**: ✓
- **File size limit**: 5 MB
- **Allowed MIME types**: 
  - image/jpeg
  - image/png
  - image/webp

#### Bucket: `products`
- **Name**: products
- **Public**: ✓
- **File size limit**: 10 MB
- **Allowed MIME types**: 
  - image/jpeg
  - image/png
  - image/webp

#### Bucket: `categories`
- **Name**: categories
- **Public**: ✓
- **File size limit**: 5 MB
- **Allowed MIME types**: 
  - image/jpeg
  - image/png
  - image/webp
  - image/svg+xml

#### Bucket: `profiles`
- **Name**: profiles
- **Public**: ✗ (Private)
- **File size limit**: 5 MB
- **Allowed MIME types**: 
  - image/jpeg
  - image/png
  - image/webp

#### Bucket: `business_proofs`
- **Name**: business_proofs
- **Public**: ✗ (Private)
- **File size limit**: 20 MB
- **Allowed MIME types**: 
  - application/pdf
  - image/jpeg
  - image/png

### 2. Initialize Storage with SQL Policies

Run the migration SQL file to set up access policies:

```bash
cd /workspaces/KarnatakaBanglesStore
supabase db push  # Deploy migrations

# OR run manually in Supabase SQL Editor
# supabase/migrations/20260320000000_setup_storage_buckets.sql
```

### 3. Verify Setup

```sql
-- Check buckets are created
SELECT id, name, public FROM storage.buckets;

-- Check policies are set
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

---

## Usage Guide

### Import Functions

```typescript
import {
  uploadBanner,
  uploadProductImage,
  uploadCategoryImage,
  uploadProfilePicture,
  uploadBusinessProof,
  getPublicUrl,
  getSignedUrl,
  deleteFile,
  listFiles,
} from "@/lib/storageHelpers";
```

---

## Upload Examples

### 1. Upload Banner Image

```typescript
const file = /* File from input */;

const result = await uploadBanner(file);

if (result.success) {
  console.log("Banner URL:", result.url);
  // URL is automatically resized to 1920×900
} else {
  console.error("Upload failed:", result.error);
}
```

### 2. Upload Product Image

```typescript
const productId = "bangle-001";
const file = /* File from input */;

const result = await uploadProductImage(file, productId);

if (result.success) {
  // File stored at: products/bangle-001/[filename]
  console.log("Product image path:", result.path);
} else {
  console.error("Upload failed:", result.error);
}
```

### 3. Upload Category Image

```typescript
const categoryId = "gold-bangles";
const file = /* File from input */;

const result = await uploadCategoryImage(file, categoryId);

if (result.success) {
  // File stored at: categories/gold-bangles/[filename]
  console.log("Category URL:", result.url);
}
```

### 4. Upload User Profile Picture

```typescript
const file = /* File from input */;

// Must be authenticated
const result = await uploadProfilePicture(file);

if (result.success) {
  // File stored at: profiles/[user-id]/[filename]
  // Automatically resized to 400×400
  console.log("Signed URL (24hr):", result.signedUrl);
} else {
  console.error("Upload failed:", result.error);
}
```

### 5. Upload B2B Verification Document

```typescript
const file = /* File from input */;

// Must be authenticated
const result = await uploadBusinessProof(file, "gst_certificate");

if (result.success) {
  // File stored at: business_proofs/[user-id]/gst_certificate/[filename]
  console.log("Signed URL (24hr):", result.signedUrl);
}
```

---

## URL Generation Examples

### Get Public URLs

```typescript
// For public buckets
import { getPublicUrl } from "@/lib/storageHelpers";

const url = getPublicUrl("products", "bangle-001/image.jpg");
// URL format: https://[project].supabase.co/storage/v1/object/public/products/bangle-001/image.jpg
```

### Get Signed URLs (Private Buckets)

```typescript
import { getSignedUrl } from "@/lib/storageHelpers";

// Get signed URL valid for 1 hour (3600 seconds)
const { signedUrl, error } = await getSignedUrl(
  "profiles",
  "user-123/profile.jpg",
  3600 // 1 hour
);

if (signedUrl) {
  console.log("Secure URL:", signedUrl);
}
```

### Get Multiple Signed URLs

```typescript
import { getSignedUrls } from "@/lib/storageHelpers";

const files = ["user-123/profile1.jpg", "user-123/profile2.jpg"];
const results = await getSignedUrls("profiles", files, 3600);

// results: StorageFile[]
```

---

## Delete Examples

### Delete Single File

```typescript
import { deleteFile } from "@/lib/storageHelpers";

const result = await deleteFile("products", "bangle-001/old-image.jpg");

if (result.success) {
  console.log("File deleted");
}
```

### Delete Multiple Files

```typescript
import { deleteFiles } from "@/lib/storageHelpers";

const paths = [
  "products/bangle-001/image1.jpg",
  "products/bangle-001/image2.jpg",
];

const result = await deleteFiles("products", paths);
console.log(`Deleted ${result.deletedCount} files`);
```

### Delete Folder Contents

```typescript
import { deleteFolderContents } from "@/lib/storageHelpers";

const result = await deleteFolderContents("products", "old-bangle-001");

if (result.success) {
  console.log(`Deleted ${result.deletedCount} files from folder`);
}
```

### Delete Old Images (Keep N Recent)

```typescript
import { deleteOldFiles } from "@/lib/storageHelpers";

// Keep only 3 most recent profile pictures
const result = await deleteOldFiles("profiles", "user-123", 3);

console.log(`Cleaned up ${result.deletedCount} old files`);
```

### Replace File (Old → New)

```typescript
import { replaceFile } from "@/lib/storageHelpers";

const oldPath = "products/bangle-001/image.jpg";
const newFile = /* File from input */;

const result = await replaceFile("products", oldPath, newFile);

if (result.success) {
  console.log("File replaced:", result.path);
}
```

---

## List Files Examples

### List Files in Bucket

```typescript
import { listFiles } from "@/lib/storageHelpers";

const { files, error } = await listFiles("products", "bangle-001");

files.forEach(file => {
  console.log(`${file.name} - ${file.url}`);
});
```

---

## Integration Examples

### Complete Product Upload Component

```typescript
import React, { useState } from 'react';
import { uploadProductImage, deleteFile } from "@/lib/storageHelpers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ProductImageUploadProps {
  productId: string;
  onUploadComplete: (url: string, path: string) => void;
}

export function ProductImageUpload({ productId, onUploadComplete }: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadProductImage(file, productId);

      if (result.success) {
        toast({ title: "Success", description: "Image uploaded successfully" });
        onUploadComplete(result.url || "", result.path || "");
      } else {
        toast({ 
          title: "Error", 
          description: result.error, 
          variant: "destructive" 
        });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <Button disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
```

### Complete Profile Picture Upload

```typescript
import React, { useState } from 'react';
import { uploadProfilePicture, deleteFile } from "@/lib/storageHelpers";

export function ProfilePictureUpload() {
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadProfilePicture(file);

      if (result.success) {
        // result.signedUrl for private access (24 hour expiry)
        // or get fresh signed URL when needed
        setProfileUrl(result.signedUrl || result.url);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {profileUrl && (
        <div>
          <img src={profileUrl} alt="Profile" style={{ width: 100, borderRadius: '50%' }} />
          <p>400×400 - Auto-resized</p>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading}
      />
    </div>
  );
}
```

---

## Security Best Practices

### 1. RLS Policies
- ✓ Public buckets allow read access to anyone
- ✓ Private buckets require authentication
- ✓ Users can only access/modify their own files

### 2. File Validation
- ✓ File type validation (MIME types)
- ✓ File size limits enforced
- ✓ Client-side and server-side validation

### 3. Signed URLs
- ✓ Private files use signed URLs
- ✓ Signed URLs expire after 24 hours by default
- ✓ Generate fresh signed URLs when needed

### 4. Folder Structure
```
profiles/
  ├── user-id-1/
  │   ├── profile.jpg
  │   └── profile-old.jpg
  └── user-id-2/
      └── profile.jpg

business_proofs/
  ├── user-id-1/
  │   ├── gst_certificate/
  │   │   └── document.pdf
  │   └── pan_card/
  │       └── document.jpg
  └── user-id-2/
      └── gst_certificate/
          └── document.pdf

products/
  ├── bangle-001/
  │   ├── image1.jpg
  │   ├── image2.jpg
  │   └── thumbnail.jpg
  └── bangle-002/
      └── image1.jpg
```

---

## Error Handling

```typescript
const result = await uploadProductImage(file, productId);

if (!result.success) {
  // Handle different error types
  if (result.error?.includes("size")) {
    // File too large
  } else if (result.error?.includes("type")) {
    // Invalid file type
  } else if (result.error?.includes("authenticated")) {
    // Not authenticated
  }
  
  console.error(result.error);
}
```

---

## Environment Variables

Required in `.env`:

```env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[your-key]
```

---

## Storage Limits and Quotas

| Bucket | Max File Size | Max Files | Business Model |
|--------|---------------|-----------|----------------|
| banners | 5 MB | Unlimited | Free tier: 50GB/month |
| products | 10 MB | Unlimited | Pro: 500GB/month |
| categories | 5 MB | Unlimited | - |
| profiles | 5 MB | Unlimited | - |
| business_proofs | 20 MB | Unlimited | - |

See [Supabase Pricing](https://supabase.com/pricing) for current quotas.

---

## Troubleshooting

### Upload Fails with 413 Error
- **Cause**: File exceeds bucket size limit
- **Solution**: Check `BUCKET_CONFIG` limits and compress file

### Cannot Access Private Bucket File
- **Cause**: Not authenticated or file not in user's folder
- **Solution**: Verify authentication and file path starts with user ID

### Signed URL Expired
- **Cause**: URL older than 24 hours
- **Solution**: Generate fresh signed URL or increase expiry time

### CORS Issues
- **Solution**: Configure CORS in Supabase Storage settings for your domain

---

## API Reference

See [storageHelpers.ts](../lib/storageHelpers.ts) for complete type definitions and JSDoc comments.

### Core Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `uploadFile()` | Core upload function | StorageResponse |
| `uploadBanner()` | Upload hero banner | StorageResponse |
| `uploadProductImage()` | Upload product image | StorageResponse |
| `uploadProfilePicture()` | Upload user profile | StorageResponse |
| `getPublicUrl()` | Get public URL | string |
| `getSignedUrl()` | Get signed URL (private) | Promise<SignedUrlData> |
| `deleteFile()` | Delete single file | StorageResponse |
| `deleteFiles()` | Delete multiple files | DeleteResult |
| `listFiles()` | List files in folder | StorageFile[] |
| `replaceFile()` | Replace file | StorageResponse |

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage API](https://supabase.com/docs/reference/javascript/storage-createbucket)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
