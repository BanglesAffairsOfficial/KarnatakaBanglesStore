import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, Truck, Award } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 space-y-6 max-w-5xl">
        <div className="space-y-3 text-center">
          <Badge variant="secondary" className="text-sm">Since 2004 • Bengaluru</Badge>
          <h1 className="text-3xl sm:text-4xl font-display font-bold">Our Story</h1>
          <p className="text-muted-foreground text-base">
            Online Bangles Site brings premium glass bangles and Indian jewelry heritage to shoppers across the country.
            We blend traditional craftsmanship with modern, trustworthy e-commerce.
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl">Built for Indian Shoppers</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <AboutTile icon={<Sparkles className="w-5 h-5" />} title="Premium Selection">
              Curated colors, sizes, and finishes—ready for weddings, festivals, and daily wear.
            </AboutTile>
            <AboutTile icon={<ShieldCheck className="w-5 h-5" />} title="Verified Quality">
              Every batch is inspected, packed securely, and backed by responsive support.
            </AboutTile>
            <AboutTile icon={<Truck className="w-5 h-5" />} title="Reliable Delivery">
              Fast dispatch with clear updates from “Order Placed” to “Delivered”.
            </AboutTile>
            <AboutTile icon={<Award className="w-5 h-5" />} title="Trusted Since 2004">
              Thousands of customers served with consistency, transparency, and care.
            </AboutTile>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl">Why We Care</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Bangles are more than accessories—they’re stories, celebrations, and everyday confidence.
              We work directly with artisans and trusted suppliers to keep that magic alive.
            </p>
            <p>
              Our promise: clear communication, fair pricing, and attentive service from checkout to delivery.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AboutTile({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-border bg-card/50">
      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
