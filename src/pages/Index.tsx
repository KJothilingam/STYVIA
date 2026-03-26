import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryCard from '@/components/CategoryCard';
import DealBanner from '@/components/DealBanner';
import ProductCard from '@/components/ProductCard';
import { heroBanners, categories, dealBanners, brands } from '@/data/categories';
import { getTrendingProducts, getDealsOfTheDay } from '@/data/products';
import productService from '@/services/productService';
import type { Product } from '@/types';

const Index = () => {
  const [catalogPreview, setCatalogPreview] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    productService
      .getAllProducts({ page: 0, size: 10 })
      .then((page) => {
        if (cancelled || !page.content?.length) return;
        setCatalogPreview(page.content);
      })
      .catch(() => {
        /* offline or no backend — keep mock tiles */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const trendingProducts = catalogPreview ? catalogPreview.slice(0, 5) : getTrendingProducts();
  const dealsProducts = catalogPreview
    ? catalogPreview.length > 5
      ? catalogPreview.slice(5, 10)
      : catalogPreview.slice(0, 5)
    : getDealsOfTheDay();

  return (
    <Layout>
      {/* Hero Carousel */}
      <HeroCarousel banners={heroBanners} />

      {/* Category Showcase */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-center mb-8">
          SHOP BY CATEGORY
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Deals & Offers */}
      <section className="bg-secondary py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            DEALS YOU CAN'T MISS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dealBanners.map((deal) => (
              <DealBanner key={deal.id} deal={deal} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">TRENDING NOW</h2>
          <a
            href="/products?sort=popular"
            className="text-primary font-semibold hover:underline"
          >
            View All →
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {trendingProducts.slice(0, 5).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-primary to-styvia-orange rounded-xl p-8 md:p-12 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            FLAT 50-80% OFF
          </h2>
          <p className="text-lg mb-6 opacity-90">
            On 5 Lakh+ styles! Limited time offer.
          </p>
          <a
            href="/products?discount=50"
            className="inline-block bg-background text-foreground px-8 py-3 rounded-full font-bold hover:bg-background/90 transition-colors"
          >
            Shop Now
          </a>
        </div>
      </section>

      {/* Deals of the Day */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">DEALS OF THE DAY</h2>
          <a
            href="/products?discount=50"
            className="text-primary font-semibold hover:underline"
          >
            View All →
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {dealsProducts.slice(0, 5).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Brand Spotlight */}
      <section className="bg-secondary py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            TOP BRANDS
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {brands.map((brand) => (
              <a
                key={brand.id}
                href={`/products?brand=${brand.name}`}
                className="w-24 h-24 bg-background rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
              >
                <span className="text-3xl font-bold text-primary">{brand.logo}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="font-bold text-sm mb-1">Free Shipping</h3>
            <p className="text-xs text-muted-foreground">On orders above ₹799</p>
          </div>
          <div className="p-4">
            <div className="text-4xl mb-3">↩️</div>
            <h3 className="font-bold text-sm mb-1">Easy Returns</h3>
            <p className="text-xs text-muted-foreground">14 days return policy</p>
          </div>
          <div className="p-4">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="font-bold text-sm mb-1">Secure Payment</h3>
            <p className="text-xs text-muted-foreground">100% secure checkout</p>
          </div>
          <div className="p-4">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-sm mb-1">Original Products</h3>
            <p className="text-xs text-muted-foreground">100% authentic brands</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
