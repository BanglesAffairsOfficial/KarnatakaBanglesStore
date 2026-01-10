import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Bangle {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
}

const getWishlistIds = () => {
  try {
    return JSON.parse(localStorage.getItem("wishlistIds") || "[]") as string[];
  } catch {
    return [];
  }
};

const setWishlistIds = (ids: string[]) => {
  localStorage.setItem("wishlistIds", JSON.stringify(ids));
};

export default function Wishlist() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Bangle[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    const ids = getWishlistIds();
    if (!ids.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await (supabase as any)
      .from("bangles")
      .select("id, name, image_url, price")
      .in("id", ids);
    setItems(data || []);
    setLoading(false);
  };

  const handleRemove = (id: string) => {
    const next = getWishlistIds().filter((x) => x !== id);
    setWishlistIds(next);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-4xl font-display font-bold mb-4">{t("wishlist.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("wishlist.subtitle")}</p>

        <Card className="shadow-elegant">
          <CardContent className="py-6">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">{t("wishlist.loading")}</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center space-y-4 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto opacity-60" />
                <p>{t("wishlist.empty")}</p>
                <Button onClick={() => navigate("/shop")} className="gradient-gold text-foreground">
                  {t("wishlist.browse")}
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg bg-secondary overflow-hidden flex items-center justify-center">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="notranslate font-semibold text-foreground line-clamp-1">{item.name}</p>
                      <p className="text-sm text-accent font-bold">₹{item.price}</p>
                      <div className="flex gap-2 mt-2">
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/product/${item.id}`)}>
                          {t("wishlist.view")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(item.id)}>
                          {t("wishlist.remove")}
                        </Button>
                      </div>
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
