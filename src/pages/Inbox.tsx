import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Package, CreditCard, Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateText } from "@/lib/liveTranslate";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  order_id?: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIcon = (type: string) => {
  if (type === "payment") return <CreditCard className="w-4 h-4 text-accent" />;
  if (type === "delivery") return <Package className="w-4 h-4 text-accent" />;
  if (type === "broadcast") return <Megaphone className="w-4 h-4 text-accent" />;
  return <CheckCircle className="w-4 h-4 text-accent" />;
};

export default function Inbox() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const [items, setItems] = useState<Array<Notification & { kind: "notification" | "broadcast" }>>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, { title: string; body: string }>>({});
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAll();
  }, [authLoading, user]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: notifications, error: notifError }, { data: broadcasts, error: bError }] = await Promise.all([
      supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("broadcasts").select("*").order("created_at", { ascending: false }),
    ]);

    if (notifError) toast({ title: t("inbox.toast.loadNotifications"), description: notifError.message, variant: "destructive" });
    if (bError) toast({ title: t("inbox.toast.loadBroadcasts"), description: bError.message, variant: "destructive" });

    const currentEmail = user?.email?.toLowerCase() || "";
    const currentId = user?.id?.toLowerCase() || "";

    const merged: Array<Notification & { kind: "notification" | "broadcast" }> = [];
    (notifications || []).forEach((n) => merged.push({ ...n, kind: "notification" }));

    (broadcasts || []).forEach((b: any) => {
      const audience = (b.audience || "all").toLowerCase();
      if (audience === "all") {
        merged.push({ ...b, kind: "broadcast", is_read: true });
      } else if (audience.startsWith("custom:")) {
        const targets = audience
          .replace("custom:", "")
          .split(",")
          .map((t: string) => t.trim().toLowerCase())
          .filter(Boolean);
        const match = targets.includes(currentEmail) || targets.includes(currentId);
        if (match) merged.push({ ...b, kind: "broadcast", is_read: true });
      } else {
        // retail/wholesale audiences are currently shown to all; adjust here if you have customer_type
        merged.push({ ...b, kind: "broadcast", is_read: true });
      }
    });
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(merged);
    setLoading(false);
  };

  // Translate message title/body whenever language or messages change
  useEffect(() => {
    const target = i18n.language || "en";
    if (!items.length) {
      setTranslations({});
      return;
    }

    let cancelled = false;
    const run = async () => {
      setTranslating(true);
      try {
        const pairs = await Promise.all(
          items.map(async (msg) => {
            const [title, body] = await Promise.all([
              translateText({ text: msg.title || "", target }),
              translateText({ text: msg.body || "", target }),
            ]);
            return [msg.id, { title, body }] as const;
          })
        );
        if (!cancelled) {
          setTranslations(Object.fromEntries(pairs));
        }
      } catch (err) {
        console.error("inbox translation failed", err);
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [items, i18n.language]);

  const markRead = async (id: string) => {
    setMarking(id);
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) {
      toast({ title: t("inbox.toast.updateFailed"), description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    }
    setMarking(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">{t("inbox.title")}</h1>
            <p className="text-muted-foreground">{t("inbox.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("inbox.refresh")}
          </Button>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>{t("inbox.notifications")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("inbox.loading")}
              </div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground">{t("inbox.empty")}</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`border rounded-lg p-3 flex items-start gap-3 ${
                    n.kind === "broadcast" || n.is_read ? "bg-card" : "bg-accent/5 border-accent/30"
                  }`}
                >
                  <div className="mt-1">{typeIcon(n.type || n.kind)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">
                        {translations[n.id]?.title || t(n.title, { defaultValue: n.title })}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {translations[n.id]?.body || t(n.body, { defaultValue: n.body })}
                      {translating && !translations[n.id] && " …"}
                    </p>
                    {n.order_id && (
                      <Button variant="link" size="sm" className="px-0" onClick={() => navigate(`/orders?order=${n.order_id}`)}>
                        {t("inbox.viewOrder")}
                      </Button>
                    )}
                  </div>
                  {n.kind === "notification" && !n.is_read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markRead(n.id)}
                      disabled={marking === n.id}
                    >
                      {marking === n.id ? t("inbox.marking") : t("inbox.markRead")}
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
