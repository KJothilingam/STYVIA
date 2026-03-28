import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Loader2, X, Grid3X3, LayoutGrid } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { products as mockProducts } from '@/data/products';
import { categories } from '@/data/categories';
import productService from '@/services/productService';
import { withLocalListingImages } from '@/lib/localListingImages';
import CategoryPageHero from '@/components/catalog/CategoryPageHero';
import type { CatalogCategorySlug } from '@/components/catalog/CategoryPageHero';
import { cn } from '@/lib/utils';
import { meaningfulCatalogSearch } from '@/lib/catalogBrowseQuery';
import type { Product } from '@/types';

function isCatalogCategorySlug(c: string | null): c is CatalogCategorySlug {
  return c === 'men' || c === 'women' || c === 'kids' || c === 'accessories';
}

function productMatchesSearchQuery(product: Product, rawQuery: string): boolean {
  const tokens = rawQuery
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return true;
  const hay = `${product.name} ${product.brand} ${product.category} ${product.subcategory ?? ''} ${product.description ?? ''}`.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

const sortOptions = [
  { value: 'popular', label: 'Popularity' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'discount', label: 'Better Discount' },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const clearUrlSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    setSearchParams(next, { replace: true });
  };
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [gridCols, setGridCols] = useState(4);
  const [catalogItems, setCatalogItems] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  /** True when search had zero hits in this category — we show the full category instead of an empty grid. */
  const [searchBroadenedToCategory, setSearchBroadenedToCategory] = useState(false);

  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'popular';
  const discount = searchParams.get('discount');
  const brandFromUrl = searchParams.get('brand');
  const maxPriceUrl = searchParams.get('maxPrice');
  const minPriceUrl = searchParams.get('minPrice');
  const catalogCategorySlug = isCatalogCategorySlug(category) ? category : null;

  /** Home “Deals” links use ?maxPrice= / ?minPrice= — keep the slider and filters in sync. */
  useEffect(() => {
    const max = maxPriceUrl != null && maxPriceUrl !== '' ? Number(maxPriceUrl) : NaN;
    const min = minPriceUrl != null && minPriceUrl !== '' ? Number(minPriceUrl) : NaN;
    const hasMax = Number.isFinite(max) && max > 0;
    const hasMin = Number.isFinite(min) && min >= 0;
    if (hasMax || hasMin) {
      const lo = hasMin ? Math.min(10000, Math.max(0, min)) : 0;
      const hi = hasMax ? Math.min(10000, Math.max(0, max)) : 10000;
      setPriceRange(lo <= hi ? [lo, hi] : [hi, lo]);
    } else {
      setPriceRange([0, 10000]);
    }
  }, [maxPriceUrl, minPriceUrl]);

  const catalogSearchQuery = useMemo(() => {
    const s = search?.trim();
    if (!s) return undefined;
    /** Generic words apply only with ?category= — plain ?search= should stay strict. */
    if (catalogCategorySlug) return meaningfulCatalogSearch(s);
    return s;
  }, [search, catalogCategorySlug]);

  useEffect(() => {
    let cancelled = false;
    setSearchBroadenedToCategory(false);
    setCatalogLoading(true);
    setCatalogItems([]);
    (async () => {
      try {
        let content: Product[] = [];
        const q = catalogSearchQuery;
        const genderCategory =
          category === 'men' || category === 'women' || category === 'kids' || category === 'accessories';

        const minP =
          minPriceUrl != null && minPriceUrl !== '' ? Number(minPriceUrl) : Number.NaN;
        const maxP =
          maxPriceUrl != null && maxPriceUrl !== '' ? Number(maxPriceUrl) : Number.NaN;
        const hasUrlPriceFilter =
          (Number.isFinite(maxP) && maxP > 0) || (Number.isFinite(minP) && minP >= 0);

        if (q && genderCategory) {
          const searchInCategory = async (
            cat: 'men' | 'women' | 'kids' | 'accessories',
            primary: Product[],
          ): Promise<Product[]> => {
            const list = primary.filter((p) => productMatchesSearchQuery(p, q));
            if (list.length > 0) return list;
            const sp = await productService.searchProducts(q, 0, 100);
            return (sp.content ?? []).filter((p) => p.category === cat);
          };

          if (category === 'men') {
            const page = await productService.getProductsByGender('MEN', 0, 100);
            content = await searchInCategory('men', page.content ?? []);
          } else if (category === 'women') {
            const page = await productService.getProductsByGender('WOMEN', 0, 100);
            content = await searchInCategory('women', page.content ?? []);
          } else if (category === 'kids') {
            const page = await productService.getProductsByGender('KIDS', 0, 100);
            content = await searchInCategory('kids', page.content ?? []);
          } else if (category === 'accessories') {
            const page = await productService.getAllProducts({ page: 0, size: 300 });
            const acc = (page.content ?? []).filter((p) => p.category === 'accessories');
            content = await searchInCategory('accessories', acc);
          }
        } else if (q) {
          const page = await productService.searchProducts(q, 0, 100);
          content = page.content ?? [];
        } else if (hasUrlPriceFilter && !category && !q) {
          const page = await productService.filterProducts({
            page: 0,
            size: 200,
            minPrice: Number.isFinite(minP) && minP >= 0 ? minP : undefined,
            maxPrice: Number.isFinite(maxP) && maxP > 0 ? maxP : undefined,
          });
          content = page.content ?? [];
        } else if (category === 'men') {
          const page = await productService.getProductsByGender('MEN', 0, 100);
          content = page.content ?? [];
        } else if (category === 'women') {
          const page = await productService.getProductsByGender('WOMEN', 0, 100);
          content = page.content ?? [];
        } else if (category === 'kids') {
          const page = await productService.getProductsByGender('KIDS', 0, 100);
          content = page.content ?? [];
        } else if (category === 'accessories') {
          const page = await productService.getAllProducts({ page: 0, size: 300 });
          content = (page.content ?? []).filter((p) => p.category === 'accessories');
        } else {
          const pageSize = discount ? 300 : 200;
          const page = await productService.getAllProducts({ page: 0, size: pageSize });
          content = page.content ?? [];
        }
        /** Backend or seed data may omit kids/accessories or mark the wrong `category`; never show an empty shelf when mocks exist. */
        if (
          !cancelled &&
          category &&
          (category === 'men' ||
            category === 'women' ||
            category === 'kids' ||
            category === 'accessories')
        ) {
          const matching = content.filter((p) => p.category === category);
          if (matching.length === 0) {
            let mock = mockProducts.filter((p) => p.category === category);
            if (q) mock = mock.filter((p) => productMatchesSearchQuery(p, q));
            if (mock.length > 0) content = mock;
          } else {
            content = matching;
          }
        }

        let broadenedSearch = false;
        if (!cancelled && q && genderCategory && content.length === 0) {
          broadenedSearch = true;
          if (category === 'men') {
            const page = await productService.getProductsByGender('MEN', 0, 100);
            content = page.content ?? [];
          } else if (category === 'women') {
            const page = await productService.getProductsByGender('WOMEN', 0, 100);
            content = page.content ?? [];
          } else if (category === 'kids') {
            const page = await productService.getProductsByGender('KIDS', 0, 100);
            content = page.content ?? [];
          } else if (category === 'accessories') {
            const page = await productService.getAllProducts({ page: 0, size: 300 });
            content = (page.content ?? []).filter((p) => p.category === 'accessories');
          }
          if (
            category &&
            (category === 'men' ||
              category === 'women' ||
              category === 'kids' ||
              category === 'accessories')
          ) {
            const matching = content.filter((p) => p.category === category);
            if (matching.length === 0) {
              const mock = mockProducts.filter((p) => p.category === category);
              if (mock.length > 0) content = mock;
            } else {
              content = matching;
            }
          }
        }

        if (!cancelled) {
          setSearchBroadenedToCategory(broadenedSearch);
          setCatalogItems(content);
        }
      } catch {
        if (!cancelled) {
          setSearchBroadenedToCategory(false);
          setCatalogItems(mockProducts);
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, catalogSearchQuery, discount, maxPriceUrl, minPriceUrl]);

  const brandsList = useMemo(
    () => [...new Set(catalogItems.map((p) => p.brand))].sort(),
    [catalogItems],
  );
  const colorsList = useMemo(
    () =>
      Array.from(new Map(catalogItems.flatMap((p) => p.colors).map((c) => [c.name, c])).values()),
    [catalogItems],
  );

  const { filteredProducts, discountRelaxedFromUrl } = useMemo(() => {
    let result = [...catalogItems];
    let discountRelaxedFromUrl = false;

    // Filter by category (accessories / unfiltered API lists)
    if (category && !catalogSearchQuery) {
      result = result.filter((p) => p.category === category);
    }

    // Filter by subcategory
    if (subcategory) {
      const sub = subcategory.toLowerCase();
      result = result.filter((p) => {
        const sc = (p.subcategory || '').toLowerCase();
        return sc.includes(sub) || sub.includes(sc);
      });
    }

    if (brandFromUrl?.trim()) {
      const b = brandFromUrl.trim();
      result = result.filter((p) => p.brand === b);
    }

    // Meaningful search only (generic words like “dress” / “clothes” are aisle-browse, not filters)
    if (catalogSearchQuery && !searchBroadenedToCategory) {
      result = result.filter((p) => productMatchesSearchQuery(p, catalogSearchQuery));
    }

    // Filter by discount (home “Min 50% off”); if catalog has no such SKUs, show all and explain
    if (discount) {
      const t = parseInt(discount, 10);
      if (Number.isFinite(t)) {
        const matched = result.filter((p) => p.discount >= t);
        if (matched.length > 0) {
          result = matched;
        } else {
          discountRelaxedFromUrl = true;
        }
      }
    }

    // Filter by price range
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Filter by brands
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Filter by sizes
    if (selectedSizes.length > 0) {
      result = result.filter((p) =>
        p.sizes.some((s) => selectedSizes.includes(s))
      );
    }

    // Filter by selected colors
    if (selectedColors.length > 0) {
      result = result.filter((p) =>
        p.colors.some((c) => selectedColors.includes(c.name))
      );
    }

    // Sort
    if (discountRelaxedFromUrl && discount) {
      result.sort((a, b) => b.discount - a.discount);
    } else {
      switch (sort) {
        case 'price-low':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          result.reverse();
          break;
        case 'discount':
          result.sort((a, b) => b.discount - a.discount);
          break;
        default:
          result.sort((a, b) => b.rating - a.rating);
      }
    }

    return { filteredProducts: result, discountRelaxedFromUrl };
  }, [
    catalogItems,
    category,
    subcategory,
    catalogSearchQuery,
    sort,
    discount,
    brandFromUrl,
    priceRange,
    selectedBrands,
    selectedSizes,
    selectedColors,
    searchBroadenedToCategory,
  ]);

  const handleSortChange = (value: string) => {
    searchParams.set('sort', value);
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    const next = new URLSearchParams(searchParams);
    next.delete('maxPrice');
    next.delete('minPrice');
    next.delete('discount');
    setSearchParams(next, { replace: true });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Categories</h3>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                to={`/products?category=${cat.slug}`}
                className={`text-sm ${category === cat.slug ? 'text-primary font-semibold' : 'text-muted-foreground'
                  } hover:text-primary`}
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Brands</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brandsList.map((brand) => (
            <div key={brand} className="flex items-center gap-2">
              <Checkbox
                id={brand}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedBrands([...selectedBrands, brand]);
                  } else {
                    setSelectedBrands(selectedBrands.filter((b) => b !== brand));
                  }
                }}
              />
              <label htmlFor={brand} className="text-sm cursor-pointer">
                {brand}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          min={0}
          max={10000}
          step={100}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Sizes</h3>
        <div className="flex flex-wrap gap-2">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
            <button
              key={size}
              onClick={() => {
                if (selectedSizes.includes(size)) {
                  setSelectedSizes(selectedSizes.filter((s) => s !== size));
                } else {
                  setSelectedSizes([...selectedSizes, size]);
                }
              }}
              className={`px-3 py-1.5 text-sm border rounded ${selectedSizes.includes(size)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary'
                }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Colors</h3>
        <div className="flex flex-wrap gap-2">
          {colorsList.slice(0, 12).map((color) => (
            <button
              key={color.name}
              onClick={() => {
                if (selectedColors.includes(color.name)) {
                  setSelectedColors(selectedColors.filter((c) => c !== color.name));
                } else {
                  setSelectedColors([...selectedColors, color.name]);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded ${selectedColors.includes(color.name)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary'
                }`}
            >
              <span
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: color.hex }}
              />
              {color.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <Layout>
      <div
        className={cn(
          'min-h-[50vh]',
          catalogCategorySlug === 'men' && 'bg-gradient-to-b from-sky-950/[0.06] via-background to-background',
          catalogCategorySlug === 'women' && 'bg-gradient-to-b from-rose-950/[0.07] via-background to-background',
          catalogCategorySlug === 'kids' && 'bg-gradient-to-b from-amber-950/[0.06] via-background to-background',
          catalogCategorySlug === 'accessories' && 'bg-gradient-to-b from-amber-950/[0.05] via-background to-background',
        )}
      >
        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-muted-foreground md:mb-5">
            <Link to="/" className="transition hover:text-primary">
              Home
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="capitalize text-foreground">
              {category || 'All Products'}
              {subcategory && ` / ${subcategory}`}
            </span>
          </nav>

          {catalogCategorySlug ? (
            <CategoryPageHero
              category={catalogCategorySlug}
              itemCount={filteredProducts.length}
              loading={catalogLoading}
            />
          ) : (
            <div className="mb-8 flex flex-col gap-1 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-sans text-3xl font-bold tracking-tight capitalize md:text-4xl">
                  <span className="text-gradient-styvia bg-[length:200%_auto]">
                    {search
                      ? `Search: "${search}"`
                      : category
                        ? `${category}'s fashion`
                        : 'All products'}
                  </span>
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {catalogLoading ? 'Loading catalog…' : `${filteredProducts.length} items found`}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-6 lg:gap-10">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur-md">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold tracking-tight">Filters</h2>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Filter className="h-4 w-4" />
                  </div>
                </div>
                <FilterContent />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort & Filter Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/40 px-3 py-3 backdrop-blur-sm md:px-4">
              {/* Mobile Filter Button */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <div className="flex items-center gap-4 ml-auto">
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Grid Toggle */}
                <div className="hidden md:flex items-center gap-1 border rounded">
                  <button
                    onClick={() => setGridCols(3)}
                    className={`p-2 ${gridCols === 3 ? 'bg-secondary' : ''}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGridCols(4)}
                    className={`p-2 ${gridCols === 4 ? 'bg-secondary' : ''}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedBrands.length > 0 || selectedSizes.length > 0 || selectedColors.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedBrands.map((brand) => (
                  <span
                    key={brand}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                  >
                    {brand}
                    <button
                      onClick={() =>
                        setSelectedBrands(selectedBrands.filter((b) => b !== brand))
                      }
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedSizes.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                  >
                    Size: {size}
                    <button
                      onClick={() =>
                        setSelectedSizes(selectedSizes.filter((s) => s !== size))
                      }
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedColors.map((color) => (
                  <span
                    key={color}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                  >
                    Color: {color}
                    <button
                      onClick={() =>
                        setSelectedColors(selectedColors.filter((c) => c !== color))
                      }
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {catalogCategorySlug &&
              searchBroadenedToCategory &&
              search?.trim() &&
              !catalogLoading && (
                <div
                  className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/[0.07] px-4 py-3 text-sm text-foreground"
                  role="status"
                >
                  <p className="mb-3 leading-relaxed">
                    No products matched <span className="font-semibold">&quot;{search}&quot;</span> in{' '}
                    <span className="capitalize">{catalogCategorySlug}</span>. Showing the full collection so you
                    can still browse — your catalog may not list that exact item for this aisle yet.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={clearUrlSearch}>
                    Clear search
                  </Button>
                </div>
              )}

            {discount &&
              discountRelaxedFromUrl &&
              !catalogLoading && (
                <div
                  className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/[0.07] px-4 py-3 text-sm text-foreground"
                  role="status"
                >
                  <p className="mb-3 leading-relaxed">
                    Nothing in the catalog is at <span className="font-semibold">{discount}%+ off</span> right now.
                    Showing all products sorted by <span className="font-semibold">best discount</span> first.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                    Clear deal filters
                  </Button>
                </div>
              )}

            {/* Product Grid */}
            {catalogLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
                <p className="text-sm font-medium">Loading products…</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div
                className={`grid grid-cols-2 gap-4 md:gap-5 ${gridCols === 3
                    ? 'md:grid-cols-3'
                    : 'md:grid-cols-3 lg:grid-cols-4'
                  }`}
              >
                {filteredProducts.map((product, i) => (
                  <div
                    key={product.id}
                    className="animate-home-reveal-up"
                    style={{ animationDelay: `${Math.min(i, 16) * 40}ms` }}
                  >
                    <ProductCard product={withLocalListingImages(product)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-xl font-semibold text-muted-foreground mb-4">
                  No products found
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
