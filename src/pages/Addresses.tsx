import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Trash2, Edit2, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

type AddressId = string;

interface Address {
  id: AddressId;
  label?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  is_default?: boolean | null;
}

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Omit<Address, "id">>({
    label: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAddresses();
  }, [authLoading, user]);

  const fetchAddresses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("delivery_addresses")
      .select("id,label,phone,address_line1,address_line2,city,state,pincode,is_default")
      .eq("user_id", user!.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading addresses", description: error.message, variant: "destructive" });
    } else {
      setAddresses(data || []);
    }
    setLoading(false);
  };

  const hasAddresses = useMemo(() => addresses.length > 0, [addresses]);

  const resetForm = () => {
    setForm({
      label: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pincode: "",
      is_default: false,
    });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ["label", "phone", "address_line1", "city", "state", "pincode"] as const;
    for (const key of required) {
      if (!(form as any)[key]) {
        toast({ title: "Missing field", description: `Please enter ${key}.`, variant: "destructive" });
        return;
      }
    }
    if (form.pincode && form.pincode.length !== 6) {
      toast({ title: "Invalid pincode", description: "Pincode must be 6 digits.", variant: "destructive" });
      return;
    }

    const payload = { ...form, user_id: user!.id };

    if (editing) {
      const { error } = await supabase.from("delivery_addresses").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Address updated" });
    } else {
      const { error } = await supabase.from("delivery_addresses").insert(payload);
      if (error) {
        toast({ title: "Add failed", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Address added" });
    }

    if (form.is_default) {
      // ensure single default
      await supabase
        .from("delivery_addresses")
        .update({ is_default: false })
        .eq("user_id", user!.id)
        .neq("id", editing?.id || "");
    }

    resetForm();
    fetchAddresses();
  };

  const handleDelete = async (id: AddressId) => {
    const { error } = await supabase.from("delivery_addresses").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Address deleted" });
    fetchAddresses();
  };

  const handleDefault = async (id: AddressId) => {
    await supabase.from("delivery_addresses").update({ is_default: false }).eq("user_id", user!.id);
    const { error } = await supabase.from("delivery_addresses").update({ is_default: true }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Default address updated" });
    fetchAddresses();
  };

  const startEdit = (addr: Address) => {
    setEditing(addr);
    setForm({
      label: addr.label || "",
      phone: addr.phone || "",
      address_line1: addr.address_line1 || "",
      address_line2: addr.address_line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      is_default: !!addr.is_default,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        <Card className="shadow-elegant lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-xl">Your Addresses</CardTitle>
            <Badge variant="outline">{addresses.length} saved</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading addresses...
              </div>
            ) : !hasAddresses ? (
              <div className="text-center text-muted-foreground text-sm py-6">
                No addresses yet. Add your first delivery address.
              </div>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <p className="font-semibold">{addr.label || "Address"}</p>
                      {addr.is_default && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{addr.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      {addr.address_line1}
                      {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!addr.is_default && (
                      <Button variant="outline" size="sm" onClick={() => handleDefault(addr.id)}>
                        Make Default
                      </Button>
                    )}
                    <Button variant="outline" size="icon" onClick={() => startEdit(addr)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(addr.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-xl">{editing ? "Edit Address" : "Add Address"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <Label htmlFor="label">Label / Name</Label>
                <Input id="label" value={form.label || ""} onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone || ""} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="line1">Address Line 1</Label>
                <Input id="line1" value={form.address_line1 || ""} onChange={(e) => setForm((prev) => ({ ...prev, address_line1: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="line2">Address Line 2 (optional)</Label>
                <Input id="line2" value={form.address_line2 || ""} onChange={(e) => setForm((prev) => ({ ...prev, address_line2: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city || ""} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={form.state || ""} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" value={form.pincode || ""} onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))} required />
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editing ? "Update" : "Save"}
                </Button>
                {editing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
