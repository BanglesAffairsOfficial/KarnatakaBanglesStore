import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-3">Terms & Conditions</h1>
          <p className="text-muted-foreground">The basics of using our site and placing orders.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Use of the Site</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Don’t misuse the site, attempt fraud, or violate applicable laws.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Orders are confirmed upon payment authorization. Pricing and availability may change; obvious errors may be corrected.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We are not liable for indirect damages; remedies are limited to order value where applicable.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
