import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, CheckCircle2, Truck, MapPin } from "lucide-react";

interface OrderStatus {
  id: string;
  date: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function OrderTracking() {
  const [orderId, setOrderId] = useState("");
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const statuses: OrderStatus[] = [
    {
      id: "placed",
      date: "Dec 20, 2025",
      title: "Order Placed",
      description: "Your order has been confirmed",
      completed: true,
    },
    {
      id: "processing",
      date: "Dec 21, 2025",
      title: "Order Processing",
      description: "We are preparing your items",
      completed: true,
    },
    {
      id: "shipped",
      date: "Dec 22, 2025",
      title: "Shipped",
      description: "Your order has been shipped with Blue Dart",
      completed: true,
    },
    {
      id: "in-transit",
      date: "In Progress",
      title: "In Transit",
      description: "Your package is on its way",
      completed: false,
    },
    {
      id: "delivered",
      date: "Est. Dec 27, 2025",
      title: "Delivery Expected",
      description: "Expected delivery at your location",
      completed: false,
    },
  ];

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTracking({
        orderId,
        orderDate: "Dec 20, 2025",
        totalAmount: 4999,
        status: "in-transit",
        items: [
          { name: "Red Glass Bangles - Size 2.6", quantity: 5, price: 2499 },
          { name: "Blue Glass Bangles - Size 2.8", quantity: 3, price: 2500 },
        ],
        shippingAddress: {
          name: "Priya Sharma",
          address: "123 Main Street, Apt 4B",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
        },
        trackingNumber: "BDC" + orderId,
        courierPartner: "Blue Dart",
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Track Your Order
            </h1>
            <p className="text-muted-foreground text-lg">
              Enter your order ID to see the current status of your delivery
            </p>
          </div>

          {/* Search Form */}
          <Card className="shadow-elegant mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleTrack} className="flex gap-2">
                <Input
                  placeholder="Enter order ID (e.g., ORD-123456)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="h-12"
                />
                <Button type="submit" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {tracking && (
            <>
              {/* Order Summary */}
              <Card className="shadow-elegant mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display">Order #{tracking.orderId}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Placed on {tracking.orderDate}</p>
                    </div>
                    <Badge className="text-base py-2 px-4">
                      {tracking.status === "in-transit" ? "In Transit" : "Delivery Expected"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items */}
                  <div className="mb-6 pb-6 border-b">
                    <h3 className="font-semibold text-foreground mb-4">Order Items</h3>
                    <div className="space-y-3">
                      {tracking.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">₹{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-accent">₹{tracking.totalAmount}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="shadow-elegant mb-8">
                <CardHeader>
                  <CardTitle className="font-display">Delivery Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Timeline */}
                    <div className="space-y-6">
                      {statuses.map((status, index) => (
                        <div key={status.id} className="flex gap-4">
                          {/* Timeline marker */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                status.completed
                                  ? "bg-green-500 text-white"
                                  : index === statuses.findIndex(s => !s.completed)
                                  ? "bg-primary text-white animate-pulse"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {status.completed ? (
                                <CheckCircle2 className="w-6 h-6" />
                              ) : index === statuses.findIndex(s => !s.completed) ? (
                                <Truck className="w-6 h-6" />
                              ) : (
                                <Package className="w-6 h-6" />
                              )}
                            </div>
                            {index < statuses.length - 1 && (
                              <div className={`w-1 h-8 ${status.completed ? "bg-green-500" : "bg-secondary"}`} />
                            )}
                          </div>

                          {/* Timeline content */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-baseline justify-between mb-1">
                              <h4 className="font-semibold text-foreground">{status.title}</h4>
                              <span className="text-sm text-muted-foreground">{status.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{status.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Details */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-display">Shipping Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Shipping Address */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Delivery Address
                      </h4>
                      <div className="bg-secondary p-4 rounded-lg">
                        <p className="font-semibold text-foreground">{tracking.shippingAddress.name}</p>
                        <p className="text-muted-foreground text-sm mt-1">{tracking.shippingAddress.address}</p>
                        <p className="text-muted-foreground text-sm">{tracking.shippingAddress.city}, {tracking.shippingAddress.state}</p>
                        <p className="text-muted-foreground text-sm">Pincode: {tracking.shippingAddress.pincode}</p>
                      </div>
                    </div>

                    {/* Tracking Info */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-primary" />
                        Courier Information
                      </h4>
                      <div className="bg-secondary p-4 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Courier Partner</p>
                          <p className="font-semibold text-foreground">{tracking.courierPartner}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tracking Number</p>
                          <p className="font-mono font-semibold text-foreground">{tracking.trackingNumber}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help Section */}
              <Card className="shadow-elegant mt-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">
                    Need help tracking your order? Contact our support team for assistance.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline">Contact Support</Button>
                    <Button variant="outline">Download Invoice</Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Sample Order Info */}
          {!tracking && (
            <Card className="shadow-elegant bg-secondary/50">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Try with order ID: <code className="bg-background px-2 py-1 rounded">ORD-123456</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  Your order ID is available in the confirmation email you received after placing your order.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
