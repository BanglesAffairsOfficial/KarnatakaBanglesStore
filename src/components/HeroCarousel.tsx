import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  colors?: string[];
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
}

export function HeroCarousel({ slides, autoPlayInterval = 5000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, autoPlayInterval, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="relative h-[300px] md:h-[400px] bg-gradient-to-r from-secondary to-muted rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-primary mb-2">
            New Arrivals Coming Soon
          </h2>
          <p className="text-muted-foreground">Check back for our latest collection!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentIndex 
                ? "opacity-100 scale-100 z-10" 
                : "opacity-0 scale-105 z-0"
            }`}
          >
            {slide.imageUrl ? (
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full gradient-gold opacity-20" />
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-end p-6 md:p-10">
              <div className={`transition-all duration-500 delay-200 ${
                index === currentIndex ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}>
                {slide.colors && slide.colors.length > 0 && (
                  <div className="flex gap-1 mb-3">
                    {slide.colors.slice(0, 6).map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full ring-2 ring-background shadow-md"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
                <span className="inline-block px-3 py-1 bg-accent/90 text-accent-foreground text-xs font-semibold rounded-full mb-2">
                  New Arrival
                </span>
                <h3 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-1">
                  {slide.title}
                </h3>
                {slide.subtitle && (
                  <p className="text-muted-foreground text-sm md:text-base max-w-md">
                    {slide.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "w-8 bg-accent" 
                  : "w-2 bg-foreground/30 hover:bg-foreground/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}