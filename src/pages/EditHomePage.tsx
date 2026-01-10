import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Image, GripVertical, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";

interface HeroSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

export default function EditHomePage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  const [form, setForm] = useState({
    image_url: "",
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
        fetchSlides();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchSlides = async () => {
    const { data } = await supabase
      .from("hero_slides")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setSlides(data);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ image_url: "", is_active: true });
    setEditingSlide(null);
  };

  const openEditDialog = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setForm({
      image_url: slide.image_url || "",
      is_active: slide.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);

    const slideData = {
      title: null,
      subtitle: null,
      image_url: form.image_url || null,
      is_active: form.is_active,
      display_order: editingSlide?.display_order ?? slides.length,
    };

    const { error } = editingSlide
      ? await supabase.from("hero_slides").update(slideData).eq("id", editingSlide.id)
      : await supabase.from("hero_slides").insert(slideData);

    if (error) {
      toast({ title: "Error", description: `Failed to ${editingSlide ? "update" : "add"} slide.`, variant: "destructive" });
    } else {
      toast({ title: `Slide ${editingSlide ? "updated" : "added"} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchSlides();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete slide.", variant: "destructive" });
    } else {
      toast({ title: "Slide deleted" });
      fetchSlides();
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newSlides = [...slides];
    [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
    await updateOrder(newSlides);
  };

  const handleMoveDown = async (index: number) => {
    if (index === slides.length - 1) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]];
    await updateOrder(newSlides);
  };

  const updateOrder = async (newSlides: HeroSlide[]) => {
    setSlides(newSlides);
    for (let i = 0; i < newSlides.length; i++) {
      await supabase.from("hero_slides").update({ display_order: i }).eq("id", newSlides[i].id);
    }
    toast({ title: "Order updated" });
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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Edit Hero Carousel</h1>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="ml-auto gap-2 gradient-gold text-foreground">
                <Plus className="w-4 h-4" />
                Add Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {editingSlide ? "Edit Slide" : "Add New Slide"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Background Image</Label>
                  <p className="text-xs text-muted-foreground mb-2">Required:  1920×600 pixels, 3:1 aspect ratio, max 5MB</p>
                  <ImageUpload
                    bucket="bangle-images"
                    folder="hero"
                    currentImageUrl={form.image_url || null}
                    onUpload={(url) => setForm({ ...form, image_url: url })}
                    onRemove={() => setForm({ ...form, image_url: "" })}
                    aspectRatio="wide"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label>Active (visible on home page)</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingSlide ? "Update Slide" : "Add Slide"}
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
              <Image className="w-5 h-5" />
              Hero Slides ({slides.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slides.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No slides added yet. The carousel will show product arrivals by default.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`p-4 rounded-lg border flex items-center gap-4 ${
                      slide.is_active ? "border-border" : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <GripVertical className="w-4 h-4 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === slides.length - 1}
                      >
                        <GripVertical className="w-4 h-4 rotate-90" />
                      </Button>
                    </div>
                    <div className="w-24 h-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                      {slide.image_url ? (
                        <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{slide.title}</h3>
                      {slide.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{slide.subtitle}</p>
                      )}
                      {!slide.is_active && (
                        <span className="text-xs text-destructive">(Inactive)</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(slide)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(slide.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
