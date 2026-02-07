import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* Large 404 with gradient */}
        <div className="mb-8">
          <div className="text-8xl md:text-9xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-pulse">
            404
          </div>
        </div>

        {/* Main message */}
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
          {t("notFound.title")}
        </h1>
        
        <p className="text-xl text-muted-foreground mb-2">
          {t("notFound.message")}
        </p>
        
        <p className="text-muted-foreground mb-8">
          Attempted path: <code className="bg-muted px-2 py-1 rounded text-sm">{location.pathname}</code>
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" />
              {t("notFound.goHome")}
            </Button>
          </Link>
          
          <Link to="/shop">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              <ShoppingBag className="w-4 h-4" />
              {t("notFound.continueShopping")}
            </Button>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="hidden sm:flex"
          >
            <Button size="lg" variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("notFound.goBack")}
            </Button>
          </button>
        </div>

        {/* Helpful suggestions */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-muted-foreground mb-4">{t("notFound.popularLinks")}:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/" className="text-primary hover:underline">{t("nav.home")}</Link>
            <span className="text-muted-foreground">/</span>
            <Link to="/shop" className="text-primary hover:underline">{t("nav.shop")}</Link>
            <span className="text-muted-foreground">/</span>
            <Link to="/contact" className="text-primary hover:underline">{t("nav.contact")}</Link>
            <span className="text-muted-foreground">/</span>
            <Link to="/auth" className="text-primary hover:underline">{t("auth.login")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
