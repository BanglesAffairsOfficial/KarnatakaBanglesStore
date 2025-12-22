// Quick Diagnostic Script for "Failed to Add Bangle" Error
// Copy and paste this into browser console (F12) while on Admin Panel

(async () => {
  console.log("🔍 Starting Bangle Diagnostic Check...\n");

  // Import Supabase client
  const supabase = window.__supabase || null;
  
  if (!supabase) {
    console.error("❌ Supabase client not found. Make sure you're on the Admin page.");
    return;
  }

  // Check 1: Verify user is authenticated
  console.log("1️⃣ Checking authentication...");
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("❌ Not authenticated:", userError);
    return;
  }
  console.log("✅ Authenticated as:", user.email);

  // Check 2: Verify bangles table exists
  console.log("\n2️⃣ Checking bangles table...");
  const { data: bangles, error: banglesError } = await supabase.from('bangles').select('*').limit(1);
  if (banglesError && banglesError.code !== 'PGRST116') {
    console.error("❌ Error accessing bangles table:", banglesError);
    return;
  }
  console.log("✅ Bangles table accessible");
  console.log(`   Current bangles count: ${bangles?.length || 0}`);

  // Check 3: Verify categories table and has data
  console.log("\n3️⃣ Checking categories table...");
  const { data: categories, error: categoriesError } = await supabase.from('categories').select('*');
  if (categoriesError) {
    console.error("❌ Error accessing categories table:", categoriesError);
  } else {
    console.log(`✅ Categories table accessible with ${categories?.length || 0} categories`);
    if (categories && categories.length > 0) {
      console.log("   Sample categories:", categories.slice(0, 3).map(c => ({ id: c.id, name: c.name })));
    } else {
      console.warn("⚠️ WARNING: No categories found! You must create at least one category first.");
    }
  }

  // Check 4: Verify occasions table
  console.log("\n4️⃣ Checking occasions table...");
  const { data: occasions, error: occasionsError } = await supabase.from('occasions').select('*');
  if (occasionsError) {
    console.error("❌ Error accessing occasions table:", occasionsError);
  } else {
    console.log(`✅ Occasions table accessible with ${occasions?.length || 0} occasions`);
  }

  // Check 5: Verify bangle_occasions table
  console.log("\n5️⃣ Checking bangle_occasions table...");
  const { data: bangleOccasions, error: bangleOccError } = await supabase.from('bangle_occasions').select('*').limit(1);
  if (bangleOccError && bangleOccError.code !== 'PGRST116') {
    console.error("❌ Error accessing bangle_occasions table:", bangleOccError);
  } else {
    console.log("✅ Bangle_occasions table accessible");
  }

  // Check 6: Test INSERT permission with minimal row
  console.log("\n6️⃣ Testing INSERT permission on bangles...");
  const testRow = {
    name: `Test_${Date.now()}`,
    description: "Test description",
    price: 100,
    available_sizes: ['2.2'],
    available_colors: JSON.stringify([{ name: 'Red', hex: '#dc2626' }]),
    image_url: null,
    is_active: true,
    category_id: categories && categories.length > 0 ? categories[0].id : null,
  };
  
  if (!testRow.category_id) {
    console.warn("⚠️ CANNOT TEST: No category available. Create a category first in Admin → Taxonomy");
  } else {
    const { data: inserted, error: insertError } = await supabase.from('bangles').insert(testRow).select('id');
    
    if (insertError) {
      console.error("❌ INSERT failed:", insertError);
      console.error("   Payload was:", testRow);
    } else {
      console.log("✅ INSERT successful. Test bangle created with ID:", inserted?.[0]?.id);
      
      // Clean up: Delete the test row
      if (inserted && inserted[0]) {
        await supabase.from('bangles').delete().eq('id', inserted[0].id);
        console.log("   (Test row automatically deleted)");
      }
    }
  }

  // Check 7: Admin role verification
  console.log("\n7️⃣ Checking admin role...");
  const { data: roleCheck, error: roleError } = await supabase.rpc('has_role', { 
    _user_id: user.id, 
    _role: 'admin' 
  });
  
  if (roleError) {
    console.error("❌ Error checking role:", roleError);
  } else if (!roleCheck) {
    console.error("❌ User is NOT an admin!");
  } else {
    console.log("✅ User has admin role");
  }

  console.log("\n✅ Diagnostic complete!");
  console.log("\n📋 Summary:");
  console.log("- If all checks are ✅, try refreshing the page and adding a bangle again");
  console.log("- If ⚠️ warnings appear, follow the instructions");
  console.log("- If ❌ errors appear, check the detailed error messages above");
})();
