/**
 * Quick Bucket Setup for Karnataka Bangle Store
 * Creates the 3 existing buckets used in the application
 * 
 * Usage:
 *   export SUPABASE_URL=https://[project].supabase.co
 *   export SUPABASE_ADMIN_KEY=[service-role-key]
 *   node scripts/createBuckets.js
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_ADMIN_KEY;

if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY) {
  console.error("❌ Error: Missing SUPABASE_URL or SUPABASE_ADMIN_KEY");
  console.error("Set them using:");
  console.error("  export SUPABASE_URL=https://[project].supabase.co");
  console.error("  export SUPABASE_ADMIN_KEY=[service-role-key]");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY, {
  auth: { persistSession: false },
});

const BUCKETS = [
  {
    name: "bangle-images",
    public: true,
    fileSize: 10 * 1024 * 1024, // 10MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    description: "Product & admin images",
  },
  {
    name: "profile-pics",
    public: false,
    fileSize: 5 * 1024 * 1024, // 5MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    description: "User profile pictures",
  },
  {
    name: "b2b-verification",
    public: false,
    fileSize: 20 * 1024 * 1024, // 20MB
    mimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    description: "B2B verification documents",
  },
];

async function createBuckets() {
  console.log("🚀 Creating Storage Buckets\n");

  for (const bucket of BUCKETS) {
    try {
      console.log(`📦 Creating: ${bucket.name}`);
      console.log(`   Type: ${bucket.public ? "PUBLIC" : "PRIVATE"}`);
      console.log(`   Max size: ${bucket.fileSize / (1024 * 1024)}MB`);

      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSize,
        allowedMimeTypes: bucket.mimeTypes,
      });

      if (error) {
        if (error.message?.includes("already exists")) {
          console.log(`   ⚠️  Already exists\n`);
        } else {
          console.error(`   ❌ Error: ${error.message}\n`);
        }
      } else {
        console.log(`   ✅ Created\n`);
      }
    } catch (err) {
      console.error(`   ❌ Exception:`, err, "\n");
    }
  }

  // Verify buckets
  console.log("✓ Verifying buckets...\n");
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error("❌ Error listing buckets:", error.message);
  } else {
    const bucketsCreated = data.map((b) => b.name);
    for (const bucket of BUCKETS) {
      if (bucketsCreated.includes(bucket.name)) {
        console.log(`✅ ${bucket.name}`);
      } else {
        console.log(`❌ ${bucket.name} NOT FOUND`);
      }
    }
  }

  console.log("\n✅ Setup Complete!");
  console.log("\n📝 Next: Configure RLS policies in Supabase SQL Editor");
  console.log("   See: supabase/migrations/20260320000000_setup_storage_buckets.sql");
}

createBuckets();
