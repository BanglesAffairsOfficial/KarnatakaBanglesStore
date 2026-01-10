import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Award, Users, Leaf, Globe, Star } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <Badge className="mb-4 mx-auto">EST. 2004</Badge>
          <h1 className="text-5xl font-display font-bold text-foreground mb-4">
            Karnataka Bangle Store
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Celebrating 20 years of craftsmanship, tradition, and elegance
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From our humble beginnings in Bangalore to becoming a trusted name across India, we've been committed to bringing authentic, high-quality bangles to every celebration and moment.
          </p>
        </div>

        {/* Our Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="shadow-elegant overflow-hidden border-0">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="p-8 bg-secondary">
                <h2 className="text-3xl font-display font-bold text-foreground mb-4">Our Story</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    In 2004, a small shop opened on Commercial Street in Bangalore with a simple mission: to bring the finest glass bangles to customers at affordable prices.
                  </p>
                  <p>
                    What started as a single store serving the local community has grown into a trusted online and offline destination for traditional and contemporary bangle designs.
                  </p>
                  <p>
                    Today, we work directly with master craftsmen who have perfected their art over generations, ensuring every bangle that bears our name meets our highest standards of quality and authenticity.
                  </p>
                  <p>
                    Our journey is built on trust, quality, and a deep commitment to preserving this beautiful tradition while making it accessible to everyone.
                  </p>
                </div>
              </div>
              <div className="p-8">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-primary mb-2">20+</div>
                    <p className="text-lg font-semibold text-foreground">Years of Excellence</p>
                    <p className="text-muted-foreground mt-2">Serving customers with pride</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Mission & Vision */}
        <div className="max-w-4xl mx-auto mb-16 grid md:grid-cols-2 gap-8">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                To bring authentic, high-quality bangles to every celebration while supporting traditional craftsmen and preserving the art of bangle-making for future generations.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                To be India's most trusted bangle brand, recognized for quality, innovation, and commitment to customer satisfaction across online and offline channels.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Award,
                title: "Quality First",
                description: "Every bangle is handcrafted with precision and care, meeting our strict quality standards.",
              },
              {
                icon: Users,
                title: "Customer Focus",
                description: "Your satisfaction is our priority. We're committed to excellent service and support.",
              },
              {
                icon: Globe,
                title: "Authenticity",
                description: "100% genuine bangles sourced directly from skilled craftsmen with generations of expertise.",
              },
              {
                icon: Leaf,
                title: "Sustainability",
                description: "We support ethical practices and fair trade principles in all our sourcing.",
              },
              {
                icon: Heart,
                title: "Community",
                description: "We believe in giving back and supporting the artisan communities that make our business possible.",
              },
              {
                icon: Star,
                title: "Innovation",
                description: "While honoring tradition, we continuously innovate to meet modern tastes and preferences.",
              },
            ].map((value, idx) => {
              const Icon = value.icon;
              return (
                <Card key={idx} className="shadow-elegant hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">Why Choose Us?</h2>
          <div className="space-y-4">
            {[
              { title: "20+ Years Experience", desc: "Decades of expertise in selecting and curating the finest bangles" },
              { title: "100% Authentic", desc: "All bangles sourced directly from master craftsmen and artisans" },
              { title: "Quality Guarantee", desc: "Rigorous quality checks ensure every piece meets our standards" },
              { title: "Competitive Pricing", desc: "Direct sourcing means we can offer the best prices without compromising quality" },
              { title: "Global Shipping", desc: "Available worldwide with reliable international shipping partners" },
              { title: "Easy Returns", desc: "Hassle-free 7-day return policy for your peace of mind" },
              { title: "Expert Support", desc: "Our team is available to help with sizing, styling, and any questions" },
              { title: "Wide Selection", desc: "From traditional to contemporary, we have bangles for every style and need" },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Priya Sharma",
                location: "Mumbai",
                text: "Beautiful bangles! The quality is amazing and the colors are so vibrant. Will definitely order again.",
                rating: 5,
              },
              {
                name: "Lakshmi Rao",
                location: "Bangalore",
                text: "Best collection I've seen. Perfect for my wedding! The customer service was excellent throughout.",
                rating: 5,
              },
              {
                name: "Meena Patel",
                location: "Delhi",
                text: "Fast delivery and excellent packaging. The bangles are so comfortable and look amazing. Highly recommend!",
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <Card key={idx} className="shadow-elegant">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center p-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">
            Ready to Find Your Perfect Bangles?
          </h2>
          <p className="text-muted-foreground mb-6">
            Explore our collection and discover the beauty of traditional craftsmanship with modern convenience.
          </p>
          <Button size="lg" className="gradient-gold text-foreground">
            Start Shopping
          </Button>
        </div>
      </main>
    </div>
  );
}
