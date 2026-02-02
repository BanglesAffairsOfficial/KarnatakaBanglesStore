import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { User, ShoppingCart, LogOut, Menu, X, Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { B2BBanner } from "@/components/B2BBanner";

export function Header() {
  const { user, isAdmin, signOut, unreadNotifications = 0, clearUnread } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const location = useLocation();
  const { i18n, t } = useTranslation();
  // Treat root and common home aliases as "home"
  const isHome = /^\/($|home|index)/i.test(location.pathname);
  const languages = useMemo(
    () => [
      { code: "en", label: "English" },
      { code: "hi", label: "Hindi" },
      { code: "ta", label: "Tamil" },
      { code: "te", label: "Telugu" },
      { code: "ml", label: "Malayalam" },
      { code: "mr", label: "Marathi" },
      { code: "bn", label: "Bengali" },
      { code: "gu", label: "Gujarati" },
      { code: "kn", label: "Kannada" },
      { code: "pa", label: "Punjabi" },
    ],
    []
  );

  const filteredLanguages = useMemo(
    () =>
      languages.filter((lang) =>
        lang.label.toLowerCase().includes(search.toLowerCase())
      ),
    [languages, search]
  );

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("preferred_language", code);
  };

  const unreadCount = unreadNotifications || 0;
  const hasUnreadNotifications = unreadCount > 0;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
      <B2BBanner />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Changed to square */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Online Bangles Site" className="w-9 h-9 sm:w-10 sm:h-10 object-cover shadow-sm" />
            <div className="block">
              <h1 className="text-sm sm:text-lg font-display font-bold text-primary leading-tight">Online Bangles Site</h1>
              <p className="text-[9px] sm:text-xs text-muted-foreground -mt-0.5">{t("header.tagline")}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
              {t("nav.home")}
            </Link>
            <Link to="/shop" className="text-foreground hover:text-primary transition-colors font-medium">
              {t("nav.shop")}
            </Link>
            <Link to="/faq" className="text-foreground hover:text-primary transition-colors font-medium">
              {t("nav.faq")}
            </Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors font-medium">
              {t("nav.contact")}
            </Link>
            {user && (
              <>
                <Link to="/orders" className="text-foreground hover:text-primary transition-colors font-medium">
                  {t("nav.orders")}
                </Link>
                <Link to="/wishlist" className="text-foreground hover:text-primary transition-colors font-medium">
                  {t("nav.wishlist")}
                </Link>
                <Link to="/profile" className="text-foreground hover:text-primary transition-colors font-medium">
                  {t("nav.profile")}
                </Link>
              </>
            )}
            {isAdmin && (
              <Link to="/admin" className="text-foreground hover:text-primary transition-colors font-medium">
                {t("nav.admin")}
              </Link>
            )}
          </nav>

          {/* Auth Buttons, Cart, Translate */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <Link
                to="/inbox"
                className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
                onClick={() => clearUnread()}
              >
                <Bell className="w-5 h-5" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Link to="/cart" className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            {isHome && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{t("header.translate")}</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("header.searchLanguage")}
                  className="px-2 py-1 border border-border rounded-md bg-secondary text-sm"
                />
                <select
                  className="px-2 py-1 border border-border rounded-md bg-secondary text-sm"
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  value={i18n.language}
                >
                  <option value="" disabled>{t("header.selectLanguage")}</option>
                  {filteredLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>
            )}
            {user ? (
              <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                {t("auth.logout")}
              </Button>
            ) : (
              <Link to="/auth">
                <Button className="gap-2 gradient-gold text-foreground border-0">
                  <User className="w-4 h-4" />
                  {t("auth.login")}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button & Cart/Inbox */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Link to="/inbox" className="relative p-2" onClick={() => clearUnread()}>
                <Bell className="w-5 h-5" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Link to="/cart" className="relative p-2">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            {isHome && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{t("header.translate")}</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("header.searchLanguage")}
                  className="px-2 py-1 border border-border rounded-md bg-secondary text-sm"
                />
                <select
                  className="px-2 py-1 border border-border rounded-md bg-secondary text-sm"
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  value={i18n.language}
                >
                  <option value="" disabled>{t("header.selectLanguage")}</option>
                  {filteredLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>
            )}
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
          <div className="md:hidden py-3 border-t border-border bg-background/95 backdrop-blur-sm">
            <nav className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto text-sm px-2">
              <Link to="/" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.home")}
              </Link>
              {isHome ? (
                <>
                  <a href="#categories" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    {t("header.nav.categories")}
                  </a>
                  <a href="#featured" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    {t("header.nav.featured")}
                  </a>
                  <a href="#reviews" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    {t("header.nav.reviews")}
                  </a>
                  <a href="#contact" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    {t("header.nav.contact")}
                  </a>
                </>
              ) : (
                <>
                  <Link to="/shop" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    {t("nav.shop")}
                  </Link>
                  <Link to="/faq" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    {t("nav.faq")}
                  </Link>
                  <Link to="/contact" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    {t("nav.contact")}
                  </Link>
                </>
              )}
              {user && (
                <>
                  <Link to="/orders" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    {t("nav.orders")}
                  </Link>
                  <Link to="/wishlist" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    {t("nav.wishlist")}
                  </Link>
                  <Link to="/profile" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    {t("nav.profile")}
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" className="px-3 py-2 text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  {t("nav.admin")}
                </Link>
              )}
              {user ? (
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="px-3 py-2 text-left text-destructive hover:bg-secondary rounded-lg">
                  {t("auth.logout")}
                </button>
              ) : (
                <Link to="/auth" className="px-3 py-2 text-primary font-medium hover:bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  {t("auth.loginSignup")}
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
