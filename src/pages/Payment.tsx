import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";

interface OrderInfo {
  id: string;
  total_amount?: number | null;
  total?: number | null;
  payment_status?: string | null;
  status?: string | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PaymentPage() {
  const { orderId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    // Allow guest checkout: don't force auth; still fetch order.
    fetchOrder();
  }, [authLoading, user, orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    const query = supabase
      .from("orders")
      .select("id, user_id, total_amount, payment_status, status")
      .eq("id", orderId)
      .maybeSingle();

    const { data, error } = await query;

    if (error || !data) {
      toast({ title: "Order not found", description: error?.message, variant: "destructive" });
      navigate("/");
      return;
    }

    // If the order belongs to a logged-in user and it's not theirs, block.
    if (data.user_id && user && data.user_id !== user.id) {
      toast({ title: "Access denied", description: "This order does not belong to you.", variant: "destructive" });
      navigate("/");
      return;
    }

    setOrder(data);
    setLoading(false);
  };

  const amount = order?.total_amount ?? 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!["image/jpeg", "image/png"].includes(selected.type)) {
      toast({ title: "Invalid file", description: "Only JPG or PNG allowed.", variant: "destructive" });
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Max size 5MB.", variant: "destructive" });
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!order || !orderId) return;
    if (!utr.trim()) {
      toast({ title: "UTR required", description: "Please enter your UPI Transaction ID.", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Screenshot required", description: "Upload payment screenshot.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${orderId}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("payment-proof").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        throw uploadError;
      }

      const { error: paymentError } = await supabase.from("payments").insert({
        order_id: orderId,
        amount,
        mode: "upi_qr",
        reference: utr.trim(),
        screenshot_url: filePath,
        status: "submitted",
      });
      if (paymentError) {
        throw paymentError;
      }

      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({ payment_status: "verification_pending" })
        .eq("id", orderId);
      if (orderUpdateError) {
        throw orderUpdateError;
      }

      toast({
        title: "Payment submitted",
        description: "Verification in progress.",
      });
      navigate(`/payment/${orderId}/submitted`, {
        state: {
          orderId,
          amount,
          method: "QR Payment",
        },
      });
    } catch (err: any) {
      console.error("Payment submit error:", err);
      toast({
        title: "Failed to submit payment",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-display font-bold mb-6">Complete Your Payment</h1>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Scan & Pay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading order...
              </div>
            ) : (
              <>
                <div className="flex gap-4 items-start">
                  <div className="w-56 h-56 rounded-lg border bg-secondary overflow-hidden">
                    <img src="/QR.jpg" alt="QR Code" className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Payable</p>
                      <p className="text-2xl font-display font-bold">Rs {Number(amount).toLocaleString()}</p>
                    </div>
                    <Button variant="outline" asChild>
                      <a href="/QR.jpg" download>
                        Download QR
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="utr">UPI Transaction ID (UTR)</Label>
                    <Input
                      id="utr"
                      placeholder="Enter UTR / Transaction ID"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Upload Payment Screenshot (JPG/PNG)</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-secondary/60">
                        <UploadCloud className="w-4 h-4" />
                        <span>Choose file</span>
                        <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileChange} />
                      </label>
                      {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">Max size: 5MB. JPG or PNG only.</p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitting || loading}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  I HAVE PAID
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
