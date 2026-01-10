import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

export default function FAQ() {
  const { t } = useTranslation();
  const faqs = t("faqPage.items", { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-6">{t("faqPage.title")}</h1>
          <p className="text-muted-foreground mb-8">
            {t("faqPage.subtitle")}
          </p>
          <Card>
            <CardHeader>
              <CardTitle>{t("faqPage.cardTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((item, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
