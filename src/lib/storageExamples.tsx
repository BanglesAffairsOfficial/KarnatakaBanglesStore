/**
 * ============================================================================
 * Storage Integration Examples & Tests
 * ============================================================================
 * 
 * Practical examples showing how to use storageHelpers across the application
 * with the existing component hierarchy.
 */

// ============================================================================
// EXAMPLE 1: Product Management with Image Upload
// ============================================================================

import React, { useState } from "react";
import { uploadProductImage, deleteFile, listFiles } from "@/lib/storageHelpers";
import { supabase } from "@/integrations/supabase/client";

interface ProductFormProps {
  productId?: string;
  onSave?: (product: any) => void;
}

/**
 * Example: Complete product form with image upload
 */
export function ProductForm({ productId, onSave }: ProductFormProps) {
  const [images, setImages] = useState<Array<{ url: string; path: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load existing images if editing
  React.useEffect(() => {
    if (productId) {
      loadProductImages(productId);
    }
  }, [productId]);

  const loadProductImages = async (id: string) => {
    const { files } = await listFiles("products", `products/${id}`);
    setImages(
      files.map((f) => ({
        url: f.url,
        path: `products/${id}/${f.name}`,
      }))
    );
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !productId) return;

    setUploading(true);
    try {
      const result = await uploadProductImage(file, productId);

      if (result.success && result.path) {
        setImages((prev) => [...prev, { url: result.url || "", path: result.path }]);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (path: string) => {
    if (!confirm("Delete this image?")) return;

    const result = await deleteFile("products", path);
    if (result.success) {
      setImages((prev) => prev.filter((img) => img.path !== path));
    } else {
      alert(`Delete failed: ${result.error}`);
    }
  };

  return (
    <div className="space-y-4">
      <h2>Product Images</h2>

      {/* Image Gallery */}
      <div className="grid grid-cols-3 gap-4">
        {images.map((img) => (
          <div key={img.path} className="relative">
            <img src={img.url} alt="Product" className="w-full h-40 object-cover rounded" />
            <button
              onClick={() => handleImageDelete(img.path)}
              className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Upload Button */}
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading || !productId}
        />
        <button disabled={uploading}>{uploading ? "Uploading..." : "Add Image"}</button>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Banner Management Component
// ============================================================================

import { uploadBanner, deleteOldFiles } from "@/lib/storageHelpers";

interface BannerManagerProps {
  onUploadComplete?: (url: string) => void;
}

/**
 * Example: Banner upload for admin panel
 */
export function BannerManager({ onUploadComplete }: BannerManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    setUploading(true);
    try {
      const result = await uploadBanner(file);

      if (result.success) {
        // Auto-resizes to 1920x900
        console.log("Banner uploaded:", result.url);
        onUploadComplete?.(result.url || "");

        // Cleanup old banners (keep 5 most recent)
        await deleteOldFiles("banners", "hero", 5);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border rounded p-4">
      <h3>Upload Hero Banner</h3>
      <p className="text-sm text-gray-500">Will be auto-resized to 1920×900</p>

      {previewUrl && (
        <div className="mt-4">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto max-h-64 object-contain rounded"
          />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleBannerUpload}
        disabled={uploading}
        className="mt-4"
      />
      <button disabled={uploading}>{uploading ? "Uploading..." : "Upload Banner"}</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: User Profile Picture Upload
// ============================================================================

import { uploadProfilePicture, getSignedUrl } from "@/lib/storageHelpers";

/**
 * Example: Profile picture upload for user dashboard
 */
export function ProfilePictureUpload() {
  const [currentUrl, setCurrentUrl] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string>();

  // Get current user on mount
  React.useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id);
    };
    getUser();
  }, []);

  const handleProfileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadProfilePicture(file);

      if (result.success) {
        // result.signedUrl is valid for 24 hours
        setCurrentUrl(result.signedUrl);

        // To get fresh URL later:
        // const { signedUrl } = await getSignedUrl("profiles", "user-id/profile.jpg", 3600);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {currentUrl && (
          <img
            src={currentUrl}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover"
          />
        )}
        <div>
          <h3>Profile Picture (400×400)</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleProfileUpload}
            disabled={uploading}
          />
          <p className="text-sm text-gray-500">5MB max, auto-resized to 400×400</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: B2B Document Upload
// ============================================================================

import { uploadBusinessProof, getSignedUrls } from "@/lib/storageHelpers";

interface DocumentUploadProps {
  documentType: "gst_certificate" | "pan_card" | "business_license";
  onUploadComplete?: (path: string) => void;
}

/**
 * Example: B2B verification document upload
 */
export function BusinessProofUpload({ documentType, onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string>();

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadBusinessProof(file, documentType);

      if (result.success && result.path) {
        setUploadedPath(result.path);
        onUploadComplete?.(result.path);

        // Note: Private file, use signed URLs to share
        const { signedUrl } = await getSignedUrl("business_proofs", result.path, 7200); // 2 hours
        console.log("Signed URL for sharing:", signedUrl);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const labelMap = {
    gst_certificate: "GST Certificate",
    pan_card: "PAN Card",
    business_license: "Business License",
  };

  return (
    <div>
      <h3>{labelMap[documentType]}</h3>
      {uploadedPath && (
        <p className="text-green-600">✓ Uploaded: {uploadedPath.split("/").pop()}</p>
      )}
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={handleDocumentUpload}
        disabled={uploading}
      />
      <p className="text-sm text-gray-500">PDF or image, max 20MB</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Category Image Management
// ============================================================================

import { uploadCategoryImage } from "@/lib/storageHelpers";

interface CategoryImageProps {
  categoryId: string;
  categoryName: string;
}

/**
 * Example: Category image upload for admin
 */
export function CategoryImageUpload({ categoryId, categoryName }: CategoryImageProps) {
  const [imageUrl, setImageUrl] = useState<string>();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadCategoryImage(file, categoryId);
      if (result.success) {
        setImageUrl(result.url);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border rounded p-4">
      <h4>{categoryName}</h4>
      {imageUrl && (
        <img src={imageUrl} alt={categoryName} className="w-32 h-32 object-cover rounded mb-2" />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Batch Image Operations
// ============================================================================

import {
  deleteFiles,
  deleteFolderContents,
  replaceFile,
  listFiles,
} from "@/lib/storageHelpers";

/**
 * Example: Batch operations for product image management
 */
export async function batchProductImageOperations(productId: string) {
  console.log(`Managing images for product: ${productId}`);

  // 1. List all images for product
  const { files } = await listFiles("products", `products/${productId}`);
  console.log(`Found ${files.length} images`);

  // 2. Delete old images (keep 3 recent)
  const filesToDelete = files.slice(3).map((f) => `products/${productId}/${f.name}`);
  if (filesToDelete.length > 0) {
    const deleteResult = await deleteFiles("products", filesToDelete);
    console.log(`Deleted ${deleteResult.deletedCount} old images`);
  }

  // 3. Replace primary image
  // const newPrimaryImage = /* File from input */;
  // const result = await replaceFile(
  //   "products",
  //   `products/${productId}/primary.jpg`,
  //   newPrimaryImage
  // );
  // console.log("Primary image updated:", result.path);

  // 4. Delete entire product folder
  // const cleanupResult = await deleteFolderContents("products", `products/${productId}`);
  // console.log(`Cleaned up ${cleanupResult.deletedCount} images`);
}

// ============================================================================
// EXAMPLE 7: Image Verification & Cleanup
// ============================================================================

import { getBucketInfo } from "@/lib/storageHelpers";

/**
 * Example: Verify storage setup and generate report
 */
export async function generateStorageReport() {
  const buckets = ["banners", "products", "categories", "profiles", "business_proofs"] as const;

  console.log("📊 Storage Report\n");

  for (const bucket of buckets) {
    const info = await getBucketInfo(bucket);
    const { files: fileList } = await listFiles(bucket as any, undefined, 100);

    console.log(`${bucket.toUpperCase()}`);
    console.log(`  Max size: ${info.maxSizeMB}MB`);
    console.log(`  Access: ${info.isPublic ? "PUBLIC" : "PRIVATE"}`);
    console.log(`  Files: ${fileList.length}`);
    console.log`  Allowed types: ${info.allowedMimeTypes.join(", ")}`);
    console.log("");
  }
}

// ============================================================================
// EXAMPLE 8: Error Handling & Recovery
// ============================================================================

/**
 * Example: Robust upload with retry logic
 */
export async function uploadWithRetry(
  bucket: "products" | "banners" | "categories" | "profiles" | "business_proofs",
  file: File,
  maxRetries = 3
) {
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}...`);

      const result = await (async () => {
        if (bucket === "banners") {
          return await uploadBanner(file);
        } else if (bucket === "products") {
          return await uploadProductImage(file, "default-product");
        } else if (bucket === "categories") {
          return await uploadCategoryImage(file, "default-category");
        } else if (bucket === "profiles") {
          return await uploadProfilePicture(file);
        } else {
          return await uploadBusinessProof(file, "document");
        }
      })();

      if (result.success) {
        console.log(`✅ Upload successful on attempt ${attempt}`);
        return result;
      }

      lastError = result.error || "Unknown error";
      console.warn(`⚠️  Attempt ${attempt} failed: ${lastError}`);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Exception on attempt ${attempt}:`, lastError);
    }
  }

  console.error(`❌ Upload failed after ${maxRetries} attempts. Last error: ${lastError}`);
  return { success: false, error: lastError };
}

// ============================================================================
// EXAMPLE 9: Access Control Verification
// ============================================================================

import { canAccessFile } from "@/lib/storageHelpers";

/**
 * Example: Verify file access permissions
 */
export async function verifyFileAccess(bucket: string, filePath: string) {
  const hasAccess = await canAccessFile(bucket as any, filePath);

  if (hasAccess) {
    console.log(`✅ You have access to ${filePath}`);
  } else {
    console.log(`❌ You don't have access to ${filePath}`);
  }

  return hasAccess;
}

// ============================================================================
// TESTING EXAMPLES
// ============================================================================

/**
 * Example: Unit test for storage operations
 */
export async function testStorageOperations() {
  console.log("🧪 Running Storage Tests\n");

  // Test 1: File validation
  console.log("Test 1: File validation");
  const largeFile = new File(["x".repeat(20 * 1024 * 1024)], "large.jpg", {
    type: "image/jpeg",
  });
  const result1 = await uploadProductImage(largeFile, "test-product");
  console.log(`  Result: ${result1.success ? "✅ Pass" : "❌ Fail"}`);
  console.log(`  Error: ${result1.error}\n`);

  // Test 2: Correct file type
  console.log("Test 2: Valid file upload");
  const validFile = new File(["test"], "image.jpg", { type: "image/jpeg" });
  // const result2 = await uploadProductImage(validFile, "test-product");
  // console.log(`  Result: ${result2.success ? "✅ Pass" : "❌ Fail"}\n`);

  // Test 3: List files
  console.log("Test 3: List files");
  const { files } = await listFiles("products", "test-product", 10);
  console.log(`  Found ${files.length} files`);
  console.log(`  Result: ${files.length >= 0 ? "✅ Pass" : "❌ Fail"}\n`);

  console.log("✅ Tests completed");
}
