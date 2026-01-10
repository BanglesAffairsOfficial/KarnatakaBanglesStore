import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface CustomerRow {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminCustomers() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate("/auth");
      return;
    }
    fetchCustomers();
  }, [authLoading, isAdmin, navigate]);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("profiles")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });
    if (data) setRows(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">Admin Customers</h1>
          <Button variant="outline" size="sm" onClick={fetchCustomers} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Refresh
          </Button>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground">No customers yet.</p>
            ) : (
              <div className="space-y-3">
                {rows.map((r) => (
                  <div key={r.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-s  emibold">{r.email || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="link" className="px-0">
                      View
                    </Button>
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
