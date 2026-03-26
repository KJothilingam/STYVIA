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
import type { Product } from '@/types';

const sortOptions = [
  { value: 'popular', label: 'Popularity' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'discount', label: 'Better Discount' },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [gridCols, setGridCols] = useState(4);
  const [catalogItems, setCatalogItems] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'popular';
  const discount = searchParams.get('discount');
  const brandFromUrl = searchParams.get('brand');

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogItems([]);
    (async () => {
      try {
        let content: Product[] = [];
        const q = search?.trim();
        if (q) {
          const page = await productService.searchProducts(q, 0, 100);
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
          const page = await productService.getAllProducts({ page: 0, size: 200 });
          content = page.content ?? [];
        }
        if (!cancelled) setCatalogItems(content);
      } catch {
        if (!cancelled) setCatalogItems(mockProducts);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, search]);

  const brandsList = useMemo(
    () => [...new Set(catalogItems.map((p) => p.brand))].sort(),
    [catalogItems],
  );
  const colorsList = useMemo(
    () =>
      Array.from(new Map(catalogItems.flatMap((p) => p.colors).map((c) => [c.name, c])).values()),
    [catalogItems],
  );

  const filteredProducts = useMemo(() => {
    let result = [...catalogItems];

    // Filter by category (accessories / unfiltered API lists)
    if (category && !search?.trim()) {
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

    // Filter by search
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.brand.toLowerCase().includes(lowerSearch) ||
          p.category.toLowerCase().includes(lowerSearch)
      );
    }

    // Filter by discount
    if (discount) {
      result = result.filter((p) => p.discount >= parseInt(discount));
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

    return result;
  }, [
    catalogItems,
    category,
    subcategory,
    search,
    sort,
    discount,
    brandFromUrl,
    priceRange,
    selectedBrands,
    selectedSizes,
    selectedColors,
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
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground capitalize">
            {category || 'All Products'}
            {subcategory && ` / ${subcategory}`}
          </span>
        </nav>

        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {search
                ? `Search results for "${search}"`
                : category
                  ? `${category}'s Fashion`
                  : 'All Products'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {catalogLoading ? 'Loading catalog…' : `${filteredProducts.length} items found`}
            </p>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Filters</h2>
                <Filter className="w-4 h-4" />
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort & Filter Bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
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

            {/* Product Grid */}
            {catalogLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
                <p className="text-sm font-medium">Loading products…</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div
                className={`grid gap-4 grid-cols-2 ${gridCols === 3
                    ? 'md:grid-cols-3'
                    : 'md:grid-cols-3 lg:grid-cols-4'
                  }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
    </Layout>
  );
};

export default Products;
