// Advanced Diagnostic Script for 400 Bad Request
// Paste this into browser console (F12) to debug the exact issue

(async () => {
  console.log("🔍 Advanced Bangle 400 Error Diagnostic\n");

  const supabase = window.__supabase || null;
  if (!supabase) {
    console.error("❌ Supabase not found");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("❌ Not authenticated");
    return;
  }

  // Get the actual table schema
  console.log("1️⃣ Fetching bangles table schema...");
  const { data: tableInfo, error: infoError } = await supabase
    .from('bangles')
    .select('*')
    .limit(1);

  if (infoError) {
    console.error("❌ Error fetching schema:", infoError);
  } else {
    console.log("✅ Got table info");
    
    // Try to create an introspection query
    try {
      const { data: columns, error: colError } = await supabase
        .rpc('query_columns', { table_name: 'bangles' })
        .catch(() => ({ data: null, error: "RPC not available" }));
      
      if (!colError && columns) {
        console.log("📋 Bangles table columns:");
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
      }
    } catch (e) {
      console.log("ℹ️ Column introspection not available, checking from sample data...");
    }
  }

  // Test with minimal payload
  console.log("\n2️⃣ Testing with minimal payload...");
  const minimalPayload = {
    name: `Test_${Date.now()}`,
    price: 100,
  };

  try {
    const res = await supabase.from('bangles').insert(minimalPayload);
    if (res.error) {
      console.error("❌ Minimal payload failed:", res.error);
      if (res.error.message.includes('column')) {
        console.log("  → Issue: Missing required column");
      } else if (res.error.message.includes('constraint')) {
        console.log("  → Issue: Constraint violation (likely missing required field)");
      }
    } else {
      console.log("✅ Minimal payload works!");
      await supabase.from('bangles').delete().eq('name', minimalPayload.name);
    }
  } catch (e) {
    console.error("❌ Exception:", e);
  }

  // Test with each field one by one
  console.log("\n3️⃣ Testing fields incrementally...");
  
  const fields = [
    { name: 'name', value: 'Test Bangle' },
    { name: 'price', value: 100 },
    { name: 'description', value: 'Test description' },
    { name: 'image_url', value: null },
    { name: 'available_sizes', value: ['2.2', '2.4'] },
    { name: 'available_colors', value: [{name: 'Red', hex: '#dc2626'}] },
    { name: 'is_active', value: true },
  ];

  let payload = { name: `Test_${Date.now()}` };

  for (const field of fields) {
    payload[field.name] = field.value;
    console.log(`\nTesting with field "${field.name}":`);
    console.log(`  Payload: ${JSON.stringify(payload)}`);

    try {
      const res = await supabase.from('bangles').insert(payload).select('id');
      if (res.error) {
        console.error(`  ❌ Failed: ${res.error.message}`);
        delete payload[field.name]; // Remove the failing field
      } else {
        console.log(`  ✅ Success`);
        if (res.data && res.data.length > 0) {
          await supabase.from('bangles').delete().eq('id', res.data[0].id);
        }
      }
    } catch (e) {
      console.error(`  ❌ Exception: ${e.message}`);
      delete payload[field.name];
    }
  }

  // Test with category_id
  console.log("\n4️⃣ Checking categories...");
  const { data: categories } = await supabase.from('categories').select('id').limit(1);
  
  if (categories && categories.length > 0) {
    console.log(`✅ Found category: ${categories[0].id}`);
    
    const testPayload = {
      name: `Test_${Date.now()}`,
      price: 100,
      category_id: categories[0].id,
    };

    console.log("\n5️⃣ Testing with category_id...");
    try {
      const res = await supabase.from('bangles').insert(testPayload);
      if (res.error) {
        console.error("❌ Failed with category:", res.error.message);
      } else {
        console.log("✅ Works with category!");
        await supabase.from('bangles').delete().eq('name', testPayload.name);
      }
    } catch (e) {
      console.error("❌ Exception:", e.message);
    }
  } else {
    console.warn("⚠️ No categories found");
  }

  console.log("\n✅ Diagnostic complete! Check above for which fields cause issues.");
})();
