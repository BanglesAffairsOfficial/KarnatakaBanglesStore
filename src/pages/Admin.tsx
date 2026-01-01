import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFormCache } from "@/hooks/useFormCache";
import { useUnsavedChangesWarning, useDetectChanges } from "@/hooks/useUnsavedChanges";
import { Loader2, Plus, Pencil, Trash2, Package, Settings, Image as ImageIcon, Share2, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ColorPickerInput } from "@/components/ColorPickerInput";
import { ImageUpload } from "@/components/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";

interface ColorItem {
  name: string;
  hex: string;
}

interface Bangle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available_sizes: string[];
  available_colors: string[];
  is_active: boolean;
}

const DEFAULT_SIZES = ["2.2", "2.4", "2.6", "2.8", "2.10"];
const DEFAULT_COLORS: ColorItem[] = [
  { name: "Red", hex: "#dc2626" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Green", hex: "#16a34a" },
  { name: "Lime", hex: "#65a30d" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Pink", hex: "#db2777" },
  { name: "Purple", hex: "#9333ea" },
];

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bangles, setBangles] = useState<Bangle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBangle, setEditingBangle] = useState<Bangle | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingDialogClose, setPendingDialogClose] = useState(false);

  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    facebook: "",
    twitter: "",
    email: "",
  });

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [savingSocial, setSavingSocial] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    available_sizes: DEFAULT_SIZES,
    available_colors: DEFAULT_COLORS,
    is_active: true,
  });
  const [categories, setCategories] = useState<Array<any>>([]);
  const [occasions, setOccasions] = useState<Array<any>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedOccasionIds, setSelectedOccasionIds] = useState<string[]>([]);
  const [initialForm, setInitialForm] = useState(form);
  const [initialSocialLinks, setInitialSocialLinks] = useState(socialLinks);

  // Form caching
  const { clearCache: clearFormCache } = useFormCache('admin_product_form', form, setForm, !editingBangle);
  const { clearCache: clearSocialCache } = useFormCache('admin_social_links', socialLinks, setSocialLinks, true);

  // Detect unsaved changes
  const formHasChanges = useDetectChanges(initialForm, form);
  const socialHasChanges = useDetectChanges(initialSocialLinks, socialLinks) || whatsappNumber !== (initialSocialLinks as any).whatsapp_number;
  const hasUnsavedChanges = formHasChanges || socialHasChanges || selectedCategoryId !== null;

  // Warn before leaving with unsaved changes
  useUnsavedChangesWarning(hasUnsavedChanges && dialogOpen);

  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

useEffect(() => {
  if (!authLoading) {
    if (!user) {
      navigate("/auth");
    } else if (!isAdmin) {
      toast({ title: "Access denied", description: "You don't have admin privileges.", variant: "destructive" });
      navigate("/");
    } else {
      fetchBangles();
      fetchCategories();
      fetchOccasions();
      
      // Only fetch settings once on initial load
      if (!hasLoadedSettings) {
        fetchSettings();
        setHasLoadedSettings(true);
      }
    }
  }
}, [user, isAdmin, authLoading, navigate, hasLoadedSettings]);

  const fetchCategories = async () => {
    const { data } = await (supabase as any).from("categories").select("*").order("display_order", { ascending: true });
    if (data) setCategories(data);
  };

  const fetchOccasions = async () => {
    const { data } = await (supabase as any).from("occasions").select("*").order("display_order", { ascending: true });
    if (data) setOccasions(data);
  };

  const fetchBangles = async () => {
    const { data } = await supabase.from("bangles").select("*").order("created_at", { ascending: false });
    if (data) setBangles(data);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await (supabase as any).from("settings").select("*").single();
    if (data) {
      const loadedLinks = {
        instagram: data.instagram_link || "",
        facebook: data.facebook_link || "",
        twitter: data.twitter_link || "",
        email: data.email || "",
      };
      
      setSocialLinks(loadedLinks);
      setWhatsappNumber(data.whatsapp_number || "");
      
      // Set initial values for comparison
      setInitialSocialLinks({
        ...loadedLinks,
        whatsapp_number: data.whatsapp_number || ""
      } as any);
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", image_url: "", available_sizes: DEFAULT_SIZES, available_colors: DEFAULT_COLORS, is_active: true });
    setInitialForm({ name: "", description: "", price: "", image_url: "", available_sizes: DEFAULT_SIZES, available_colors: DEFAULT_COLORS, is_active: true });
    setEditingBangle(null);
    setSelectedCategoryId(null);
    setSelectedOccasionIds([]);
    clearFormCache();
  };

  const openEditDialog = (bangle: Bangle) => {
    setEditingBangle(bangle);
    // Parse colors - try to extract hex if stored as JSON, otherwise use defaults
    let colors = DEFAULT_COLORS;
    try {
      if (bangle.available_colors && bangle.available_colors.length > 0) {
        const firstColor = bangle.available_colors[0];
        if (firstColor.includes("{")) {
          colors = bangle.available_colors.map(c => JSON.parse(c));
        } else {
          colors = bangle.available_colors.map(name => {
            const found = DEFAULT_COLORS.find(dc => dc.name === name);
            return found || { name, hex: "#888888" };
          });
        }
      }
    } catch { /* use defaults */ }
    
    setForm({
      name: bangle.name,
      description: bangle.description || "",
      price: bangle.price.toString(),
      image_url: bangle.image_url || "",
      available_sizes: bangle.available_sizes || DEFAULT_SIZES,
      available_colors: colors,
      is_active: bangle.is_active,
    });
    // set category if available
    // @ts-ignore
    setSelectedCategoryId((bangle as any).category_id || null);
    // fetch occasions for this bangle
    (async () => {
      const { data } = await (supabase as any).from("bangle_occasions").select("occasion_id").eq("bangle_id", bangle.id);
      if (data) setSelectedOccasionIds(data.map((d: any) => d.occasion_id));
    })();
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // FIXED: Get user properly from Supabase
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (import.meta.env.DEV) {
      console.log('=== AUTH DEBUG ===');
      console.log('Current User:', currentUser);
      console.log('User ID:', currentUser?.id);
      console.log('Auth Error:', authError);
    }
    
    if (!currentUser) {
      toast({ 
        title: "Not authenticated", 
        description: "Please log out and log back in.", 
        variant: "destructive" 
      });
      return;
    }

    // Test the has_role function - IMPORTANT: Use correct parameter names
    const { data: roleCheck, error: roleError } = await (supabase as any).rpc('has_role', { 
      u: currentUser.id, 
      r: 'admin' 
    });
    
    if (import.meta.env.DEV) {
      console.log('Role check result:', roleCheck);
      console.log('Role check error:', roleError);
    }
    
    if (!roleCheck) {
      toast({ 
        title: "Access denied", 
        description: "You don't have admin privileges.", 
        variant: "destructive" 
      });
      return;
    }

    if (!form.name || !form.price) {
      toast({ title: "Missing fields", description: "Please fill in name and price.", variant: "destructive" });
      return;
    }
    
    if (!selectedCategoryId) {
      toast({ title: "Missing category", description: "Please select a category for this product.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Prepare colors as array of objects with name and hex
      const colorData = form.available_colors.map(c => ({
        name: typeof c === 'string' ? c : c.name,
        hex: typeof c === 'object' ? c.hex : '#888888',
      }));

      // Prepare sizes
      const sizesArray = Array.isArray(form.available_sizes) 
        ? form.available_sizes.filter(s => s && typeof s === 'string')
        : [];

      // Prepare bangle data - match Supabase schema exactly
      const bangleData = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        price: Math.max(0, parseFloat(form.price) || 0),
        image_url: form.image_url?.trim() || null,
        available_sizes: sizesArray,
        available_colors: colorData,
        category_id: selectedCategoryId,
        is_active: form.is_active,
      };

      console.log("[Bangle] Prepared data:", JSON.stringify(bangleData, null, 2));
      console.log("[Bangle] Field details:", {
        name: { value: bangleData.name, type: typeof bangleData.name, length: bangleData.name?.length },
        price: { value: bangleData.price, type: typeof bangleData.price, isValid: !isNaN(bangleData.price) },
        category_id: { value: bangleData.category_id, type: typeof bangleData.category_id, isNull: !bangleData.category_id },
        available_sizes: { value: bangleData.available_sizes, isArray: Array.isArray(bangleData.available_sizes), length: bangleData.available_sizes?.length },
        available_colors: { value: bangleData.available_colors, isArray: Array.isArray(bangleData.available_colors), length: bangleData.available_colors?.length },
      });

      let productId = editingBangle?.id;
      if (editingBangle) {
        console.log("[Bangle] Updating bangle:", editingBangle.id);
        const { error } = await (supabase as any).from("bangles").update(bangleData).eq("id", editingBangle.id);
        if (error) {
          console.error("[Bangle] Update error:", error);
          throw error;
        }
      } else {
        console.log("[Bangle] Inserting new bangle...");
        try {
          const res = await (supabase as any).from("bangles").insert(bangleData).select("id").single();
          if (res.error) {
            console.error("[Bangle] Insert error response:", JSON.stringify(res.error, null, 2));
            throw res.error;
          }
          // @ts-ignore
          productId = res.data.id;
          console.log("[Bangle] New bangle created with ID:", productId);
        } catch (insertErr: any) {
          console.error("[Bangle] Insert exception:", insertErr);
          throw insertErr;
        }
      }

      // Manage bangle_occasions: remove existing and insert selected
      console.log("[Bangle] Managing occasions for bangle:", productId, selectedOccasionIds);
      await (supabase as any).from("bangle_occasions").delete().eq("bangle_id", productId);
      if (selectedOccasionIds && selectedOccasionIds.length > 0) {
        const inserts = selectedOccasionIds.map(occId => ({ bangle_id: productId, occasion_id: occId }));
        const { error: occError } = await (supabase as any).from("bangle_occasions").insert(inserts);
        if (occError) {
          console.error("[Bangle] Occasion insert error:", occError);
          throw occError;
        }
      }

      console.log("[Bangle] Successfully saved bangle");
      toast({ title: `Bangle ${editingBangle ? "updated" : "added"} successfully` });
      setInitialForm(form);
      clearFormCache();
      setDialogOpen(false);
      resetForm();
      fetchBangles();
      fetchCategories();
      fetchOccasions();
    } catch (err: any) {
      console.error("[Bangle] Save error:", err);
      
      // Enhanced error logging
      if (err?.status === 400) {
        console.error("[Bangle] 400 Bad Request Details:");
        console.error("  - Message:", err.message);
        console.error("  - Error:", err.error);
        console.error("  - Full response:", err);
        
        // Try to parse any additional error details
        if (typeof err.message === 'string' && err.message.includes('column')) {
          toast({
            title: "Schema Error",
            description: `${err.message}. Check that all column names match the database schema.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Invalid data format",
            description: `${err.message || 'Bad request to database'}. Open console (F12) to see details.`,
            variant: "destructive"
          });
        }
      } else {
        const errorMessage = err?.message || err?.hint || String(err);
        toast({ 
          title: "Failed to add bangle", 
          description: `${errorMessage}. Check browser console for details.`,
          variant: "destructive" 
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bangle?")) return;
    const { error } = await supabase.from("bangles").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete bangle.", variant: "destructive" });
    } else {
      toast({ title: "Bangle deleted" });
      fetchBangles();
    }
  };

  const toggleSize = (size: string) => {
    setForm(prev => ({
      ...prev,
      available_sizes: prev.available_sizes.includes(size)
        ? prev.available_sizes.filter(s => s !== size)
        : [...prev.available_sizes, size],
    }));
  };

  const toggleOccasion = (id: string) => {
    setSelectedOccasionIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSaveSocialLinks = async () => {
    setSavingSocial(true);
    const payload = {
      id: 1,
      instagram_link: socialLinks.instagram?.trim() || null,
      facebook_link: socialLinks.facebook?.trim() || null,
      twitter_link: socialLinks.twitter?.trim() || null,
      email: socialLinks.email?.trim() || null,
      whatsapp_number: whatsappNumber?.trim() || null,
    };

    try {
        console.log("[Settings] Saving payload:", payload);
      const res = await (supabase as any).from("settings").upsert(payload, { onConflict: "id" });
      
      console.log("[Settings] Upsert response:", res);
      if (res.error) {
        console.error("[Settings] Supabase upsert error:", res.error);
        const errorMsg = res.error?.message || res.error?.hint || String(res.error);
        toast({ 
          title: "Error saving settings", 
          description: `${errorMsg}. Please check browser console for details.`,
          variant: "destructive" 
        });
        return;
      }
      
      console.log("[Settings] Successfully saved:", res.data);
      setInitialSocialLinks({
        ...socialLinks,
        whatsapp_number: whatsappNumber
      } as any);
      clearSocialCache();
      toast({ 
        title: "Settings saved successfully",
        description: "Your social links and WhatsApp number have been updated."
      });
      // DON'T refetch - we already have the correct data
      // fetchSettings();
    } catch (err: any) {
      console.error("[Settings] Unexpected error:", err);
      toast({ 
        title: "Error", 
        description: err?.message || "Failed to save settings. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setSavingSocial(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Admin Panel</h1>
        
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="banner" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Banner
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="taxonomy" className="gap-2">
              <Settings className="w-4 h-4" />
              Taxonomy
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Manage Products</h2>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                if (!open && formHasChanges) {
                  setShowUnsavedDialog(true);
                  setPendingDialogClose(true);
                } else {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 gradient-gold text-foreground">
                  <Plus className="w-4 h-4" />
                  Add New Bangle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    {editingBangle ? "Edit Bangle" : "Add New Bangle"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bangle name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (₹) *</Label>
                      <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Product Image</Label>
                    <ImageUpload
                      bucket="bangle-images"
                      folder="products"
                      currentImageUrl={form.image_url || null}
                      onUpload={(url) => setForm({ ...form, image_url: url })}
                      onRemove={() => setForm({ ...form, image_url: "" })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <select
                      value={selectedCategoryId || ""}
                      onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    >
                      <option value="">-- Select category --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Occasions</Label>
                    <div className="flex flex-wrap gap-2">
                      {occasions.map(occ => (
                        <label key={occ.id} className="flex items-center gap-2 px-2 py-1 rounded-md border border-border cursor-pointer">
                          <Checkbox id={`occ-${occ.id}`} checked={selectedOccasionIds.includes(occ.id)} onCheckedChange={() => toggleOccasion(occ.id)} />
                          <span className="text-sm">{occ.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Available Sizes</Label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_SIZES.map(size => (
                        <button key={size} type="button" onClick={() => toggleSize(size)}
                          className={`px-3 py-1 rounded-full border transition-colors ${form.available_sizes.includes(size) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ColorPickerInput colors={form.available_colors} onChange={(colors) => setForm({ ...form, available_colors: colors })} />
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                    <Label>Active (visible to customers)</Label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingBangle ? "Update Bangle" : "Add Bangle"}
                    </Button>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  All Bangles ({bangles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bangles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No bangles added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bangles.map((bangle) => (
                      <div key={bangle.id} className={`p-4 rounded-lg border ${bangle.is_active ? "border-border" : "border-destructive/30 bg-destructive/5"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
                              {bangle.image_url ? (
                                <img src={bangle.image_url} alt={bangle.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{bangle.name}</h3>
                              <p className="text-accent font-bold">₹{Number(bangle.price)}</p>
                              <p className="text-xs text-muted-foreground">
                                {(bangle.available_sizes || []).length} sizes • {(bangle.available_colors || []).length} colors
                                {!bangle.is_active && <span className="ml-2 text-destructive">(Inactive)</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(bangle)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(bangle.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          // Replace the Banner Tab section (around line 530) with this updated version:

{/* Banner Tab */}
<TabsContent value="banner" className="space-y-4">
  <Card className="shadow-elegant">
    <CardHeader>
      <CardTitle className="font-display flex items-center gap-2">
        <ImageIcon className="w-5 h-5" />
        Hero Banner Management
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {/* Banner Size Guidelines */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            Recommended Banner Size
          </h3>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-md mb-4">
            <p className="text-3xl font-bold text-center text-blue-600 mb-2">
              1920 × 600 pixels
            </p>
            <p className="text-center text-sm text-muted-foreground">
              (Amazon-style responsive banner)
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <p className="text-sm">Works perfectly on desktop, tablet, and mobile devices</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <p className="text-sm">Industry standard e-commerce hero banner size</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <p className="text-sm">Single image adapts to all screen sizes automatically</p>
            </div>
          </div>
        </div>

        {/* Design Tips */}
        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <span>💡</span> Design Tips
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Safe Zone:</strong> Keep important content (text, products) in the center 60% of the image</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>File Format:</strong> Use JPG for photos (keep under 300KB for fast loading)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Focal Point:</strong> Place main subject in the center so it's visible on all devices</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Aspect Ratio:</strong> Maintain ~3:1 ratio (width to height)</span>
            </li>
          </ul>
        </div>

        {/* Size Comparison Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-semibold">Device</th>
                <th className="text-left p-3 font-semibold">Banner Height</th>
                <th className="text-left p-3 font-semibold">Display</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-3">📱 Mobile</td>
                <td className="p-3 font-mono">400px</td>
                <td className="p-3 text-muted-foreground">Auto-scaled from 1920×600</td>
              </tr>
              <tr>
                <td className="p-3">💻 Tablet</td>
                <td className="p-3 font-mono">500-600px</td>
                <td className="p-3 text-muted-foreground">Auto-scaled from 1920×600</td>
              </tr>
              <tr>
                <td className="p-3">🖥️ Desktop</td>
                <td className="p-3 font-mono">600-700px</td>
                <td className="p-3 text-muted-foreground">Full size 1920×600</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        <Button 
          variant="default" 
          onClick={() => navigate("/admin/home-page")} 
          className="gap-2 w-full gradient-gold text-foreground h-12 text-base"
        >
          <Pencil className="w-5 h-5" />
          Manage Hero Slides & Upload Banners
        </Button>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <p>Your banner uses CSS background-size: cover, which automatically adapts one image to all screen sizes</p>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>

          {/* Taxonomy Tab */}
          <TabsContent value="taxonomy" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input placeholder="New category name" value={(window as any).__newCatName || ""} onChange={(e) => (window as any).__newCatName = e.target.value} />
                      <Button onClick={async () => {
                        const name = (window as any).__newCatName;
                        if (!name) return toast({ title: 'Enter a name', variant: 'destructive' });
                        const { error } = await (supabase as any).from('categories').insert({ name });
                        if (error) return toast({ title: 'Error', description: error.message || String(error), variant: 'destructive' });
                        (window as any).__newCatName = '';
                        fetchCategories();
                        toast({ title: 'Category added' });
                      }}>Add</Button>
                    </div>
                    <div className="space-y-2">
                      {categories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div>{cat.name}</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={async () => {
                              const newName = prompt('Rename category', cat.name);
                              if (!newName) return;
                              const { error } = await (supabase as any).from('categories').update({ name: newName }).eq('id', cat.id);
                              if (error) return toast({ title: 'Error', description: error.message || String(error), variant: 'destructive' });
                              fetchCategories();
                              toast({ title: 'Category updated' });
                            }}>Rename</Button>
                            <Button size="sm" variant="ghost" onClick={async () => {
                              if (!confirm('Delete category?')) return;
                              const { error } = await (supabase as any).from('categories').delete().eq('id', cat.id);
                              if (error) return toast({ title: 'Error', description: error.message || String(error), variant: 'destructive' });
                              fetchCategories();
                              toast({ title: 'Category deleted' });
                            }} className="text-destructive">Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">Occasions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input placeholder="New occasion name" value={(window as any).__newOccName || ""} onChange={(e) => (window as any).__newOccName = e.target.value} />
                      <Button onClick={async () => {
                        const name = (window as any).__newOccName;
                        if (!name) return toast({ title: 'Enter a name', variant: 'destructive' });
                        const { error } = await (supabase as any).from('occasions').insert({ name });
                        if (error) return toast({ title: 'Error', description: error.message || String(error), variant: 'destructive' });
                        (window as any).__newOccName = '';
                        fetchOccasions();
                        toast({ title: 'Occasion added' });
                      }}>Add</Button>
                    </div>
                    <div className="space-y-2">
                      {occasions.map(occ => (
                        <div key={occ.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div>{occ.name}</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={async () => {
                              const newName = prompt('Rename occasion', occ.name);
                              if (!newName) return;
                              const { error } = await (supabase as any).from('occasions').update({ name: newName }).eq('id', occ.id);
                              if (error) return toast({ title: 'Error', description: error.message || String(error), variant: 'destructive' });
                              fetchOccasions();
                              toast({ title: 'Occasion updated' });
                            }}>Rename</Button>
                            <Button size="sm" variant="ghost" onClick={async () => {
                              if (!confirm('Delete occasion?')) return;
                              const { error } = await (supabase as any).from('occasions').delete().eq('id', occ.id);
                              if (error) return toast({ title: 'Error', description: error.message || String(error), variant: 'destructive' });
                              fetchOccasions();
                              toast({ title: 'Occasion deleted' });
                            }} className="text-destructive">Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Social Media Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Instagram Link</Label>
                  <Input 
                    value={socialLinks.instagram} 
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })} 
                    placeholder="https://instagram.com/your_account"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facebook Link</Label>
                  <Input 
                    value={socialLinks.facebook} 
                    onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })} 
                    placeholder="https://facebook.com/your_account"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Twitter Link</Label>
                  <Input 
                    value={socialLinks.twitter} 
                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })} 
                    placeholder="https://twitter.com/your_account"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    value={socialLinks.email} 
                    onChange={(e) => setSocialLinks({ ...socialLinks, email: e.target.value })} 
                    placeholder="contact@example.com"
                    type="email"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  WhatsApp Number
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>WhatsApp Number (with country code)</Label>
                  <Input 
                    value={whatsappNumber} 
                    onChange={(e) => setWhatsappNumber(e.target.value)} 
                    placeholder="919876543210"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: Country code (91 for India) + 10-digit number (e.g., 919876543210)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSaveSocialLinks} 
              disabled={savingSocial} 
              className="w-full gradient-gold text-foreground"
            >
              {savingSocial && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save All Settings
            </Button>
          </TabsContent>
        </Tabs>

        {/* Unsaved Changes Confirmation Dialog */}
        <UnsavedChangesDialog
          open={showUnsavedDialog}
          onSave={async () => {
            await handleSave();
            setShowUnsavedDialog(false);
            if (pendingDialogClose) {
              setDialogOpen(false);
              resetForm();
            }
          }}
          onDiscard={() => {
            setShowUnsavedDialog(false);
            resetForm();
            if (pendingDialogClose) {
              setDialogOpen(false);
            }
          }}
          onCancel={() => {
            setShowUnsavedDialog(false);
            setPendingDialogClose(false);
          }}
          title="Unsaved Changes"
          description="You have unsaved changes to this product. Would you like to save them before closing?"
        />
      </div>
    </div>
  );
}
