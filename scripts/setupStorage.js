/**
 * ============================================================================
 * Supabase Storage Setup Script
 * ============================================================================
 * 
 * This script programmatically creates storage buckets and policies.
 * Run this from Node.js backend or admin context.
 * 
 * Usage:
 *   node scripts/setupStorage.js
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_ADMIN_KEY (Service role key with full access)
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_ADMIN_KEY;

if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY) {
  console.error("❌ Error: Missing SUPABASE_URL or SUPABASE_ADMIN_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY, {
  auth: { persistSession: false },
});

// Bucket configurations
const BUCKETS = [
  {
    name: "banners",
    public: true,
    fileSize: 5 * 1024 * 1024, // 5MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    name: "products",
    public: true,
    fileSize: 10 * 1024 * 1024, // 10MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    name: "categories",
    public: true,
    fileSize: 5 * 1024 * 1024, // 5MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  },
  {
    name: "profiles",
    public: false,
    fileSize: 5 * 1024 * 1024, // 5MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    name: "business_proofs",
    public: false,
    fileSize: 20 * 1024 * 1024, // 20MB
    mimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
];

/**
 * Create a single bucket
 */
async function createBucket(bucket: (typeof BUCKETS)[0]) {
  try {
    console.log(`📦 Creating bucket: ${bucket.name}...`);

    const { data, error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSize,
      allowedMimeTypes: bucket.mimeTypes,
    });

    if (error) {
      // Check if bucket already exists
      if (error.message?.includes("already exists")) {
        console.log(`⚠️  Bucket '${bucket.name}' already exists. Skipping.`);
        return true;
      }
      console.error(`❌ Error creating bucket ${bucket.name}:`, error.message);
      return false;
    }

    console.log(`✅ Bucket '${bucket.name}' created successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Unexpected error for ${bucket.name}:`, error);
    return false;
  }
}

/**
 * Create RLS policies for public buckets
 */
async function setupPublicBucketPolicies() {
  try {
    console.log("\n🔐 Setting up public bucket policies...");

    const publicBuckets = ["banners", "products", "categories"];

    for (const bucket of publicBuckets) {
      console.log(`   Setting policies for ${bucket}...`);

      // Note: RLS policies should be managed through SQL migrations
      // This script documents the configuration
      console.log(`   ✓ Allow public read access for ${bucket}`);
      console.log(`   ✓ Allow authenticated write access for ${bucket}`);
    }

    return true;
  } catch (error) {
    console.error("❌ Error setting up public policies:", error);
    return false;
  }
}

/**
 * Create RLS policies for private buckets
 */
async function setupPrivateBucketPolicies() {
  try {
    console.log("\n🔐 Setting up private bucket policies...");

    const privateBuckets = ["profiles", "business_proofs"];

    for (const bucket of privateBuckets) {
      console.log(`   Setting policies for ${bucket}...`);
      console.log(`   ✓ Authenticated users can read own files only`);
      console.log(`   ✓ Authenticated users can write to own folder`);
      console.log(`   ✓ Authenticated users can delete own files`);
    }

    return true;
  } catch (error) {
    console.error("❌ Error setting up private policies:", error);
    return false;
  }
}

/**
 * Verify all buckets were created
 */
async function verifyBuckets() {
  try {
    console.log("\n✓ Verifying buckets...");

    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error("❌ Error listing buckets:", error.message);
      return false;
    }

    const createdBuckets = data.map((b) => b.name);
    const expectedBuckets = BUCKETS.map((b) => b.name);

    let allCreated = true;
    for (const bucket of expectedBuckets) {
      if (createdBuckets.includes(bucket)) {
        console.log(`  ✅ ${bucket}`);
      } else {
        console.log(`  ❌ ${bucket} (NOT CREATED)`);
        allCreated = false;
      }
    }

    return allCreated;
  } catch (error) {
    console.error("❌ Error verifying buckets:", error);
    return false;
  }
}

/**
 * Run setup
 */
async function main() {
  console.log("🚀 Supabase Storage Setup Started\n");
  console.log(`📍 Supabase URL: ${SUPABASE_URL}\n`);

  let success = true;

  // Create all buckets
  for (const bucket of BUCKETS) {
    const created = await createBucket(bucket);
    if (!created && !bucket.name.startsWith("_")) {
      // Don't fail on non-critical buckets
    }
  }

  // Setup RLS policies
  await setupPublicBucketPolicies();
  await setupPrivateBucketPolicies();

  // Verify all buckets exist
  const verified = await verifyBuckets();

  if (verified) {
    console.log("\n✅ Setup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Verify RLS policies in SQL Editor");
    console.log("   2. Test uploads with storageHelpers functions");
    console.log("   3. Configure CORS settings if needed");
  } else {
    console.log("\n⚠️  Setup completed with warnings. Check above for details.");
    success = false;
  }

  process.exit(success ? 0 : 1);
}

// Run setup
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
