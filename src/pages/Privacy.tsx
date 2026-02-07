import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-3">{t("privacy.title")}</h1>
          <p className="text-muted-foreground">{t("privacy.description")}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.dataCollect")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("privacy.dataCollectContent")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.howWeUseIt")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("privacy.howWeUseItContent")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.yourControls")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("privacy.yourControlsContent")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
