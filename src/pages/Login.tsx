import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingBag, Mail, Phone, ChevronRight } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/");
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

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Login failed",
          description:
            error.message === "Invalid login credentials"
              ? "Invalid email or password. Please try again."
              : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        
        if (rememberMe) {
          localStorage.setItem("remembered_email", email);
        } else {
          localStorage.removeItem("remembered_email");
        }
        
        navigate("/");
      }
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
          <div className="w-20 h-20 gradient-gold rounded-full flex items-center justify-center mx-auto mb-4 shadow-gold">
            <ShoppingBag className="w-10 h-10 text-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-primary mb-2">
            Karnataka Bangles Stores
          </h1>
          <p className="text-muted-foreground">Premium Glass Bangles - Wholesale & Retail</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elegant border-0">
          <CardHeader className="space-y-2">
            <CardTitle className="font-display text-3xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your wholesale account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="wholesale@example.com"
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
                    <span>⚠</span> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-medium">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive flex items-center gap-1">
                    <span>⚠</span> {errors.password}
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
                  Remember me
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6">
              <Separator />
              <div className="flex justify-center -translate-y-3">
                <span className="bg-background px-2 text-xs text-muted-foreground font-medium">
                  OR
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
              >
                <Mail className="w-4 h-4" />
                Sign in with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-2 font-medium"
                disabled={loading}
              >
                <Phone className="w-4 h-4" />
                Sign in with Phone
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full h-11 font-medium"
                onClick={handleGuestCheckout}
              >
                Continue as Guest
              </Button>
            </div>

            {/* Signup Link */}
            <div className="text-center pt-4 border-t">
              <p className="text-muted-foreground text-sm mb-3">
                Don't have an account?
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 font-medium"
                onClick={handleSignup}
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            💼 <strong>Wholesale Account?</strong> Contact our B2B team at
            <a href="mailto:wholesale@karnatakabanglesstores.in" className="underline ml-1">
              wholesale@karnatakabanglesstores.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
