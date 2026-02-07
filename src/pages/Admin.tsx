import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFormCache } from "@/hooks/useFormCache";
import { useUnsavedChangesWarning, useDetectChanges } from "@/hooks/useUnsavedChanges";
import { Loader2, Plus, Pencil, Trash2, Package, Settings, Image as ImageIcon, Share2, Phone, Video, Copy, Check, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { ColorPickerInput } from "@/components/ColorPickerInput";

interface ColorItem {
  name: string;
  hex: string;
  swatchImage?: string;
  active?: boolean;
}

interface Bangle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  retail_price?: number | null;
  image_url: string | null;
  secondary_image_url?: string | null;
  available_sizes: string[];
  available_colors: string[];
  is_active: boolean;
  number_of_stock?: number;
}

interface B2BRequest {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  shop_name: string | null;
  gst_number: string | null;
  business_link: string | null;
  business_proof_url: string | null;
  status: string | null;
  created_at: string;
}

const DEFAULT_SIZES = ["2.2", "2.4", "2.6", "2.8", "2.10"];
const DEFAULT_COLORS: ColorItem[] = [
  { name: "Red", hex: "#dc2626", active: true },
  { name: "Orange", hex: "#ea580c" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Green", hex: "#16a34a" },
  { name: "Lime", hex: "#65a30d" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Pink", hex: "#db2777" },
  { name: "Radium", hex: "#00c76a" },
  { name: "Wine", hex: "#722f37" },
  { name: "Jamuni", hex: "#5b2b6f" },
  { name: "Lavender", hex: "#c8b7e8" },
  { name: "Peacock", hex: "#0f4c5c" },
  { name: "Pista", hex: "#b5d99c" },
  { name: "Surf", hex: "#30aadd" },
  { name: "Sentro", hex: "#3ba99c" },
  { name: "Parrot", hex: "#80c904" },
  { name: "Strawberry", hex: "#e83f6f" },
  { name: "Mehendi", hex: "#7a9a01" },
  { name: "Gold", hex: "#f59e0b" },
  { name: "Carrot", hex: "#ed6a1f" },
  { name: "Onion", hex: "#b56576" },
  { name: "White", hex: "#f9fafb" },
  { name: "Grey", hex: "#9ca3af" },
  { name: "Rose Gold", hex: "#ff9500" },
  { name: "Rani", hex: "#c71585" },
  { name: "Navy Blue", hex: "#1d3557" },
  { name: "Kishmashi", hex: "#c9b164" },
  { name: "Dhaani", hex: "#b5ce5a" },
  { name: "C Green", hex: "#2e8b57" },
  { name: "Olive", hex: "#00ffbf" },
  { name: "Black", hex: "#1f2937" },
  { name: "Peach", hex: "#ffb07c" },
  { name: "Ferozi", hex: "#0fc7c7" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Dark multi color", hex: "#4b5563", swatchImage: "/DarkMulti.jpg", active: true },
  { name: "Light multi color", hex: "#e5e7eb", swatchImage: "/LightMulti.jpg", active: true },
];

export default function Admin() {
  const { user, isAdmin, loading: authLoading, roleChecked } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bangles, setBangles] = useState<Bangle[]>([]);
  const [loading, setLoading] = useState(true);
  const [b2bLoading, setB2bLoading] = useState(true);
  const [b2bRequests, setB2bRequests] = useState<B2BRequest[]>([]);
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
  const [reelCaption, setReelCaption] = useState("");
  const [reelCreator, setReelCreator] = useState("@karnatakabangles");
  const [reelUploading, setReelUploading] = useState(false);
  const [reelUrl, setReelUrl] = useState("");
  const [reelError, setReelError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const reelInputRef = useRef<HTMLInputElement | null>(null);
  const [reelSaving, setReelSaving] = useState(false);
  const [bulkStockValue, setBulkStockValue] = useState("999");
  const [bulkStockLoading, setBulkStockLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    retail_price: "",
    number_of_stock: "",
    image_url: "",
    secondary_image_url: "",
    available_sizes: DEFAULT_SIZES,
    available_colors: DEFAULT_COLORS,
    is_active: true,
  });
  
  const [categories, setCategories] = useState<Array<any>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState(form);
  const [initialSocialLinks, setInitialSocialLinks] = useState(socialLinks);

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    image_url: "",
    display_order: 0,
    is_active: true
  });
  const [searchTerm, setSearchTerm] = useState("");

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
    if (authLoading || !roleChecked) return;
    if (!user) {
      navigate("/auth");
    } else if (!isAdmin) {
      toast({ title: "Access denied", description: "You don't have admin privileges.", variant: "destructive" });
      navigate("/");
    } else {
      fetchBangles();
      fetchCategories();
      fetchB2bRequests();
      
      if (!hasLoadedSettings) {
        fetchSettings();
        setHasLoadedSettings(true);
      }
    }
  }, [user, isAdmin, authLoading, roleChecked, navigate, hasLoadedSettings]);

  const fetchCategories = async () => {
    const { data } = await (supabase as any).from("categories").select("*").order("display_order", { ascending: true });
    if (data) setCategories(data);
  };

  const fetchBangles = async () => {
    const { data } = await supabase.from("bangles").select("*").order("created_at", { ascending: false });
    if (data) setBangles(data);
    setLoading(false);
  };

  const fetchB2bRequests = async () => {
    setB2bLoading(true);
    const { data } = await (supabase as any)
      .from("b2b_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setB2bRequests(data);
    setB2bLoading(false);
  };

  const updateB2bStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await (supabase as any)
        .from("b2b_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      toast({ title: `B2B request ${status}` });
      fetchB2bRequests();
    } catch (err: any) {
      toast({
        title: "Failed to update status",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredBangles = bangles.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

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
      
      setInitialSocialLinks({
        ...loadedLinks,
        whatsapp_number: data.whatsapp_number || ""
      } as any);
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", retail_price: "", number_of_stock: "", image_url: "", secondary_image_url: "", available_sizes: DEFAULT_SIZES, available_colors: DEFAULT_COLORS, is_active: true });
    setInitialForm({ name: "", description: "", price: "", retail_price: "", number_of_stock: "", image_url: "", secondary_image_url: "", available_sizes: DEFAULT_SIZES, available_colors: DEFAULT_COLORS, is_active: true });
    setEditingBangle(null);
    setSelectedCategoryId(null);
    clearFormCache();
  };

  const openEditDialog = (bangle: Bangle) => {
    setEditingBangle(bangle);
    let colors = DEFAULT_COLORS;
    try {
      if (bangle.available_colors && bangle.available_colors.length > 0) {
        const firstColor = bangle.available_colors[0];

        // Case 1: already objects from DB
        if (typeof firstColor === "object" && firstColor !== null) {
          colors = (bangle.available_colors as any[]).map((c) => ({
            name: c.name ?? String(c),
            hex: c.hex ?? "#888888",
            swatchImage: c.swatchImage,
            active: c.active !== false,
          }));
        }
        // Case 2: stored as JSON strings
        else if (typeof firstColor === "string" && firstColor.includes("{")) {
          colors = (bangle.available_colors as string[]).map((c) => {
            const parsed = JSON.parse(c);
            return { ...parsed, active: parsed.active !== false };
          });
        }
        // Case 3: stored as plain color names
        else {
          colors = (bangle.available_colors as string[]).map((name) => {
            const found = DEFAULT_COLORS.find((dc) => dc.name === name);
            return found || { name, hex: "#888888", active: true };
          });
        }
      }
    } catch { /* use defaults */ }

    // Merge with defaults so every standard color is present (inactive if missing)
    const merged = new Map<string, any>();
    DEFAULT_COLORS.forEach((c) => merged.set(c.name.toLowerCase(), { ...c, active: false }));
    colors.forEach((c) => merged.set((c.name || "").toLowerCase(), { ...c, active: c.active !== false }));
    const mergedColors = Array.from(merged.values());
    
    setForm({
      name: bangle.name,
      description: bangle.description || "",
      price: bangle.price?.toString() || "",
      retail_price: ((bangle as any).retail_price ?? bangle.price ?? 0).toString(),
      number_of_stock: ((bangle as any).number_of_stock ?? 0).toString(),
      image_url: bangle.image_url || "",
      secondary_image_url: (bangle as any).secondary_image_url || (bangle as any).image_url_2 || "",
      available_sizes: bangle.available_sizes || DEFAULT_SIZES,
      available_colors: mergedColors,
      is_active: bangle.is_active,
    });
    setSelectedCategoryId((bangle as any).category_id || null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (!currentUser) {
      toast({ 
        title: "Not authenticated", 
        description: "Please log out and log back in.", 
        variant: "destructive" 
      });
      return;
    }

    const { data: roleCheck, error: roleError } = await (supabase as any).rpc('has_role', { 
      u: currentUser.id, 
      r: 'admin' 
    });
    
    if (!roleCheck) {
      toast({ 
        title: "Access denied", 
        description: "You don't have admin privileges.", 
        variant: "destructive" 
      });
      return;
    }

    if (!form.name || !form.price || !form.retail_price || !form.number_of_stock) {
      toast({ title: "Missing fields", description: "Please fill in name, wholesale price, retail price, and stock quantity.", variant: "destructive" });
      return;
    }
    
    if (!selectedCategoryId) {
      toast({ title: "Missing category", description: "Please select a category for this product.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const colorArray = Array.isArray(form.available_colors) ? form.available_colors : [];
      const colorData = colorArray.map(c => ({
        name: typeof c === 'string' ? c : c.name,
        hex: typeof c === 'object' ? (c as any).hex : '#888888',
        swatchImage: (c as any).swatchImage,
        active: (c as any).active !== false,
      }));

      const sizesArray = Array.isArray(form.available_sizes) 
        ? form.available_sizes.filter(s => s && typeof s === 'string')
        : [];

      const bangleData = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        price: Math.max(0, parseFloat(form.price) || 0), // treat as wholesale/base
        retail_price: Math.max(0, parseFloat(form.retail_price) || 0),
        number_of_stock: Math.max(0, parseInt(form.number_of_stock) || 0),
        image_url: form.image_url?.trim() || null,
        secondary_image_url: form.secondary_image_url?.trim() || null,
        available_sizes: sizesArray,
        available_colors: colorData,
        category_id: selectedCategoryId,
        is_active: form.is_active,
      };

      if (editingBangle) {
        const { error } = await (supabase as any).from("bangles").update(bangleData).eq("id", editingBangle.id);
        if (error) throw error;
      } else {
        const res = await (supabase as any).from("bangles").insert(bangleData).select("id").single();
        if (res.error) throw res.error;
      }

      toast({ title: `Bangle ${editingBangle ? "updated" : "added"} successfully` });
      setInitialForm(form);
      clearFormCache();
      setDialogOpen(false);
      resetForm();
      fetchBangles();
      fetchCategories();
    } catch (err: any) {
      console.error("[Bangle] Save error:", err);
      toast({ 
        title: "Failed to save bangle", 
        description: err?.message || "An error occurred",
        variant: "destructive" 
      });
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
      const res = await (supabase as any).from("settings").upsert(payload, { onConflict: "id" });
      
      if (res.error) {
        toast({ 
          title: "Error saving settings", 
          description: res.error?.message || String(res.error),
          variant: "destructive" 
        });
        return;
      }
      
      setInitialSocialLinks({
        ...socialLinks,
        whatsapp_number: whatsappNumber
      } as any);
      clearSocialCache();
      toast({ 
        title: "Settings saved successfully",
        description: "Your social links and WhatsApp number have been updated."
      });
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err?.message || "Failed to save settings.",
        variant: "destructive" 
      });
    } finally {
      setSavingSocial(false);
    }
  };

  const uploadReelToCloudinary = async (file: File) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
    if (!cloudName) throw new Error("Missing VITE_CLOUDINARY_CLOUD_NAME");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);
    formData.append("folder", "samples/ecommerce");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Upload failed");
    }
    return (await res.json()) as { secure_url: string };
  };

  const handleReelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReelError(null);
    setReelUploading(true);
    setCopied(false);
    try {
      const upload = await uploadReelToCloudinary(file);
      const url = upload.secure_url.replace("/upload/", "/upload/w_1080,h_1920,c_fill,q_auto,f_auto/");
      setReelUrl(url);
      setReelSaving(true);
      const payload = {
        video_url: url,
        caption: reelCaption?.trim() || file.name.replace(/\.[^.]+$/, ""),
        creator: reelCreator?.trim() || "@karnatakabangles",
        is_active: true,
        display_order: 0,
      };
      const res = await (supabase as any).from("reels").insert(payload);
      if (res.error) throw res.error;
      toast({ title: "Reel uploaded", description: "Saved to Supabase and will appear on the home page." });
    } catch (err: any) {
      setReelError(err?.message || "Upload failed");
      toast({ title: "Upload failed", description: err?.message || "Check preset/cloud name.", variant: "destructive" });
    } finally {
      setReelUploading(false);
      setReelSaving(false);
      if (reelInputRef.current) reelInputRef.current.value = "";
    }
  };

  const copyReelUrl = async () => {
    if (!reelUrl) return;
    await navigator.clipboard.writeText(reelUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFillAllStock = async () => {
    const targetValue = Math.max(0, parseInt(bulkStockValue, 10) || 0);
    if (!confirm(`Set stock for all bangles to ${targetValue}?`)) return;
    setBulkStockLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("bangles")
        .update({ number_of_stock: targetValue })
        .not("id", "is", null);
      if (error) throw error;
      toast({ title: "Stock updated", description: `All bangles set to ${targetValue}.` });
      fetchBangles();
    } catch (err: any) {
      toast({
        title: "Failed to update stock",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBulkStockLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({ title: "Missing name", description: "Please enter a category name.", variant: "destructive" });
      return;
    }

    try {
      const categoryData = {
        name: categoryForm.name.trim(),
        image_url: categoryForm.image_url?.trim() || null,
        display_order: categoryForm.display_order || categories.length,
        is_active: categoryForm.is_active
      };

      if (editingCategory) {
        const { error } = await (supabase as any).from("categories").update(categoryData).eq("id", editingCategory.id);
        if (error) throw error;
        toast({ title: "Category updated successfully" });
      } else {
        const { error } = await (supabase as any).from("categories").insert(categoryData);
        if (error) throw error;
        toast({ title: "Category added successfully" });
      }

      setCategoryDialogOpen(false);
      setCategoryForm({ name: "", image_url: "", display_order: 0, is_active: true });
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      toast({ 
        title: "Error saving category", 
        description: err?.message || "An error occurred",
        variant: "destructive" 
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Products in this category will need to be reassigned.")) return;
    const { error } = await (supabase as any).from("categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message || String(error), variant: "destructive" });
    } else {
      toast({ title: "Category deleted" });
      fetchCategories();
    }
  };

  const openEditCategoryDialog = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      image_url: category.image_url || "",
      display_order: category.display_order || 0,
      is_active: category.is_active ?? true
    });
    setCategoryDialogOpen(true);
  };

  if (authLoading || !roleChecked || loading) {
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
          <div className="flex flex-col gap-4 mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">Admin Panel</h1>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
                Open Admin Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/orders")}>
                Open Admin Orders
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/broadcasts")}>
                Admin Broadcasts
              </Button>
            </div>
          </div>
        
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-8">
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="b2b" className="gap-2">
              <Users className="w-4 h-4" />
              B2B Requests
            </TabsTrigger>
            <TabsTrigger value="reels" className="gap-2">
              <Video className="w-4 h-4" />
              Reels
            </TabsTrigger>
            <TabsTrigger value="banner" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Banner
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold">Manage Products</h2>
              <div className="flex items-center gap-3 w-full md:w-80">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search bangles by name"
                  className="w-full"
                />
                <Button variant="outline" onClick={() => setSearchTerm("")}>Clear</Button>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Input
                  type="number"
                  min="0"
                  value={bulkStockValue}
                  onChange={(e) => setBulkStockValue(e.target.value)}
                  placeholder="Stock value"
                  className="w-full md:w-32"
                />
                <Button
                  variant="secondary"
                  onClick={handleFillAllStock}
                  disabled={bulkStockLoading || loading || bangles.length === 0}
                  className="gap-2"
                >
                  {(bulkStockLoading || loading) && <Loader2 className="w-4 h-4 animate-spin" />}
                  Fill All Stock
                </Button>
              </div>
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
                        <Label>Wholesale Price (₹) *</Label>
                        <Input
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Retail Price (₹) *</Label>
                        <Input
                          type="number"
                          value={form.retail_price}
                          onChange={(e) => setForm({ ...form, retail_price: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock Quantity *</Label>
                        <Input
                          type="number"
                          value={form.number_of_stock}
                          onChange={(e) => setForm({ ...form, number_of_stock: e.target.value })}
                          placeholder="0"
                          min="0"
                        />
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
                      <Label>Secondary Image (optional)</Label>
                      <ImageUpload
                        bucket="bangle-images"
                        folder="products"
                        currentImageUrl={form.secondary_image_url || null}
                        onUpload={(url) => setForm({ ...form, secondary_image_url: url })}
                        onRemove={() => setForm({ ...form, secondary_image_url: "" })}
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            setEditingCategory(null);
                            setCategoryForm({ name: "", image_url: "", display_order: categories.length, is_active: true });
                            setCategoryDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          Add Category
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-2"
                          onClick={() => setCategoryDialogOpen(true)}
                        >
                          <Pencil className="w-4 h-4" />
                          Manage Categories
                        </Button>
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
                    <ColorPickerInput
                      colors={Array.isArray(form.available_colors) ? (form.available_colors as any) : []}
                      onChange={(colors) => setForm({ ...form, available_colors: colors })}
                    />
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                      <Label>In Stock (visible to customers)</Label>
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
                {filteredBangles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No bangles match your search.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBangles.map((bangle) => (
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
                              <p className="text-accent font-bold">
                                Wholesale: ₹{Number(bangle.price)} • Retail: ₹{Number((bangle as any).retail_price ?? bangle.price)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(bangle.available_sizes || []).length} sizes • {(bangle.available_colors || []).length} colors
                              </p>
                              <div className="mt-1">
                                {bangle.is_active ? (
                                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">In Stock</span>
                                ) : (
                                  <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded-full">Out of Stock</span>
                                )}
                              </div>
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

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Categories ({categories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">Manage categories used for products.</p>
                  <Button
                    size="sm"
                    className="gap-2 gradient-gold text-foreground"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: "", image_url: "", display_order: categories.length, is_active: true });
                      setCategoryDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Category
                  </Button>
                </div>
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No categories added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="p-4 rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
                              {cat.image_url ? (
                                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{cat.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                Order: {cat.display_order} • {cat.is_active ? "Active" : "Inactive"}
                              </p>
                              {!cat.image_url && (
                                <p className="text-xs text-muted-foreground">No image set — placeholder shown on home page</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditCategoryDialog(cat)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(cat.id)} className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
              setCategoryDialogOpen(open);
              if (!open) setEditingCategory(null);
            }}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Category Name *</Label>
                    <Input 
                      value={categoryForm.name} 
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                      placeholder="e.g., Wedding Bangles" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category Image (optional)</Label>
                    <p className="text-xs text-muted-foreground">If no image is set, a placeholder is shown on the home page.</p>
                    <ImageUpload
                      bucket="bangle-images"
                      folder="categories"
                      currentImageUrl={categoryForm.image_url || null}
                      onUpload={(url) => setCategoryForm({ ...categoryForm, image_url: url })}
                      onRemove={() => setCategoryForm({ ...categoryForm, image_url: "" })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input 
                      type="number" 
                      value={categoryForm.display_order} 
                      onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })} 
                      placeholder="0" 
                    />
                    <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={categoryForm.is_active}
                      onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
                    />
                    <Label>Active (visible on home page)</Label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveCategory} className="flex-1">
                      {editingCategory ? "Update Category" : "Add Category"}
                    </Button>
                    <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* B2B Requests Tab */}
          <TabsContent value="b2b" className="space-y-4">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  B2B Requests ({b2bRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {b2bLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading requests...
                  </div>
                ) : b2bRequests.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No B2B requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {b2bRequests.map((req) => (
                      <div key={req.id} className="p-4 rounded-lg border border-border">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-foreground">
                              {req.full_name || "Unnamed"}{" "}
                              <span className="text-xs text-muted-foreground">({req.status || "pending"})</span>
                            </h3>
                            <p className="text-sm text-muted-foreground">Email: {req.email || "—"}</p>
                            <p className="text-sm text-muted-foreground">Shop: {req.shop_name || "—"}</p>
                            <p className="text-sm text-muted-foreground">Phone: {req.phone || "—"}</p>
                            <p className="text-sm text-muted-foreground">GST: {req.gst_number || "—"}</p>
                            <p className="text-sm text-muted-foreground">
                              Link:{" "}
                              {req.business_link ? (
                                <a
                                  href={req.business_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline break-all"
                                >
                                  {req.business_link}
                                </a>
                              ) : (
                                "—"
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Submitted: {new Date(req.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="w-full max-w-sm">
                            {req.business_proof_url ? (
                              <a href={req.business_proof_url} target="_blank" rel="noreferrer">
                                <img
                                  src={req.business_proof_url}
                                  alt="Visiting card or shop board"
                                  className="w-full rounded-md border border-border object-cover"
                                  loading="lazy"
                                />
                              </a>
                            ) : (
                              <div className="w-full h-32 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                                No proof uploaded
                              </div>
                            )}
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                disabled={!req.business_proof_url || req.status === "approved"}
                                onClick={() => updateB2bStatus(req.id, "approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                disabled={req.status === "rejected"}
                                onClick={() => updateB2bStatus(req.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                            {!req.business_proof_url && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Upload required before approval.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reels Tab */}
          <TabsContent value="reels" className="space-y-4">
            <Card className="shadow-elegant">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="font-display flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Reels Upload (Cloudinary)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Uses unsigned preset <code>ml_default</code> (folder: samples/ecommerce). Uploaded reels are saved to Supabase and appear on the home page.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Caption (optional)</Label>
                    <Input value={reelCaption} onChange={(e) => setReelCaption(e.target.value)} placeholder="e.g., New Festive Drop" />
                  </div>
                  <div className="space-y-2">
                    <Label>Creator handle</Label>
                    <Input value={reelCreator} onChange={(e) => setReelCreator(e.target.value)} placeholder="@karnatakabangles" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Upload vertical video (9:16)</Label>
                  <Input
                    ref={reelInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleReelFileChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Requires VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET (unsigned) in .env.
                  </p>
                </div>
                {reelError && <p className="text-sm text-destructive">{reelError}</p>}
                <div className="flex items-center gap-2">
                  <Button disabled={!reelUrl} variant="outline" size="sm" onClick={copyReelUrl} className="gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy URL"}
                  </Button>
                  <span className="text-xs text-muted-foreground break-all">{reelUrl || "Upload to get a URL"}</span>
                </div>
                {reelUrl && (
                  <div className="aspect-[9/16] w-full max-w-xs rounded-xl overflow-hidden border">
                    <video src={reelUrl} controls className="w-full h-full object-cover" />
                    <div className="p-2 text-sm">
                      <p className="font-semibold">{reelCaption || "New Reel"}</p>
                      <p className="text-muted-foreground">{reelCreator}</p>
                    </div>
                  </div>
                )}
                <Button disabled={reelUploading || reelSaving} className="w-full gap-2" onClick={() => reelInputRef.current?.click()}>
                  {(reelUploading || reelSaving) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {reelUploading || reelSaving ? "Uploading..." : "Select & Upload Reel"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

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
                  </div>

                  <Button 
                    variant="default" 
                    onClick={() => navigate("/admin/home-page")} 
                    className="gap-2 w-full gradient-gold text-foreground h-12 text-base"
                  >
                    <Pencil className="w-5 h-5" />
                    Manage Hero Slides & Upload Banners
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            {/* Removed separate categories tab; categories managed above */}
            {/* Legacy categories tab UI retained for reference
            <CardHeader>
              <CardTitle className="font-display">All Categories ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {categories.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No categories added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="p-4 rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
                              {cat.image_url ? (
                                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{cat.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                Order: {cat.display_order} • {cat.is_active ? "Active" : "Inactive"}
                              </p>
                              {!cat.image_url && (
                                <p className="text-xs text-destructive">⚠ No image - won't appear on home page</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditCategoryDialog(cat)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(cat.id)} className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent> */}

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
