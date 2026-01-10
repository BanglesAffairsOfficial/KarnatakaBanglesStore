import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { EmailVerificationDialog } from "@/components/EmailVerificationDialog";
import { z } from "zod";
import { useTranslation } from "react-i18next";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const baseSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("authPage.errors.email")),
        password: z.string().min(6, t("authPage.errors.password")),
        fullName: z.string().min(2, t("authPage.errors.fullName")).optional(),
        confirmPassword: z.string().optional(),
      }),
    [t]
  );

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    try {
      baseSchema.parse({ email, password, fullName, confirmPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
      }
    }

    if (!isLogin) {
      if (!fullName || fullName.length < 2) {
        newErrors.fullName = t("authPage.errors.fullName");
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = t("authPage.errors.confirmPassword");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t("authPage.toast.loginFailed"),
            description: error.message === "Invalid login credentials" 
              ? t("authPage.toast.invalidCreds")
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t("authPage.toast.welcome"),
            description: t("authPage.toast.success"),
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: t("authPage.toast.signupFailed"),
            description: error.message.includes("already registered")
              ? t("authPage.toast.emailExists")
              : error.message,
            variant: "destructive",
          });
        } else {
          setShowVerificationDialog(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = () => {
    navigate("/cart");
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({ title: t("authPage.toast.googleFailed"), description: error.message, variant: "destructive" });
    }
    setLoading(false);
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

        {/* Auth Card */}
        <Card className="shadow-elegant border-0">
          <CardHeader className="space-y-2">
            <CardTitle className="font-display text-3xl">
              {isLogin ? t("authPage.titleLogin") : t("authPage.titleSignup")}
            </CardTitle>
            <CardDescription>
              {isLogin ? t("authPage.subtitleLogin") : t("authPage.subtitleSignup")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-medium">
                    {t("authPage.fullNameLabel")}
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t("authPage.fullNamePlaceholder")}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: "" });
                    }}
                    disabled={loading}
                    className="h-11 text-base"
                    aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  />
                  {errors.fullName && (
                    <p id="fullName-error" className="text-sm text-destructive flex items-center gap-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">
                  {t("authPage.emailLabel")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("authPage.emailPlaceholder")}
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
                    {t("authPage.passwordLabel")}
                  </Label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {t("authPage.forgot")}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("authPage.passwordPlaceholder")}
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive flex items-center gap-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-medium">
                    {t("authPage.confirmLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("authPage.confirmPlaceholder")}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                      }}
                      disabled={loading}
                      className="h-11 text-base pr-10"
                      aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? t("loginPage.aria.hidePassword") : t("loginPage.aria.showPassword")}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p id="confirm-error" className="text-sm text-destructive flex items-center gap-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold gradient-gold text-foreground shadow-gold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? t("authPage.signingIn") : t("authPage.signingUp")}
                  </>
                ) : (
                  <>
                    {isLogin ? t("authPage.submitLogin") : t("authPage.submitSignup")}
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6">
              <Separator />
              <div className="flex justify-center -translate-y-3">
                <span className="bg-background px-2 text-xs text-muted-foreground font-medium">
                  {t("authPage.or")}
                </span>
              </div>
            </div>

            {/* Alternative Login Methods */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-2 font-medium"
                disabled={loading}
                onClick={handleGoogle}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("authPage.signingIn")}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    {t("authPage.google")}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full h-11 font-medium"
                onClick={handleGuestCheckout}
              >
                {t("authPage.guest")}
              </Button>
            </div>

            {/* Toggle */}
            <div className="text-center pt-4 border-t">
              <p className="text-muted-foreground text-sm mb-3">
                {isLogin ? t("authPage.noAccount") : t("authPage.haveAccount")}
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 font-medium"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
              >
                {isLogin ? t("authPage.toggleToSignup") : t("authPage.toggleToLogin")}
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
