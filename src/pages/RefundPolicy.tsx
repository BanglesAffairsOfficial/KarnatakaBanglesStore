import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

export default function RefundPolicy() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold">{t("refundPolicy.title")}</h1>
          <p className="text-muted-foreground">{t("refundPolicy.updated")}</p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              We want you to love your bangles. If something isn’t right, we’re here to help with a simple, transparent process.
            </p>
            <Section title="Eligibility">
              <ul className="list-disc list-inside space-y-1">
                <li>Items must be unused and in original packaging.</li>
                <li>Report issues within 3 days of delivery with photos.</li>
                <li>Custom or clearance items may be non-returnable.</li>
              </ul>
            </Section>
            <Section title="Damaged or Incorrect Items">
              <p>
                Share photos of the item and packaging within 3 days. Once verified, we’ll arrange a replacement or issue store credit.
              </p>
            </Section>
            <Section title="Cancellations">
              <p>
                Orders can be cancelled before dispatch. If already shipped, please refuse delivery or contact support for guidance.
              </p>
            </Section>
            <Section title="Refunds">
              <p>
                Approved refunds are processed to the original payment method (processing time: 7-10 business days after inspection).
              </p>
            </Section>
            <Section title="Shipping Fees">
              <p>
                Shipping and COD charges are non-refundable unless the error is on our side.
              </p>
            </Section>
            <Separator />
            <p className="text-sm">
              For support, reach us via the Contact page with your Order ID and issue details.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
