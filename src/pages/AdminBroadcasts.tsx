import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Broadcast {
  id: string;
  title: string;
  body: string;
  audience: string;
  created_at: string;
}

export default function AdminBroadcasts() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [customTargets, setCustomTargets] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Broadcast[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate("/auth");
      return;
    }
    fetchBroadcasts();
  }, [authLoading, isAdmin]);

  const fetchBroadcasts = async () => {
    setListLoading(true);
    const { data, error } = await supabase
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast({ title: "Failed to load broadcasts", description: error.message, variant: "destructive" });
    } else {
      setList(data || []);
    }
    setListLoading(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Title and message required", variant: "destructive" });
      return;
    }
    if (audience === "custom" && !customTargets.trim()) {
      toast({ title: "Add recipients", description: "Please enter one or more user emails/IDs for custom audience.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const audienceValue = audience === "custom" ? `custom:${customTargets.trim()}` : audience;
    const { error } = await supabase.from("broadcasts").insert({
      title: title.trim(),
      body: body.trim(),
      audience: audienceValue,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to send broadcast", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Broadcast sent" });
    setTitle("");
    setBody("");
    setAudience("all");
    setCustomTargets("");
    fetchBroadcasts();
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this broadcast?");
    if (!confirmed) return;
    setDeletingId(id);
    const { error } = await supabase.from("broadcasts").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Broadcast deleted" });
    fetchBroadcasts();
  };

  const handleDeleteAll = async () => {
    const confirmed = window.confirm("Delete ALL broadcasts? This cannot be undone.");
    if (!confirmed) return;
    setDeletingId("ALL");
    const { error } = await supabase.from("broadcasts").delete().not("id", "is", null);
    setDeletingId(null);
    if (error) {
      toast({ title: "Failed to delete all", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "All broadcasts deleted" });
    fetchBroadcasts();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">Admin Broadcasts</h1>
          <Button variant="outline" size="sm" onClick={fetchBroadcasts} disabled={listLoading}>
            {listLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="destructive"
            size="sm"
            disabled={deletingId === "ALL"}
            onClick={handleDeleteAll}
          >
            {deletingId === "ALL" ? "Deleting..." : "Delete All"}
          </Button>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Send Broadcast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Payment update, delivery notice, etc." />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <textarea
                className="w-full border rounded-md px-3 py-2 min-h-[120px]"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Your message to all customers..."
              />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="custom">Custom (specific users)</SelectItem>
                </SelectContent>
              </Select>
              {audience === "custom" && (
                <div className="space-y-1">
                  <Label>Specific users (comma-separated emails or user IDs)</Label>
                  <Input
                    value={customTargets}
                    onChange={(e) => setCustomTargets(e.target.value)}
                    placeholder="email1@example.com, email2@example.com or user-id-1, user-id-2"
                  />
                  <p className="text-xs text-muted-foreground">These broadcasts will only show for the listed users.</p>
                </div>
              )}
            </div>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Broadcast
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Recent Broadcasts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {listLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : list.length === 0 ? (
              <p className="text-muted-foreground">No broadcasts yet.</p>
            ) : (
              list.map((b) => (
                <div key={b.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{b.title}</p>
                      <span className="text-xs text-muted-foreground capitalize">{b.audience}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={deletingId === b.id}
                      onClick={() => handleDelete(b.id)}
                    >
                      {deletingId === b.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{b.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
