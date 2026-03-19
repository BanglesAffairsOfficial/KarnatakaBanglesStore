/**
 * ============================================================================
 * Supabase Storage Management System
 * ============================================================================
 * 
 * Comprehensive storage helper functions for Karnataka Bangle Store
 * Handles uploads, downloads, and deletions across all storage buckets
 * 
 * Buckets:
 * - banners: Public hero slider images (max 5MB)
 * - products: Public product images (max 10MB)
 * - categories: Public category icons (max 5MB)
 * - profiles: Private user profile pictures (max 5MB)
 * - business_proofs: Private B2B verification docs (max 20MB)
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type StorageBucket = "banners" | "products" | "categories" | "profiles" | "business_proofs";

export interface UploadOptions {
  folder?: string;
  contentType?: string;
  shouldResize?: boolean;
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
}

export interface StorageResponse {
  success: boolean;
  url?: string;
  signedUrl?: string;
  path?: string;
  error?: string;
}

export interface StorageFile {
  name: string;
  url: string;
  signedUrl?: string;
  metadata?: Record<string, any>;
}

const BUCKET_CONFIG: Record<StorageBucket, {
  maxSize: number;
  isPublic: boolean;
  allowedMimeTypes: string[];
  description: string;
}> = {
  banners: {
    maxSize: 5 * 1024 * 1024, // 5MB
    isPublic: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    description: "Hero slider banner images",
  },
  products: {
    maxSize: 10 * 1024 * 1024, // 10MB
    isPublic: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    description: "Product bangle images",
  },
  categories: {
    maxSize: 5 * 1024 * 1024, // 5MB
    isPublic: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    description: "Category icons and images",
  },
  profiles: {
    maxSize: 5 * 1024 * 1024, // 5MB
    isPublic: false,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    description: "User profile pictures",
  },
  business_proofs: {
    maxSize: 20 * 1024 * 1024, // 20MB
    isPublic: false,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    description: "B2B verification documents",
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique filename with timestamp
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = originalName.split(".").pop() || "bin";
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Get the current user ID (for private bucket folder structure)
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Validate file size
 */
function validateFileSize(file: File, maxSize: number): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }
  return { valid: true };
}

/**
 * Validate file type
 */
function validateFileType(
  file: File,
  allowedMimeTypes: string[]
): { valid: boolean; error?: string } {
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`,
    };
  }
  return { valid: true };
}

/**
 * Resize image on client-side before upload
 */
async function resizeImage(
  file: File,
  width: number,
  height: number,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to resize image"));
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

/**
 * Build folder path for file organization
 */
function buildFolderPath(bucket: StorageBucket, folder?: string, userId?: string): string {
  const parts: string[] = [];

  // Add user ID folder for private buckets
  if (!BUCKET_CONFIG[bucket].isPublic && userId) {
    parts.push(userId);
  }

  // Add custom folder if provided
  if (folder) {
    parts.push(folder);
  }

  return parts.length > 0 ? parts.join("/") : "";
}

/**
 * Build full file path
 */
function buildFilePath(folderPath: string, fileName: string): string {
  return folderPath ? `${folderPath}/${fileName}` : fileName;
}

// ============================================================================
// CORE UPLOAD FUNCTION
// ============================================================================

/**
 * Core upload function used by all specialized upload functions
 */
export async function uploadFile(
  bucket: StorageBucket,
  file: File,
  options: UploadOptions = {}
): Promise<StorageResponse> {
  try {
    // Validate bucket exists
    if (!BUCKET_CONFIG[bucket]) {
      return {
        success: false,
        error: `Invalid bucket: ${bucket}`,
      };
    }

    const config = BUCKET_CONFIG[bucket];

    // Validate file size
    const sizeValidation = validateFileSize(file, config.maxSize);
    if (!sizeValidation.valid) {
      return { success: false, error: sizeValidation.error };
    }

    // Validate file type
    const typeValidation = validateFileType(file, config.allowedMimeTypes);
    if (!typeValidation.valid) {
      return { success: false, error: typeValidation.error };
    }

    // Get user ID if needed (for private buckets)
    let userId: string | null = null;
    if (!config.isPublic) {
      userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Must be authenticated to upload to this bucket" };
      }
    }

    // Prepare file
    let uploadFile = file;
    if (options.shouldResize && options.targetWidth && options.targetHeight) {
      const resizedBlob = await resizeImage(
        file,
        options.targetWidth,
        options.targetHeight,
        options.quality || 0.9
      );
      uploadFile = new File([resizedBlob], generateFileName(file.name), {
        type: "image/jpeg",
      });
    } else {
      uploadFile = new File([file], generateFileName(file.name), {
        type: options.contentType || file.type,
      });
    }

    // Build file path
    const folderPath = buildFolderPath(bucket, options.folder, userId);
    const filePath = buildFilePath(folderPath, uploadFile.name);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, uploadFile, {
      upsert: false,
      contentType: options.contentType || file.type,
    });

    if (error) {
      console.error(`Upload error for ${bucket}:`, error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    if (!data?.path) {
      return { success: false, error: "Upload successful but no path returned" };
    }

    // Get public or signed URL
    let url: string | undefined;
    let signedUrl: string | undefined;

    if (config.isPublic) {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      url = urlData?.publicUrl;
    } else {
      // Generate signed URL for private buckets (valid for 24 hours)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.path, 86400); // 24 hours

      if (!signedUrlError && signedUrlData) {
        signedUrl = signedUrlData.signedUrl;
      }
    }

    return {
      success: true,
      url: url || signedUrl,
      signedUrl,
      path: data.path,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`Upload error:`, message);
    return { success: false, error: message };
  }
}

// ============================================================================
// SPECIALIZED UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload banner image
 */
export async function uploadBanner(file: File, folder: string = "hero"): Promise<StorageResponse> {
  return uploadFile("banners", file, {
    folder,
    shouldResize: true,
    targetWidth: 1920,
    targetHeight: 900,
  });
}

/**
 * Upload product image
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  folder: string = "products"
): Promise<StorageResponse> {
  return uploadFile("products", file, {
    folder: `${folder}/${productId}`,
  });
}

/**
 * Upload category image/icon
 */
export async function uploadCategoryImage(
  file: File,
  categoryId: string
): Promise<StorageResponse> {
  return uploadFile("categories", file, {
    folder: categoryId,
  });
}

/**
 * Upload user profile picture
 */
export async function uploadProfilePicture(file: File): Promise<StorageResponse> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Must be authenticated" };
  }

  return uploadFile("profiles", file, {
    folder: userId,
    shouldResize: true,
    targetWidth: 400,
    targetHeight: 400,
  });
}

/**
 * Upload B2B verification document
 */
export async function uploadBusinessProof(
  file: File,
  documentType: string = "verification"
): Promise<StorageResponse> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Must be authenticated" };
  }

  return uploadFile("business_proofs", file, {
    folder: `${userId}/${documentType}`,
  });
}

// ============================================================================
// URL GENERATION FUNCTIONS
// ============================================================================

/**
 * Get public URL for files in public buckets
 */
export function getPublicUrl(bucket: StorageBucket, filePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Get signed URL for files in private buckets
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  filePath: string,
  expiresIn: number = 86400 // 24 hours default
): Promise<{ signedUrl: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      return { signedUrl: null, error: error.message };
    }

    return { signedUrl: data?.signedUrl || null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { signedUrl: null, error: message };
  }
}

/**
 * Get signed URLs for multiple files
 */
export async function getSignedUrls(
  bucket: StorageBucket,
  filePaths: string[],
  expiresIn: number = 86400
): Promise<StorageFile[]> {
  const results = await Promise.all(
    filePaths.map(async (filePath) => {
      const { signedUrl, error } = await getSignedUrl(bucket, filePath, expiresIn);
      return {
        name: filePath.split("/").pop() || filePath,
        url: "",
        signedUrl: signedUrl || undefined,
        metadata: { error },
      };
    })
  );

  return results;
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: StorageBucket, filePath: string): Promise<StorageResponse> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, path: filePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Delete multiple files
 */
export async function deleteFiles(
  bucket: StorageBucket,
  filePaths: string[]
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove(filePaths);

    if (error) {
      return { success: false, deletedCount: 0, error: error.message };
    }

    return { success: true, deletedCount: filePaths.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, deletedCount: 0, error: message };
  }
}

/**
 * Delete all files in a folder
 */
export async function deleteFolderContents(
  bucket: StorageBucket,
  folderPath: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const { data, error: listError } = await supabase.storage
      .from(bucket)
      .list(folderPath, { limit: 10000 });

    if (listError) {
      return { success: false, deletedCount: 0, error: listError.message };
    }

    if (!data || data.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const filePaths = data.map((file) => `${folderPath}/${file.name}`);
    const { error: deleteError } = await supabase.storage.from(bucket).remove(filePaths);

    if (deleteError) {
      return { success: false, deletedCount: 0, error: deleteError.message };
    }

    return { success: true, deletedCount: filePaths.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, deletedCount: 0, error: message };
  }
}

/**
 * Delete old files from a folder (keeping only N most recent)
 */
export async function deleteOldFiles(
  bucket: StorageBucket,
  folderPath: string,
  keepCount: number = 3
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const { data, error: listError } = await supabase.storage
      .from(bucket)
      .list(folderPath, { limit: 10000, sortBy: { column: "created_at", order: "desc" } });

    if (listError) {
      return { success: false, deletedCount: 0, error: listError.message };
    }

    if (!data || data.length <= keepCount) {
      return { success: true, deletedCount: 0 };
    }

    const filesToDelete = data.slice(keepCount).map((file) => `${folderPath}/${file.name}`);
    const { error: deleteError } = await supabase.storage.from(bucket).remove(filesToDelete);

    if (deleteError) {
      return { success: false, deletedCount: 0, error: deleteError.message };
    }

    return { success: true, deletedCount: filesToDelete.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, deletedCount: 0, error: message };
  }
}

// ============================================================================
// LIST FUNCTIONS
// ============================================================================

/**
 * List files in a bucket/folder
 */
export async function listFiles(
  bucket: StorageBucket,
  folderPath?: string,
  limit: number = 100
): Promise<{ files: StorageFile[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath, { limit, sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      return { files: [], error: error.message };
    }

    const files: StorageFile[] = (data || []).map((file) => {
      const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
      const url = getPublicUrl(bucket, filePath);

      return {
        name: file.name,
        url,
        metadata: {
          size: file.metadata?.size,
          mimetype: file.metadata?.mimetype,
          createdAt: file.created_at,
        },
      };
    });

    return { files };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { files: [], error: message };
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR COMMON OPERATIONS
// ============================================================================

/**
 * Replace a file (delete old, upload new)
 */
export async function replaceFile(
  bucket: StorageBucket,
  oldFilePath: string,
  newFile: File,
  options: UploadOptions = {}
): Promise<StorageResponse> {
  try {
    // Upload new file
    const uploadResult = await uploadFile(bucket, newFile, options);

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Delete old file
    await deleteFile(bucket, oldFilePath);

    return uploadResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Get bucket information and statistics
 */
export async function getBucketInfo(bucket: StorageBucket) {
  const config = BUCKET_CONFIG[bucket];
  return {
    bucket,
    ...config,
    maxSizeMB: config.maxSize / (1024 * 1024),
  };
}

/**
 * Validate if user has permission to access a file
 */
export async function canAccessFile(
  bucket: StorageBucket,
  filePath: string
): Promise<boolean> {
  try {
    // Public buckets are always accessible
    if (BUCKET_CONFIG[bucket].isPublic) {
      return true;
    }

    // For private buckets, check if file belongs to current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return false;
    }

    // File should be in user's folder
    return filePath.startsWith(`${userId}/`);
  } catch {
    return false;
  }
}
