import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Ruler, Download, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

const SIZE_CHART = [
  { size: "2.2\"", circumference: "2.2 inches", wristCircumference: "5.5 cm" },
  { size: "2.4\"", circumference: "2.4 inches", wristCircumference: "6.0 cm" },
  { size: "2.6\"", circumference: "2.6 inches", wristCircumference: "6.6 cm" },
  { size: "2.8\"", circumference: "2.8 inches", wristCircumference: "7.1 cm" },
  { size: "2.10\"", circumference: "2.10 inches", wristCircumference: "7.6 cm" },
];

const MEASUREMENT_TIPS = [
  {
    step: "1",
    title: "Measure Your Wrist",
    description: "Using a soft measuring tape, measure the circumference of your wrist at the point where you normally wear a bangle or watch.",
    tips: [
      "Measure just below the wrist bone",
      "Keep the tape snug but not tight",
      "Round to the nearest 0.1 inch",
    ],
  },
  {
    step: "2",
    title: "Check the Fit",
    description: "A properly sized bangle should slip over your hand with slight resistance but remain comfortable on your wrist.",
    tips: [
      "You should be able to fit one finger between the bangle and your wrist",
      "The bangle should not fall off easily",
      "It should not leave marks or restrict circulation",
    ],
  },
  {
    step: "3",
    title: "Adjust if Needed",
    description: "If you're between sizes, consider your hand size and personal preference.",
    tips: [
      "Larger hands: choose the next size up",
      "Thinner wrists: choose the next size down",
      "If unsure, go with the larger size for comfort",
    ],
  },
];

export default function SizeGuide() {
  const { t } = useTranslation();
  const [selectedSize, setSelectedSize] = useState("2.6\"");

  const downloadGuide = () => {
    alert("Printable size guide will be downloaded as PDF");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 gradient-gold rounded-full flex items-center justify-center">
              <Ruler className="w-8 h-8 text-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Bangle Size Guide
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find your perfect fit with our comprehensive sizing guide. Proper sizing is essential for comfort and style.
          </p>
        </div>

        <Tabs defaultValue="guide" className="max-w-4xl mx-auto mb-12">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="guide">Size Guide</TabsTrigger>
            <TabsTrigger value="measurement">Measurement Steps</TabsTrigger>
            <TabsTrigger value="faq">Size FAQ</TabsTrigger>
          </TabsList>

          {/* Size Guide Tab */}
          <TabsContent value="guide" className="mt-8">
            <Card className="shadow-elegant mb-8">
              <CardHeader>
                <CardTitle className="font-display">Standard Bangle Sizes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold">Bangle Size</th>
                        <th className="text-left p-4 font-semibold">Circumference</th>
                        <th className="text-left p-4 font-semibold">Wrist Circumference</th>
                        <th className="text-left p-4 font-semibold">Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_CHART.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b hover:bg-secondary/50 cursor-pointer transition ${
                            selectedSize === row.size ? "bg-primary/10" : ""
                          }`}
                          onClick={() => setSelectedSize(row.size)}
                        >
                          <td className="p-4 font-semibold text-foreground">{row.size}</td>
                          <td className="p-4 text-muted-foreground">{row.circumference}</td>
                          <td className="p-4 text-muted-foreground">{row.wristCircumference}</td>
                          <td className="p-4">
                            {idx === 0 && "Children & small wrists"}
                            {idx === 1 && "Small adult wrists"}
                            {idx === 2 && "Average adult wrists"}
                            {idx === 3 && "Large adult wrists"}
                            {idx === 4 && "Extra large wrists"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Visual Representation */}
                <div className="mt-8 p-6 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">Visual Size Representation:</p>
                  <div className="flex items-center justify-center gap-8 py-8">
                    {SIZE_CHART.map((item) => {
                      const sizeNum = parseFloat(item.size);
                      const radius = (sizeNum * 20) + 20;
                      return (
                        <div
                          key={item.size}
                          className="flex flex-col items-center gap-2"
                        >
                          <div
                            className="border-4 border-primary rounded-full"
                            style={{
                              width: `${radius * 2}px`,
                              height: `${radius * 2}px`,
                            }}
                          />
                          <span className={`text-sm font-semibold ${selectedSize === item.size ? "text-primary" : "text-muted-foreground"}`}>
                            {item.size}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Measurement Steps Tab */}
          <TabsContent value="measurement" className="mt-8">
            <div className="space-y-6 mb-8">
              {MEASUREMENT_TIPS.map((tip, idx) => (
                <Card key={idx} className="shadow-elegant overflow-hidden">
                  <div className="flex items-start gap-4 p-6">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-lg">
                      {tip.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">{tip.title}</h3>
                      <p className="text-muted-foreground mb-4">{tip.description}</p>
                      <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm font-semibold text-foreground mb-2">Key Points:</p>
                        <ul className="space-y-2">
                          {tip.tips.map((point, pIdx) => (
                            <li key={pIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">✓</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Important Note */}
            <Card className="shadow-elegant bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-50 mb-1">Pro Tip:</h4>
                  <p className="text-yellow-800 dark:text-yellow-100 text-sm">
                    If you're between sizes, it's usually better to choose the larger size for comfort. You can always use oil or talcum powder to help with wearing and removing bangles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="mt-8 space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display">How do I measure my wrist?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Use a soft measuring tape or a piece of string. Wrap it around your wrist at the point where you normally wear a bangle, just below the wrist bone. Make sure it's snug but not tight. Measure to the nearest tenth of an inch.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display">Can bangles be resized?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Glass bangles cannot be resized once made. However, we offer free exchanges within 7 days of delivery if you receive the wrong size. Our customers can also use the free exchange service if they change their mind about the size.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display">What if I wear different sizes for different hands?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  It's common to have different wrist sizes. We recommend ordering sets of bangles in the same size for a matching look, or you can order different sizes for each hand. Many customers appreciate having size variety.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-display">Are your bangles comfortable to wear?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Our bangles are made with smooth, polished glass and are very comfortable. The right size is crucial for comfort. When properly sized, you should be able to wear them all day without any discomfort. You may need to use oil or talcum powder initially to help wear and remove them.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Download Guide */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-elegant bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Need a Printable Size Guide?</h3>
                <p className="text-sm text-muted-foreground">Download our size chart as a PDF and take it with you while shopping.</p>
              </div>
              <Button onClick={downloadGuide} className="gap-2 flex-shrink-0">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
