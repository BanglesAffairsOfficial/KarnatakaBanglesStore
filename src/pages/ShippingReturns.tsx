import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

export default function ShippingReturns() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
        <header>
          <h1 className="text-4xl font-display font-bold mb-3">{t("shippingReturns.title")}</h1>
          <p className="text-muted-foreground">{t("shippingReturns.description")}</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">Dispatch</p>
              <p>Orders typically ship within 2-3 business days. Custom sizes may require extra handling.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Delivery</p>
              <p>Domestic: 3-7 business days after dispatch. International: 7-15 business days depending on region.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Tracking</p>
              <p>You’ll receive tracking via email/WhatsApp once the parcel is handed to the courier.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Fees</p>
              <p>Shipping is calculated at checkout based on weight and destination. Duties/taxes are borne by recipient.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Returns & Exchanges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">Eligibility</p>
              <p>Unworn items in original packaging within 7 days of delivery. Custom/bulk orders are final sale.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">How to request</p>
              <p>Email support with order ID and reason. We’ll share the return address and approval.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Refunds</p>
              <p>Processed to your original payment method after inspection. Shipping fees are non-refundable.</p>
            </div>
          </CardContent>
        </Card>

        <Separator />
        <p className="text-sm text-muted-foreground">
          Need help? Reach out via the Contact page with your order ID for faster assistance.
        </p>
      </div>
    </div>
  );
}
