import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentSubmitted() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const { user } = useAuth();

  const method = (location.state as any)?.method || "QR Payment";
  const status = "Under Verification";
  const isRetailGuest = !user;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-elegant">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="font-display text-2xl sm:text-3xl">
              Payment Submitted – Order Under Verification
            </CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base">
              Payment submitted successfully. Your order is under verification.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Order ID" value={orderId || "—"} />
              <InfoRow label="Payment Method" value={method} />
              <InfoRow label="Payment Status" value={status} />
              <InfoRow label="Proof" value="Payment screenshot received" />
            </div>

            <div className="bg-secondary/60 border border-border rounded-lg p-4 flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-1 text-sm sm:text-base">
                <p className="font-semibold text-foreground">We’re verifying your payment.</p>
                <p className="text-muted-foreground">
                  Our team will review your payment proof and confirm your order shortly. No further action is needed.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {!isRetailGuest && (
                <Button className="flex-1" onClick={() => navigate("/orders")}>
                  Track Order
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => navigate("/shop")}>
                Continue Shopping
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>If you need help, our team is here.</p>
              <button
                className="inline-flex items-center gap-2 text-primary hover:underline"
                onClick={() => navigate("/contact")}
              >
                <Phone className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center rounded-md bg-card border border-border px-3 py-2 text-sm sm:text-base">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}
