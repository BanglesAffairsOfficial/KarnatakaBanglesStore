import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-3">{t("terms.title")}</h1>
          <p className="text-muted-foreground">{t("terms.description")}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.useOfSite")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("terms.useOfSiteContent")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.ordersAndPricing")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("terms.ordersAndPricingContent")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("terms.liability")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("terms.liabilityContent")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
