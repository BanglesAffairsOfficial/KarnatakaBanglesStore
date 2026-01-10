import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground">How we collect, use, and protect your data.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Data We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Account info (name, email), order details, payment confirmation status (not full card data), and site usage analytics.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>How We Use It</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>To process orders, improve the catalog, send order updates, and personalize recommendations.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Request data export or deletion via Contact. Manage marketing opt-ins in your profile (coming soon).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
