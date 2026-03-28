import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Zap, Truck, RotateCcw, Lock, BadgeCheck } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryCard from '@/components/CategoryCard';
import DealBanner from '@/components/DealBanner';
import ProductCard from '@/components/ProductCard';
import { heroBanners, categories, dealBanners } from '@/data/categories';
import { getTrendingProducts, getDealsOfTheDay } from '@/data/products';
import productService from '@/services/productService';
import { withLocalListingImages } from '@/lib/localListingImages';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

let indexListingGeneration = 0;

function mergeProductsWithImages(api: Product[], fallback: Product[], targetCount: number): Product[] {
  const seen = new Set<string>();
  const out: Product[] = [];
  const tryPush = (p: Product) => {
    if ((p.images?.length ?? 0) === 0 || seen.has(p.id)) return;
    seen.add(p.id);
    out.push(p);
  };
  for (const p of api) tryPush(p);
  if (out.length < targetCount) {
    for (const p of fallback) {
      tryPush(p);
      if (out.length >= targetCount) break;
    }
  }
  return out.slice(0, targetCount);
}

function SectionTitle({
  eyebrow,
  title,
  action,
  centered,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between',
        centered && 'items-center text-center md:flex-col md:items-center',
      )}
    >
      <div className={cn(centered && 'md:items-center')}>
        {eyebrow ? (
          <p
            className={cn(
              'mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary',
              centered ? 'justify-center' : 'justify-start',
            )}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-sans text-3xl font-bold tracking-tight md:text-4xl">
          <span className="text-gradient-styvia animate-home-gradient-shift bg-[length:200%_auto]">{title}</span>
        </h2>
        <div
          className={cn(
            'mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-primary via-styvia-orange to-intelligence-accent',
            centered && 'mx-auto',
          )}
        />
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const Index = () => {
  const [catalogPreview, setCatalogPreview] = useState<Product[] | null>(null);
  const [bfcacheBump, setBfcacheBump] = useState(0);
  const listingGeneration = useMemo(() => ++indexListingGeneration, []);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBfcacheBump((n) => n + 1);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    let cancelled = false;
    productService
      .getAllProducts({ page: 0, size: 40 })
      .then((page) => {
        if (cancelled || !page.content?.length) return;
        setCatalogPreview(page.content);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const { trendingProducts, dealsProducts } = useMemo(() => {
    if (!catalogPreview?.length) {
      return { trendingProducts: getTrendingProducts(), dealsProducts: getDealsOfTheDay() };
    }
    const fallback = [...getTrendingProducts(), ...getDealsOfTheDay()];
    const pool = mergeProductsWithImages(catalogPreview, fallback, 10);
    const trending = pool.slice(0, 5);
    const fromPool = pool.slice(5, 10);
    const deals =
      fromPool.length > 0
        ? fromPool
        : getDealsOfTheDay()
            .filter((p) => !trending.some((t) => t.id === p.id))
            .slice(0, 5);
    return { trendingProducts: trending, dealsProducts: deals };
  }, [catalogPreview]);

  const featureItems = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹799' },
    { icon: RotateCcw, title: 'Easy Returns', desc: '14 days return policy' },
    { icon: Lock, title: 'Secure Payment', desc: '100% secure checkout' },
    { icon: BadgeCheck, title: 'Original Products', desc: '100% authentic brands' },
  ];

  return (
    <Layout>
      <HeroCarousel banners={heroBanners} />

      {/* Category Showcase */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div
          className="pointer-events-none absolute left-1/4 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl animate-home-pulse-soft"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-intelligence-mid/20 blur-3xl animate-home-float-slow"
          style={{ animationDelay: '-6s' }}
          aria-hidden
        />

        <div className="container relative mx-auto px-4">
          <SectionTitle eyebrow="Curated for you" title="Shop by category" centered />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {categories.map((category, i) => (
              <div
                key={category.id}
                className="animate-home-reveal-up"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deals & Offers */}
      <section className="relative border-y border-border/60 bg-gradient-to-b from-secondary/90 via-secondary to-muted/30 py-12 md:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,hsl(var(--primary)/0.04)_50%,transparent_100%)]"
          aria-hidden
        />
        <div className="container relative mx-auto px-4">
          <SectionTitle
            eyebrow="Limited time"
            title="Deals you can't miss"
            centered
            action={
              <Link
                to="/products?sort=discount"
                className="relative z-10 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/80 px-5 py-2.5 text-sm font-semibold text-primary shadow-sm backdrop-blur transition hover:border-primary/50 hover:shadow-md home-shine-hover"
              >
                <Zap className="h-4 w-4" aria-hidden />
                View all offers
              </Link>
            }
          />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {dealBanners.map((deal, i) => (
              <div
                key={deal.id}
                className="animate-home-reveal-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <DealBanner deal={deal} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="home-glass-panel mb-8 px-5 py-6 md:px-8 md:py-7">
          <SectionTitle
            eyebrow="Hot right now"
            title="Trending now"
            action={
              <Link
                to="/products?sort=popular"
                className="group relative z-10 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:gap-3"
              >
                <TrendingUp className="h-4 w-4 transition-transform group-hover:-rotate-12" aria-hidden />
                View all →
              </Link>
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
          {trendingProducts.slice(0, 5).map((product, i) => (
            <div
              key={`${listingGeneration}-${bfcacheBump}-${product.id}`}
              className="animate-home-reveal-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <ProductCard product={withLocalListingImages(product)} />
            </div>
          ))}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4 py-6 md:py-8">
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary via-rose-600 to-styvia-orange p-8 text-center text-primary-foreground shadow-2xl shadow-primary/25 md:p-14">
          <div
            className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/20 blur-3xl transition-transform duration-700 group-hover:scale-110"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-amber-300/30 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay animate-home-shimmer-sweep"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
            }}
            aria-hidden
          />

          <div className="relative z-10">
            <h2 className="font-sans text-3xl font-bold tracking-tight drop-shadow-sm md:text-5xl">Flat 50–80% off</h2>
            <p className="mx-auto mt-4 max-w-lg text-base opacity-95 md:text-lg">
              On 5 lakh+ styles — limited time. Refresh your wardrobe without the guilt.
            </p>
            <Link
              to="/products?sort=discount"
              className="relative z-10 mt-8 inline-block rounded-full bg-background px-10 py-3.5 font-bold text-foreground shadow-xl transition hover:scale-[1.02] active:scale-[0.98] home-shine-hover"
            >
              Shop the sale
            </Link>
          </div>
        </div>
      </section>

      {/* Deals of the Day */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <SectionTitle
          eyebrow="Today only"
          title="Deals of the day"
          action={
            <Link
              to="/products?sort=discount"
              className="relative z-10 text-sm font-bold text-primary transition hover:underline"
            >
              View all →
            </Link>
          }
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
          {dealsProducts.slice(0, 5).map((product, i) => (
            <div
              key={`${listingGeneration}-${bfcacheBump}-${product.id}`}
              className="animate-home-reveal-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <ProductCard product={withLocalListingImages(product)} />
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {featureItems.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className={cn(
                'home-glass-panel group p-5 text-center transition duration-500',
                'hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl',
                'animate-home-reveal-up',
              )}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-intelligence-accent/10 text-primary ring-1 ring-primary/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                <Icon className="h-7 w-7" aria-hidden />
              </div>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
