import { useState, useEffect } from "react";
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
import { Loader2, Plus, Pencil, Trash2, Package, Settings, Image as ImageIcon, Share2, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ColorPickerInput } from "@/components/ColorPickerInput";
import { ImageUpload } from "@/components/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        toast({ title: "Access denied", description: "You don't have admin privileges.", variant: "destructive" });
        navigate("/");
      } else {
        fetchBangles();
        fetchSettings();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchBangles = async () => {
    const { data } = await supabase.from("bangles").select("*").order("created_at", { ascending: false });
    if (data) setBangles(data);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("settings").select("*").single();
    if (data) {
      setSocialLinks({
        instagram: data.instagram_link || "",
        facebook: data.facebook_link || "",
        twitter: data.twitter_link || "",
        email: data.email || "",
      });
      setWhatsappNumber(data.whatsapp_number || "");
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", image_url: "", available_sizes: DEFAULT_SIZES, available_colors: DEFAULT_COLORS, is_active: true });
    setEditingBangle(null);
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
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Missing fields", description: "Please fill in name and price.", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Store colors as JSON strings to preserve hex values
    const colorData = form.available_colors.map(c => JSON.stringify(c));

    const bangleData = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      image_url: form.image_url || null,
      available_sizes: form.available_sizes,
      available_colors: colorData,
      is_active: form.is_active,
    };

    const { error } = editingBangle
      ? await supabase.from("bangles").update(bangleData).eq("id", editingBangle.id)
      : await supabase.from("bangles").insert(bangleData);

    if (error) {
      toast({ title: "Error", description: `Failed to ${editingBangle ? "update" : "add"} bangle.`, variant: "destructive" });
    } else {
      toast({ title: `Bangle ${editingBangle ? "updated" : "added"} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchBangles();
    }
    setSaving(false);
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
      instagram_link: socialLinks.instagram,
      facebook_link: socialLinks.facebook,
      twitter_link: socialLinks.twitter,
      email: socialLinks.email,
      whatsapp_number: whatsappNumber,
    };

    try {
      const res = await supabase.from("settings").upsert(payload, { onConflict: "id", returning: "minimal" });
      if (res.error) {
        console.error("Supabase upsert error:", res.error);
        toast({ title: "Error saving settings", description: res.error.message || String(res.error), variant: "destructive" });
      } else {
        toast({ title: "Settings saved successfully" });
        fetchSettings();
      }
    } catch (err: any) {
      console.error("Unexpected error saving settings:", err);
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
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
          <TabsList className="grid w-full grid-cols-3 mb-8">
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
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Manage Products</h2>
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
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
                      aspectRatio="wide"
                    />
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
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">
                    Upload a banner image for the home page. Recommended size: 3000 × 600 px (5:1 aspect ratio)
                  </p>
                  <Button variant="outline" onClick={() => navigate("/admin/home-page")} className="gap-2 w-full">
                    <Pencil className="w-4 h-4" />
                    Manage Hero Slides
                  </Button>
                </div>
              </CardContent>
            </Card>
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
      </div>
    </div>
  );
}
