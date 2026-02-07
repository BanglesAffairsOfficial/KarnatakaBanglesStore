import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { EmailVerificationDialog } from "@/components/EmailVerificationDialog";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [businessLink, setBusinessLink] = useState("");
  const applyB2B = true; // always capture a B2B request on signup
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const gstRegex = /^[0-9A-Z]{15}$/i;
  const isValidUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const baseSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("authPage.errors.email")),
        password: z.string().min(6, t("authPage.errors.password")),
        fullName: z.string().min(2, t("authPage.errors.fullName")).optional(),
        phone: z.string().optional(),
        confirmPassword: z.string().optional(),
      }),
    [t]
  );

  useEffect(() => {
    if (user) {
      navigate("/profile");
    }
    if (import.meta.env.DEV) {
      console.info("Auth page mounted", {
        supabaseUrl: supabaseUrl || "MISSING",
        supabaseKeyPrefix: supabaseKey?.slice(0, 6) || "MISSING",
      });
    }
  }, [user, navigate, supabaseKey, supabaseUrl]);

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
      if (!shopName || shopName.trim().length < 2) {
        newErrors.shopName = "Shop name is required";
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = t("authPage.errors.confirmPassword");
      }
      if (!phone || phone.trim().length < 8) {
        newErrors.phone = "Phone / WhatsApp number is required";
      }
      if (gstNumber && !gstRegex.test(gstNumber.trim())) {
        newErrors.gstNumber = "GST number must be 15 characters (letters/numbers).";
      }
      if (businessLink && businessLink.trim() && !isValidUrl(businessLink.trim())) {
        newErrors.businessLink = "Enter a valid link starting with http:// or https://.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.info("HANDLE SUBMIT FIRED");

    const payload = {
      email: email.trim(),
      password,
      fullName: isLogin ? undefined : fullName?.trim(),
      phone: isLogin ? undefined : phone.trim(),
      shopName: isLogin ? undefined : shopName.trim(),
      gstNumber: isLogin ? undefined : gstNumber.trim(),
      businessLink: isLogin ? undefined : businessLink.trim(),
      confirmPassword: isLogin ? undefined : confirmPassword,
    };

    const isValid = (() => {
      const newErrors: Record<string, string> = {};

      try {
        baseSchema.parse(payload);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            if (err.path[0]) newErrors[err.path[0] as string] = err.message;
          });
        }
      }

      if (!isLogin) {
        if (!payload.fullName || payload.fullName.length < 2) {
          newErrors.fullName = t("authPage.errors.fullName");
        }
        if (!payload.shopName || payload.shopName.trim().length < 2) {
          newErrors.shopName = "Shop name is required";
        }
        if (payload.password !== payload.confirmPassword) {
          newErrors.confirmPassword = t("authPage.errors.confirmPassword");
        }
        if (!payload.phone || payload.phone.length < 8) {
          newErrors.phone = "Phone / WhatsApp number is required";
        }
        if (payload.gstNumber && !gstRegex.test(payload.gstNumber)) {
          newErrors.gstNumber = "GST number must be 15 characters (letters/numbers).";
        }
        if (payload.businessLink && payload.businessLink.trim() && !isValidUrl(payload.businessLink.trim())) {
          newErrors.businessLink = "Enter a valid link starting with http:// or https://.";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    })();
    console.info("Validate result", { isValid, errors });
    if (!isValid) {
      toast({
        title: "Invalid form",
        description: "Please check email/password and try again.",
        variant: "destructive",
      });
      return;
    }

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
      if (isLogin) {
        console.info("Auth submit", { email, supabaseUrl, keyPrefix: supabaseKey?.slice(0, 6) });
        const { error } = await signIn(email, password);
        if (error) {
          const lower = (error.message || "").toLowerCase();
          if (lower.includes("confirm")) {
            toast({
              title: t("authPage.toast.loginFailed"),
              description: t("authPage.verification.note"),
              variant: "destructive",
            });
            setShowVerificationDialog(true);
          } else {
            toast({
              title: t("authPage.toast.loginFailed"),
              description: error.message === "Invalid login credentials"
                ? t("authPage.toast.invalidCreds")
                : error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: t("authPage.toast.welcome"),
            description: t("authPage.toast.success"),
          });
          navigate("/profile");
        }
      } else {
        const { error, userId } = await signUp(
          email,
          password,
          fullName,
          phone,
          shopName,
          gstNumber,
          businessLink
        );
        if (error) {
          const lower = (error.message || "").toLowerCase();
          toast({
            title: t("authPage.toast.signupFailed"),
            description: lower.includes("rate limit")
              ? "Too many signup emails were sent. Please wait a few minutes and try again."
              : error.message.includes("already registered")
              ? t("authPage.toast.emailExists")
              : error.message,
            variant: "destructive",
          });
        } else {
          // Capture B2B intent for admin review
          if (userId) {
            try {
              await (supabase as any).from("b2b_requests").upsert({
                user_id: userId,
                email: email.trim(),
                full_name: fullName.trim(),
                phone: phone.trim(),
                shop_name: shopName.trim(),
                gst_number: gstNumber.trim() || null,
                business_link: businessLink.trim() || null,
                status: "pending",
              });
              await (supabase as any).from("notifications").insert({
                user_id: userId,
                title: "B2B verification pending",
                body: "Thanks! Our team will verify your wholesale account request soon.",
              });
            } catch (reqErr: any) {
              console.error("B2B request logging failed", reqErr);
              toast({
                title: "Signup noted",
                description: "Account created, but we could not log your B2B request automatically. Please contact support.",
              });
            }
          }

          setShowVerificationDialog(true);
          toast({
            title: "Signup successful",
            description: "Verify your email. We’ll review and approve B2B access after verification.",
          });
          navigate("/profile");
        }
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      toast({
        title: t("authPage.toast.loginFailed"),
        description: err?.message || t("authPage.toast.unexpected"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = () => {
    navigate("/cart");
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

              {/* Shop Name */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="shopName" className="font-medium">
                    Shop Name (required)
                  </Label>
                  <Input
                    id="shopName"
                    type="text"
                    placeholder="e.g. Shri Lakshmi Bangles"
                    value={shopName}
                    onChange={(e) => {
                      setShopName(e.target.value);
                      if (errors.shopName) setErrors({ ...errors, shopName: "" });
                    }}
                    disabled={loading}
                    className="h-11 text-base"
                    aria-describedby={errors.shopName ? "shopName-error" : undefined}
                  />
                  {errors.shopName && (
                    <p id="shopName-error" className="text-sm text-destructive flex items-center gap-1">
                      {errors.shopName}
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
                <Label htmlFor="password" className="font-medium">
                  {t("authPage.passwordLabel")}
                </Label>
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

              {/* Phone / WhatsApp */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-medium">
                    Phone / WhatsApp (required)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: "" });
                    }}
                    disabled={loading}
                    className="h-11 text-base"
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                  {errors.phone && (
                    <p id="phone-error" className="text-sm text-destructive flex items-center gap-1">
                      {errors.phone}
                    </p>
                  )}
                </div>
              )}

              {/* GST Number (Optional) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="gstNumber" className="font-medium">
                    GST Number (optional)
                  </Label>
                  <Input
                    id="gstNumber"
                    type="text"
                    placeholder="15-character GSTIN"
                    value={gstNumber}
                    onChange={(e) => {
                      setGstNumber(e.target.value.toUpperCase());
                      if (errors.gstNumber) setErrors({ ...errors, gstNumber: "" });
                    }}
                    disabled={loading}
                    className="h-11 text-base"
                    aria-describedby={errors.gstNumber ? "gstNumber-error" : undefined}
                  />
                  {errors.gstNumber && (
                    <p id="gstNumber-error" className="text-sm text-destructive flex items-center gap-1">
                      {errors.gstNumber}
                    </p>
                  )}
                </div>
              )}

              {/* Business Link */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="businessLink" className="font-medium">
                    Website or Social Link (optional)
                  </Label>
                  <Input
                    id="businessLink"
                    type="url"
                    placeholder="https://instagram.com/yourshop"
                    value={businessLink}
                    onChange={(e) => {
                      setBusinessLink(e.target.value);
                      if (errors.businessLink) setErrors({ ...errors, businessLink: "" });
                    }}
                    disabled={loading}
                    className="h-11 text-base"
                    aria-describedby={errors.businessLink ? "businessLink-error" : undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    If provided, link should match your GST/phone/email details.
                  </p>
                  {errors.businessLink && (
                    <p id="businessLink-error" className="text-sm text-destructive flex items-center gap-1">
                      {errors.businessLink}
                    </p>
                  )}
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Business proof upload is available after signup/login.
                  </p>
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

            <div className="space-y-3 mb-6">
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


