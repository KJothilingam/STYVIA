import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '@/types';
import { cn } from '@/lib/utils';

interface HeroCarouselProps {
  banners: Banner[];
  autoPlayInterval?: number;
}

const HeroCarousel = ({ banners, autoPlayInterval = 4000 }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const n = banners?.length ?? 0;

  const nextSlide = useCallback(() => {
    if (n <= 0) return;
    setCurrentIndex((prev) => (prev + 1) % n);
  }, [n]);

  const prevSlide = useCallback(() => {
    if (n <= 0) return;
    setCurrentIndex((prev) => (prev - 1 + n) % n);
  }, [n]);

  useEffect(() => {
    if (n <= 0) return;
    const timer = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(timer);
  }, [nextSlide, autoPlayInterval, n]);

  if (n === 0) {
    return (
      <div className="relative aspect-[3/1] bg-muted md:aspect-[4/1] lg:aspect-[5/1]" aria-hidden />
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-secondary/80 to-background px-3 pb-3 pt-3 sm:px-4 md:px-6">
      <div className="relative mx-auto max-w-[1600px] overflow-hidden rounded-3xl border border-border/40 shadow-2xl shadow-primary/5 ring-1 ring-black/[0.03] dark:ring-white/10">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <Link key={banner.id} to={banner.link} className="relative w-full flex-shrink-0">
              <div className="relative aspect-[3/1] md:aspect-[4/1] lg:aspect-[5/1]">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="h-full w-full object-cover animate-ken-burns"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10 md:from-black/60 md:via-black/25"
                  aria-hidden
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80"
                  aria-hidden
                />
                <div
                  className="absolute inset-0 bg-[linear-gradient(105deg,hsl(var(--primary)/0.12)_0%,transparent_45%,hsl(var(--intelligence-accent)/0.08)_100%)] mix-blend-overlay"
                  aria-hidden
                />

                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-5 md:px-10 lg:px-14">
                    <div className="max-w-xl animate-home-reveal-up">
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-white/70 md:text-sm">
                        Styvia
                      </p>
                      <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-md md:text-5xl lg:text-6xl">
                        {banner.title}
                      </h2>
                      {banner.subtitle && (
                        <p className="max-w-md text-base text-white/90 md:text-xl lg:text-2xl">{banner.subtitle}</p>
                      )}
                      <span className="mt-6 inline-flex items-center rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-foreground shadow-lg transition hover:bg-white hover:shadow-xl">
                        Shop this drop →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            prevSlide();
          }}
          className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-background/85 text-foreground shadow-lg backdrop-blur-md transition hover:bg-background hover:scale-105 active:scale-95 md:left-6"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            nextSlide();
          }}
          className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-background/85 text-foreground shadow-lg backdrop-blur-md transition hover:bg-background hover:scale-105 active:scale-95 md:right-6"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-6">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setCurrentIndex(index);
              }}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-8 bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                  : 'w-2.5 bg-white/45 hover:bg-white/70',
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
