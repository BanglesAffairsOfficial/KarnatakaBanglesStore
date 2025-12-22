import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown, Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

const FAQ_CATEGORIES = [
  {
    title: "General Questions",
    icon: "🛍️",
    questions: [
      {
        q: "What are glass bangles?",
        a: "Glass bangles are traditional Indian ornaments made from colored glass. They are lightweight, durable, and come in various colors and designs. They are typically worn on the wrists as part of traditional attire, especially during festivals and weddings.",
      },
      {
        q: "Are your bangles authentic?",
        a: "Yes! We guarantee 100% authentic glass bangles sourced directly from master craftsmen. Each piece is handcrafted using traditional methods that have been passed down for generations.",
      },
      {
        q: "Do you ship internationally?",
        a: "Currently, we ship within India only. We deliver to all major cities and pin codes across the country in 5-7 business days.",
      },
    ],
  },
  {
    title: "Sizing & Fitting",
    icon: "📏",
    questions: [
      {
        q: "How do I choose the right size?",
        a: "Bangle sizes are typically measured in inches (e.g., 2.2\", 2.4\", 2.6\"). Measure your wrist circumference just below the wrist bone and compare it with our size chart. For a comfortable fit, you should be able to slip your hand out of the bangle with slight resistance.",
      },
      {
        q: "Can I exchange a wrong size?",
        a: "Yes! We offer free size exchanges within 7 days of delivery. Simply contact our support team with your order details, and we'll arrange for the exchange at no additional cost.",
      },
      {
        q: "What's the best way to wear bangles?",
        a: "Apply oil or talcum powder to your hands and wrists to make them slippery. Push the bangle up your arm starting from the bottom. Once on your wrist, adjust it to sit comfortably below the wrist bone.",
      },
    ],
  },
  {
    title: "Orders & Returns",
    icon: "📦",
    questions: [
      {
        q: "How can I track my order?",
        a: "Once your order is shipped, you'll receive a tracking link via email. You can also use our order tracking page by entering your order ID to see real-time updates.",
      },
      {
        q: "What is your return policy?",
        a: "We offer a 7-day return policy from the date of delivery. Items must be unworn and in original packaging. You can initiate a return through your account or contact our support team.",
      },
      {
        q: "Do you accept exchanges?",
        a: "Yes! Exchanges are free within 7 days of delivery. You can exchange for different sizes, colors, or designs at no extra charge.",
      },
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 5-7 business days. We use Blue Dart and other reliable courier partners. Delivery time may vary based on your location and current logistics conditions.",
      },
    ],
  },
  {
    title: "Payment & Security",
    icon: "💳",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept UPI, Debit Cards, Credit Cards, Net Banking, and Cash on Delivery (COD). All payments are processed securely using industry-standard encryption.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes! We use SSL encryption and PCI DSS compliant payment gateways. Your payment information is never stored on our servers and is processed securely.",
      },
      {
        q: "Can I get an invoice?",
        a: "Yes! You'll receive an invoice via email after your order is confirmed. You can also download it from your order tracking page anytime.",
      },
    ],
  },
  {
    title: "Care & Maintenance",
    icon: "✨",
    questions: [
      {
        q: "How do I care for my glass bangles?",
        a: "Store bangles in a dry place. Clean them gently with a soft cloth. Avoid exposing them to extreme temperature changes or direct sunlight for extended periods, as this can cause color fading.",
      },
      {
        q: "Can glass bangles break easily?",
        a: "While glass bangles are durable, they can break if dropped from heights or subjected to sudden impacts. Handle them with care and store them safely to prevent damage.",
      },
      {
        q: "How do I remove bangles without breaking them?",
        a: "Apply oil or talcum powder to make your wrist slippery. Gently wiggle the bangle while pulling it down over your hand. Avoid rushing the process.",
      },
    ],
  },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(0);

  const filteredCategories = FAQ_CATEGORIES.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      q =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.questions.length > 0);

  const hasResults = searchQuery === "" || filteredCategories.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 gradient-gold rounded-full flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find answers to common questions about our products, orders, and services
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12"
            />
          </div>
        </div>

        {/* Categories */}
        {hasResults ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {filteredCategories.map((category, idx) => (
              <Card key={idx} className="shadow-elegant overflow-hidden">
                <CardHeader
                  className="bg-gradient-to-r from-primary/5 to-accent/5 cursor-pointer hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition"
                  onClick={() => setExpandedCategory(expandedCategory === idx ? -1 : idx)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      <CardTitle className="font-display">{category.title}</CardTitle>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedCategory === idx ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CardHeader>

                {expandedCategory === idx && (
                  <CardContent className="pt-6">
                    <Accordion type="single" collapsible className="space-y-2">
                      {category.questions.map((faq, qIdx) => (
                        <AccordionItem key={qIdx} value={`${idx}-${qIdx}`}>
                          <AccordionTrigger className="text-left hover:text-primary transition">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto p-8 text-center shadow-elegant">
            <p className="text-muted-foreground mb-4">
              No results found for "{searchQuery}"
            </p>
            <Button onClick={() => setSearchQuery("")} variant="outline">
              Clear Search
            </Button>
          </Card>
        )}

        {/* Still Need Help */}
        <Card className="max-w-2xl mx-auto mt-12 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Still need help?</h3>
            <p className="text-muted-foreground mb-4">
              Can't find the answer you're looking for? Our support team is here to help!
            </p>
            <Button>Contact Support</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
