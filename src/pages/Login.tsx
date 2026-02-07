import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronRight } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { EmailVerificationDialog } from "@/components/EmailVerificationDialog";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("loginPage.errors.email")),
        password: z.string().min(6, t("loginPage.errors.password")),
      }),
    [t]
  );

  useEffect(() => {
    if (user) {
      navigate("/profile");
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase env missing", { supabaseUrl, supabaseKeyPresent: !!supabaseKey });
      toast({
        title: "Configuration error",
        description: "Supabase environment variables are missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.info("Login submit", { email, supabaseUrl, keyPrefix: supabaseKey?.slice(0, 6) });
      const { error } = await signIn(email, password);
      if (error) {
        const lower = (error.message || "").toLowerCase();
        if (lower.includes("confirm")) {
          toast({
            title: t("loginPage.toast.loginFailed"),
            description: t("authPage.verification.note"),
            variant: "destructive",
          });
          setShowVerificationDialog(true);
        } else {
          toast({
            title: t("loginPage.toast.loginFailed"),
            description:
              error.message === "Invalid login credentials"
                ? t("loginPage.toast.invalidCreds")
                : error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t("loginPage.toast.welcome"),
          description: t("loginPage.toast.success"),
        });

        if (rememberMe) {
          localStorage.setItem("remembered_email", email);
        } else {
          localStorage.removeItem("remembered_email");
        }

        navigate("/profile");
      }
    } catch (err: any) {
      console.error("Login submit error:", err);
      toast({
        title: t("loginPage.toast.loginFailed"),
        description: err?.message || t("loginPage.toast.unexpected"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = () => {
    navigate("/cart");
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleSignup = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-lg shadow-gold overflow-hidden bg-card flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Karnataka Bangle Store logo"
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          <h1 className="text-3xl font-display font-bold text-primary mb-2">
            Karnataka Bangle Store
          </h1>
          <p className="text-muted-foreground">{t("loginPage.branding")}</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elegant border-0">
          <CardHeader className="space-y-2">
            <CardTitle className="font-display text-3xl">{t("loginPage.title")}</CardTitle>
            <CardDescription>{t("loginPage.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">
                  {t("loginPage.emailLabel")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("loginPage.emailPlaceholder")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  disabled={loading}
                  className="h-11 text-base"
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive flex items-center gap-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-medium">
                    {t("loginPage.passwordLabel")}
                  </Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {t("loginPage.forgot")}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("loginPage.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    disabled={loading}
                    className="h-11 text-base pr-10"
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? t("loginPage.aria.hidePassword") : t("loginPage.aria.showPassword")}
                  >
                    {showPassword ? t("loginPage.aria.hidePassword") : t("loginPage.aria.showPassword")}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive flex items-center gap-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border cursor-pointer"
                  disabled={loading}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  {t("loginPage.remember")}
                </Label>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold gradient-gold text-foreground shadow-gold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("loginPage.signingIn")}
                  </>
                ) : (
                  <>
                    {t("loginPage.signIn")}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Reset Password
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6">
              <Separator />
              <div className="flex justify-center -translate-y-3">
                <span className="bg-background px-2 text-xs text-muted-foreground font-medium">
                  {t("loginPage.or")}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="ghost"
                className="w-full h-11 font-medium"
                onClick={handleGuestCheckout}
              >
                {t("loginPage.guest")}
              </Button>
            </div>

            {/* Signup Link */}
            <div className="text-center pt-4 border-t">
              <p className="text-muted-foreground text-sm mb-3">
                {t("loginPage.noAccount")}
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 font-medium"
                onClick={handleSignup}
              >
                {t("loginPage.createAccount")}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      <EmailVerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        email={email}
      />
    </div>
  );
}
