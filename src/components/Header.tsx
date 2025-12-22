import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { User, ShoppingCart, LogOut, Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await supabase.from("settings").select("whatsapp_number").single();
        if (mounted && data && data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-gold rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-display font-bold text-primary">Karnataka Bangles Stores</h1>
              <p className="text-xs text-muted-foreground -mt-1">Premium Glass Bangles</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
              Home
            </Link>
            {user && (
              <Link to="/profile" className="text-foreground hover:text-primary transition-colors font-medium">
                My Profile
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="text-foreground hover:text-primary transition-colors font-medium">
                Admin
              </Link>
            )}
          </nav>

          {/* Auth Buttons & Cart */}
          <div className="hidden md:flex items-center gap-3">
            {whatsappNumber && (
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-secondary transition-colors text-green-600">
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
            <Link to="/cart" className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button className="gap-2 gradient-gold text-foreground border-0">
                  <User className="w-4 h-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button & Cart */}
          <div className="md:hidden flex items-center gap-2">
            {whatsappNumber && (
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="p-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </a>
            )}
            <Link to="/cart" className="relative p-2">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-3">
              <Link to="/" className="px-4 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              {user && (
                <Link to="/profile" className="px-4 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  My Profile
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="px-4 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </Link>
              )}
              {user ? (
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="px-4 py-2 text-left text-destructive hover:bg-secondary rounded-lg">
                  Logout
                </button>
              ) : (
                <Link to="/auth" className="px-4 py-2 text-primary font-medium hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  Login / Sign Up
                </Link>
              )}
              {whatsappNumber && (
                <a href={`https://wa.me/${whatsappNumber}`} className="px-4 py-2 text-foreground hover:bg-secondary rounded-lg" target="_blank" rel="noreferrer">Contact on WhatsApp</a>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}


