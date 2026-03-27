import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  Heart,
  ShoppingBag,
  Share2,
  ChevronRight,
  Truck,
  RotateCcw,
  Shield,
  Check,
  Home,
  Shirt,
  MessageSquare,
  Star,
  PenLine,
  Sparkles,
  Zap,
  Loader2,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useStore } from '@/context/StoreContext';
import { getProductById as getMockProduct, products as mockProducts } from '@/data/products';
import { useToast } from '@/hooks/use-toast';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { cn } from '@/lib/utils';
import ProductImageCarousel from '@/components/product/ProductImageCarousel';
import SafeProductImage from '@/components/SafeProductImage';
import fitService, { FitCheckResponse, OutfitRecommendationDTO } from '@/services/fitService';
import bodyProfileService, { type BodyProfileDTO, type FitPreference } from '@/services/bodyProfileService';
import productService from '@/services/productService';
import wardrobeService, { WardrobeItemDTO } from '@/services/wardrobeService';
import localWardrobeService from '@/services/localWardrobeService';
import { Product } from '@/types';
import FitResultCard from '@/components/fit/FitResultCard';

/** Numeric catalog id for API calls (fit, wardrobe server). Mock routes like /product/m5 return null — wardrobe falls back to device storage. */
function resolveNumericCatalogProductId(routeId: string | undefined, productId: string | undefined): number | null {
  const rid = (routeId ?? '').trim();
  if (/^\d+$/.test(rid)) {
    const n = Number(rid);
    return n > 0 ? n : null;
  }
  const pid = String(productId ?? '').trim();
  if (/^\d+$/.test(pid)) {
    const n = Number(pid);
    return n > 0 ? n : null;
  }
  return null;
}

function fitCheckApiError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (err.response?.status === 401) {
      return 'Please log in again.';
    }
    if (err.response?.status === 404) {
      return 'Product not found in the catalog.';
    }
    if (!err.response) {
      return 'No response from server — start the backend (e.g. port 8080) and check VITE_API_BASE_URL.';
    }
  }
  return 'Could not check fit right now. Try again.';
}

function wardrobeAddErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string; details?: Record<string, string> } | undefined;
    if (data?.details && Object.keys(data.details).length > 0) {
      return Object.values(data.details).join(' ');
    }
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (err.response?.status === 401) {
      return 'Please log in again to save to your wardrobe.';
    }
    if (err.response?.status === 404) {
      return 'Product was not found in the catalog.';
    }
  }
  return 'Could not add to wardrobe. Try again.';
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    const pid = (id ?? '').trim();
    if (!pid) {
      setProduct(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const isNumericId = /^\d+$/.test(pid);
    const numericId = isNumericId ? Number(pid) : NaN;

    (async () => {
      try {
        if (isNumericId && numericId > 0) {
          const p = await productService.getProductById(numericId);
          if (!cancelled) setProduct(p);
        } else {
          // Prefer live catalog (numeric id) so Check Fit / wardrobe API work; mock is fallback only.
          try {
            const p = await productService.getProductBySlug(pid);
            if (!cancelled) setProduct(p);
          } catch {
            const fromMock = getMockProduct(pid);
            if (!cancelled) setProduct(fromMock ?? null);
          }
        }
      } catch {
        if (!cancelled) setProduct(getMockProduct(pid) ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Add to recently viewed when product loads
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product);
    }
  }, [product?.id]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');

  const { user, addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();
  const { toast } = useToast();
  const inWishlist = product ? isInWishlist(product.id) : false;

  const catalogProductId = product ? resolveNumericCatalogProductId(id, product.id) : null;
  const productIdNum = catalogProductId ?? NaN;
  /** Body-based fit check + outfit pairing: clothing only, not accessories. */
  const isGarmentFitCategory =
    !!product &&
    (product.category === 'men' || product.category === 'women' || product.category === 'kids');
  const canUseFit = user && catalogProductId != null && isGarmentFitCategory;

  const [fitResult, setFitResult] = useState<FitCheckResponse | null>(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [outfitResult, setOutfitResult] = useState<OutfitRecommendationDTO | null>(null);
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [hasBodyProfile, setHasBodyProfile] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [quickHeight, setQuickHeight] = useState(170);
  const [quickWeight, setQuickWeight] = useState(70);
  const [quickChest, setQuickChest] = useState(96);
  const [quickFitPreference, setQuickFitPreference] = useState<FitPreference>('REGULAR');
  const [savingQuickProfile, setSavingQuickProfile] = useState(false);
  const [pendingFitCheck, setPendingFitCheck] = useState(false);

  useEffect(() => {
    if (user) bodyProfileService.hasProfile().then(setHasBodyProfile).catch(() => setHasBodyProfile(false));
    else setHasBodyProfile(false);
  }, [user]);

  useEffect(() => {
    setFitResult(null);
    setOutfitResult(null);
  }, [product?.id, product?.category]);

  const runFitCheck = useCallback(() => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Log in to check fit.', variant: 'destructive' });
      return;
    }
    if (!isGarmentFitCategory) {
      toast({
        title: 'Fit check is for clothing only',
        description:
          'Use Check Fit on men’s, women’s, or kids’ apparel. For accessories, use Add to my wardrobe to track this item.',
        variant: 'destructive',
      });
      return;
    }
    if (catalogProductId == null || Number.isNaN(productIdNum)) {
      toast({
        title: 'Fit check needs a catalog product',
        description:
          'This product is demo-only (no server id). Open an item from the home page with the backend running, or use a numeric URL such as /product/1.',
        variant: 'destructive',
      });
      return;
    }
    const size = selectedSize.trim();
    if (!size) {
      toast({ title: 'Select a size first', variant: 'destructive' });
      return;
    }
    setFitLoading(true);
    fitService
      .checkFit(productIdNum, size)
      .then(setFitResult)
      .catch((e) => {
        setFitResult(null);
        toast({
          title: 'Could not check fit',
          description: fitCheckApiError(e),
          variant: 'destructive',
        });
      })
      .finally(() => setFitLoading(false));
  }, [user, productIdNum, catalogProductId, selectedSize, isGarmentFitCategory, toast]);

  const handleGetOutfit = useCallback(() => {
    if (!canUseFit || Number.isNaN(productIdNum)) return;
    setOutfitLoading(true);
    fitService
      .getOutfitRecommendation(productIdNum)
      .then(setOutfitResult)
      .catch(() => {
        toast({ title: 'Could not load outfit suggestions.', variant: 'destructive' });
      })
      .finally(() => setOutfitLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseFit, productIdNum]);

  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [wardrobeItemForProduct, setWardrobeItemForProduct] = useState<WardrobeItemDTO | null>(null);
  const [addingToWardrobe, setAddingToWardrobe] = useState(false);

  useEffect(() => {
    if (!product?.category) return;
    const genderByCategory: Record<string, string> = {
      men: 'MEN',
      women: 'WOMEN',
      kids: 'KIDS',
      accessories: 'UNISEX',
    };
    const gender = genderByCategory[product.category] ?? 'MEN';
    productService
      .filterProducts({ gender, page: 0, size: 12 })
      .then((res) => {
        setSimilarProducts(res.content.filter((p) => p.id !== product.id).slice(0, 5));
      })
      .catch(() =>
        setSimilarProducts(
          mockProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 5)
        )
      );
  }, [product?.id, product?.category]);

  useEffect(() => {
    if (!user || !product) {
      setWardrobeItemForProduct(null);
      return;
    }
    const pid = resolveNumericCatalogProductId(id, product.id);
    const color = (selectedColor || product.colors[0]?.name || 'Default').trim();
    const sizeNorm = selectedSize.trim();
    if (!sizeNorm || !color) {
      setWardrobeItemForProduct(null);
      return;
    }
    if (pid == null) {
      setWardrobeItemForProduct(
        localWardrobeService.findMatch(user.id, id, sizeNorm, color)
      );
      return;
    }
    wardrobeService
      .getWardrobe()
      .then((items) => {
        const match = items.find(
          (w) =>
            w.productId === pid &&
            String(w.size).trim() === sizeNorm &&
            String(w.color).trim() === color
        );
        setWardrobeItemForProduct(match ?? null);
      })
      .catch(() => setWardrobeItemForProduct(null));
  }, [user, id, product?.id, product?.colors, selectedSize, selectedColor]);

  const inferGender = (): BodyProfileDTO['gender'] => {
    if (product?.category === 'women') return 'WOMEN';
    if (product?.category === 'kids') return 'KIDS';
    return 'MEN';
  };

  const handleAddToBag = () => {
    if (!product) return;
    if (!selectedSize) {
      toast({ title: 'Please select a size', variant: 'destructive' });
      return;
    }
    const color = (selectedColor || product.colors[0]?.name || 'Default').trim();
    addToCart(product, selectedSize, color);
    toast({ title: 'Added to bag!', description: `${product.name} has been added to your bag.` });
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast({ title: 'Removed from wishlist' });
    } else {
      addToWishlist(product);
      toast({ title: 'Added to wishlist' });
    }
  };

  const checkDelivery = () => {
    if (pincode.length === 6) {
      setDeliveryInfo('Delivery available in 3-5 business days');
    } else {
      setDeliveryInfo('Please enter a valid 6-digit pincode');
    }
  };

  const handleAddToWardrobe = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    if (!product) return;
    if (!selectedSize.trim()) {
      toast({ title: 'Select a size first', variant: 'destructive' });
      return;
    }
    const color = (selectedColor || product.colors[0]?.name || 'Default').trim();
    const pid = resolveNumericCatalogProductId(id, product.id);
    if (pid == null) {
      const dto = localWardrobeService.addOrMerge(user.id, {
        routeKey: id ?? product.id,
        productName: product.name,
        size: selectedSize.trim(),
        color,
        imageUrl: product.images[0] ?? null,
      });
      setWardrobeItemForProduct(dto);
      toast({
        title: 'Added to wardrobe',
        description:
          'Saved on this device for this product page. Shop catalog items also sync to your account.',
      });
      return;
    }
    setAddingToWardrobe(true);
    try {
      const dto = await wardrobeService.addFromProduct(pid, {
        size: selectedSize.trim(),
        color,
        fitConfidence: fitResult?.confidence,
      });
      setWardrobeItemForProduct(dto);
      toast({ title: 'Added to wardrobe', description: 'Saved to your account — open My Wardrobe anytime.' });
    } catch (e) {
      toast({
        title: 'Could not add to wardrobe',
        description: wardrobeAddErrorMessage(e),
        variant: 'destructive',
      });
    } finally {
      setAddingToWardrobe(false);
    }
  };

  const handleCheckFit = () => {
    if (!selectedSize?.trim()) {
      toast({ title: 'Please select a size first', variant: 'destructive' });
      return;
    }
    if (!user) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    if (!isGarmentFitCategory) {
      toast({
        title: 'Fit check is for clothing only',
        description:
          'Men’s, women’s, and kids’ pieces use your body profile. For accessories, add to wardrobe instead.',
        variant: 'destructive',
      });
      return;
    }
    if (catalogProductId == null) {
      toast({
        title: 'Fit check needs a catalog product',
        description:
          'Use Browse / Shop and open a product with a number in the URL. Demo product pages are not in the database.',
        variant: 'destructive',
      });
      return;
    }
    if (!hasBodyProfile) {
      setPendingFitCheck(true);
      setProfileModalOpen(true);
      toast({
        title: 'Body profile needed',
        description: 'Add height and weight in the form — then we compare this size to your measurements.',
      });
      return;
    }
    runFitCheck();
  };

  const chestTypeFromCm = (cm: number): BodyProfileDTO['chestType'] => {
    if (cm < 92) return 'SLIM';
    if (cm > 102) return 'BROAD';
    return 'AVERAGE';
  };

  const handleQuickProfileSave = async () => {
    setSavingQuickProfile(true);
    try {
      const dto: BodyProfileDTO = {
        heightCm: quickHeight,
        weightKg: quickWeight,
        gender: inferGender(),
        bodyShape: 'REGULAR',
        shoulderWidth: 'NORMAL',
        chestType: chestTypeFromCm(quickChest),
        waistType: 'AVERAGE',
        fitPreference: quickFitPreference,
      };
      await bodyProfileService.save(dto);
      setHasBodyProfile(true);
      setProfileModalOpen(false);
      toast({ title: "You're set!", description: 'Now checking your selected size.' });
      if (pendingFitCheck) {
        setPendingFitCheck(false);
        runFitCheck();
      }
    } catch {
      toast({ title: 'Could not save', variant: 'destructive' });
    } finally {
      setSavingQuickProfile(false);
    }
  };

  /** Wardrobe Lifecycle - line graph + insights */
  const renderWardrobeBlock = () => (
    <section>
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <Home className="w-5 h-5" /> My wardrobe
      </h2>
      {!user ? (
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-primary font-medium underline">Log in</Link> to save pieces you own. Orders
          are added to your wardrobe automatically; you can also add catalog items without buying.
        </p>
      ) : wardrobeItemForProduct ? (
        <div className="border rounded-lg p-4 bg-card space-y-4">
          <p className="text-sm font-medium">
            In your wardrobe
            {(wardrobeItemForProduct.quantity ?? 1) > 1 && (
              <span className="text-muted-foreground font-normal"> — qty {wardrobeItemForProduct.quantity ?? 1}</span>
            )}
            <span className="block text-muted-foreground font-normal text-xs mt-1">
              Wear count: {wardrobeItemForProduct.wearCount}
              {wardrobeItemForProduct.localOnly
                ? ' · On this device'
                : wardrobeItemForProduct.fromOrder
                  ? ' · From a purchase'
                  : ''}
            </span>
          </p>
          {/* Line graph - wear count over 14 months (decreasing trend) */}
          <div className="h-24 relative w-full">
            <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                points={Array.from({ length: 15 }, (_, i) => {
                  const x = (i / 14) * 200;
                  const y = 15 + 55 * (1 - i / 14);
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">Wear count over 14 months</p>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /> Continue using</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /> Repair suggested within 5 months</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /> Consider donation after 18 months</li>
          </ul>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-muted/50 text-sm text-muted-foreground space-y-3">
          <p>
            <strong className="text-foreground">Already own this?</strong> Choose size &amp; color above, then use{' '}
            <strong className="text-foreground">Add to my wardrobe</strong> — no order required.
          </p>
          <p>
            Bought here? Lines are added when you checkout. Older orders:{' '}
            <Link to="/wardrobe" className="text-primary font-medium underline">
              Wardrobe → Import missing order lines
            </Link>
            .
          </p>
        </div>
      )}
    </section>
  );

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products?category=${product.category}`} className="hover:text-primary capitalize">
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* LEFT: product images carousel only */}
          <div className="lg:sticky lg:top-28">
            <ProductImageCarousel
              images={product.images}
              alt={product.name}
              index={selectedImage}
              onIndexChange={setSelectedImage}
              overlay={
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/95 shadow-md backdrop-blur-sm transition hover:bg-background',
                    inWishlist && 'border-primary bg-primary text-primary-foreground'
                  )}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={cn('h-5 w-5', inWishlist && 'fill-current')} />
                </button>
              }
            />
          </div>

          {/* RIGHT: title → price → size (then rest) */}
          <div className="min-w-0 space-y-8">
            {/* Title */}
            <header>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{product.brand}</p>
              <h1 className="font-display-hero mt-2 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
                {product.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i <= Math.round(Number(product.rating) || 0) ? 'fill-current' : ''
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {(Number(product.rating) || 0).toFixed(1)} ·{' '}
                  {(Number(product.reviewCount) || 0).toLocaleString()} reviews
                </span>
              </div>
            </header>

            {/* Price */}
            <div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl font-bold tabular-nums text-foreground md:text-5xl">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.discount > 0 && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-bold text-primary">
                      {product.discount}% off
                    </span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Inclusive of all taxes</p>
            </div>

            {/* Size selector + Fit journey */}
            <div className="space-y-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Size</h2>
                <button type="button" className="text-sm font-semibold text-intelligence-mid hover:underline">
                  Size chart
                </button>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-3">
                {product.sizes.map((size) => {
                  const sizeStr = String(size).trim();
                  const sizeSelected = selectedSize.trim() === sizeStr;
                  const suggested = fitResult?.suggestedSize != null ? String(fitResult.suggestedSize).trim() : '';
                  const showBestFit =
                    isGarmentFitCategory && suggested !== '' && suggested === sizeStr;
                  return (
                    <div key={sizeStr} className="flex flex-col items-center gap-1.5">
                      {/* Fixed-height slot so every column lines up; badge never overlaps the button */}
                      <div
                        className="flex h-7 w-full min-w-[3.25rem] items-center justify-center px-0.5"
                        aria-hidden={!showBestFit}
                      >
                        {showBestFit ? (
                          <span className="rounded-full bg-green-600 px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm">
                            Best fit
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSize(sizeStr)}
                        aria-pressed={sizeSelected}
                        aria-label={showBestFit ? `${sizeStr}, suggested best fit` : sizeStr}
                        className={cn(
                          'min-h-12 min-w-[3rem] rounded-md border-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                          sizeSelected
                            ? 'border-primary bg-primary text-white shadow-md ring-2 ring-primary/40 ring-offset-2 ring-offset-background dark:text-white'
                            : 'border-border bg-card text-foreground hover:border-primary/60 hover:bg-muted/60'
                        )}
                      >
                        {sizeStr}
                      </button>
                    </div>
                  );
                })}
              </div>

              {isGarmentFitCategory ? (
                <>
                  {/* Check your fit — hero copy */}
                  <div className="rounded-2xl border-2 border-intelligence-mid/30 bg-gradient-to-br from-intelligence-deep/[0.08] to-background p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/90 text-amber-950 shadow-sm">
                        <Zap className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold tracking-tight text-foreground md:text-lg">
                          Check your fit instantly
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          Pick a size, then <strong className="text-foreground">Check Fit</strong> — we compare that size
                          to your <strong className="text-foreground">Body</strong> profile and say if it should feel tight,
                          comfortable, or loose, and whether another in-stock size might suit you better.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* FIT CHECK */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                      Check fit
                    </h3>
                    {fitLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking selected size...
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCheckFit}
                      disabled={fitLoading || !selectedSize?.trim() || (!!user && catalogProductId == null)}
                    >
                      {fitLoading ? 'Checking fit...' : 'Check Fit'}
                    </Button>
                    {!selectedSize?.trim() ? (
                      <p className="mt-2 text-xs text-muted-foreground">Select a size to check your fit.</p>
                    ) : null}
                    {user && catalogProductId == null ? (
                      <p className="mt-2 text-xs text-amber-800 dark:text-amber-200/90">
                        This page is using <strong className="font-medium">demo catalog data</strong> (e.g.{' '}
                        <code className="rounded bg-muted px-1">/product/m5</code>), so Check Fit can&apos;t call the
                        server. With the backend running, open a product from the{' '}
                        <Link to="/" className="text-primary font-medium underline underline-offset-2">
                          home page
                        </Link>{' '}
                        (live list) or use a numeric link like{' '}
                        <code className="rounded bg-muted px-1">/product/1</code>.
                      </p>
                    ) : null}
                    {user && catalogProductId != null && !hasBodyProfile ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        First time? We&apos;ll ask for a quick body profile (height, weight) when you tap Check Fit.
                      </p>
                    ) : null}
                    {fitResult ? (
                      <div className="mt-3">
                        <FitResultCard result={fitResult} selectedSize={selectedSize} />
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border/80 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Accessories</strong> — fit check is for{' '}
                    <strong className="text-foreground">men&apos;s, women&apos;s, and kids&apos; clothing</strong> only.
                    You can still <strong className="text-foreground">add to cart</strong> or{' '}
                    <strong className="text-foreground">add to My wardrobe</strong> to track this piece.
                  </p>
                </div>
              )}

              {/* Primary CTAs */}
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleAddToBag}
                  className="h-14 w-full text-lg font-bold bg-red-600 hover:bg-red-700 text-white"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Add to cart
                </Button>
                {user && !wardrobeItemForProduct && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleAddToWardrobe}
                    disabled={addingToWardrobe}
                    className="h-12 w-full border-2 border-[hsl(var(--intelligence-mid)/0.45)] font-semibold"
                  >
                    {addingToWardrobe ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Shirt className="w-5 h-5 mr-2" />
                        Add to my wardrobe
                      </>
                    )}
                  </Button>
                )}
                {user && wardrobeItemForProduct && (
                  <Button type="button" variant="secondary" size="lg" className="h-11 w-full" asChild>
                    <Link to="/wardrobe">View in wardrobe</Link>
                  </Button>
                )}
              </div>

              {isGarmentFitCategory ? (
                <section className="rounded-2xl border border-intelligence-mid/20 bg-intelligence-deep/[0.04] p-5">
                  <h2 className="text-lg font-bold mb-1 flex items-center gap-2 font-display-hero">
                    <Sparkles className="h-5 w-5 text-intelligence-mid shrink-0" aria-hidden />
                    Complete the look
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    Best fit found — now complete your outfit with pieces that match your profile (75%+ fit).
                  </p>
                  {!user ? (
                    <p className="text-sm text-muted-foreground">
                      <button
                        type="button"
                        className="font-medium text-intelligence-mid underline"
                        onClick={() => navigate('/login', { state: { from: `/product/${id}` } })}
                      >
                        Log in
                      </button>{' '}
                      to see curated pairings.
                    </p>
                  ) : outfitLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finding pieces…
                    </div>
                  ) : !outfitResult ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGetOutfit}
                      className="border-intelligence-mid/40"
                    >
                      Load outfit ideas
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const completeLookItems = (outfitResult.items ?? []).filter((i) => i.fitConfidence >= 75).slice(0, 3);
                        if (completeLookItems.length === 0) {
                          return (
                            <p className="text-xs text-muted-foreground">
                              No pieces met the 75% threshold yet — try again later or browse similar styles.
                            </p>
                          );
                        }
                        return (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {completeLookItems.map((item) => (
                              <div
                                key={item.product.id}
                                className="overflow-hidden rounded-lg border border-border bg-background shadow-sm"
                              >
                                <Link to={`/product/${item.product.id}`} className="relative block aspect-[4/5] w-full overflow-hidden">
                                  <SafeProductImage
                                    urls={item.product.images ?? []}
                                    alt={item.product.name}
                                    className="absolute inset-0"
                                  />
                                  <div className="p-2">
                                    <p className="line-clamp-2 text-xs font-semibold">{item.product.name}</p>
                                    <p className="text-[10px] text-intelligence-mid mt-1">
                                      {item.fitConfidence}% fit · {item.suggestedSize || '—'}
                                    </p>
                                  </div>
                                </Link>
                                <div className="px-2 pb-2">
                                  <Button
                                    size="sm"
                                    className="w-full h-8 text-xs bg-intelligence-deep hover:bg-intelligence-mid"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const p = item.product;
                                      const size = item.suggestedSize || p.sizes?.[0] || 'M';
                                      const color = p.colors?.[0]?.name ?? '';
                                      addToCart(p, size, color);
                                      toast({ title: 'Added to bag!', description: `${p.name} added.` });
                                    }}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </section>
              ) : null}
            </div>

            {/* Color */}
            {product.colors.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">Color</h2>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => {
                    const isSel = String(selectedColor).trim() === String(color.name).trim();
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        aria-pressed={isSel}
                        className={cn(
                          'relative h-11 w-11 shrink-0 rounded-full border-2 transition-all ring-offset-2 ring-offset-background',
                          isSel
                            ? 'scale-105 border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md'
                            : 'border-border shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] hover:border-primary/50 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {isSel && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35">
                            <Check className="h-5 w-5 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wishlist shortcut (add to cart lives above next to Try On) */}
            <div className="flex gap-4 mb-6">
              <Button
                variant="outline"
                onClick={handleWishlistToggle}
                className={cn(
                  'flex-1 h-12 text-base font-bold border-2',
                  inWishlist && 'border-primary text-primary'
                )}
              >
                <Heart className={cn('w-5 h-5 mr-2', inWishlist && 'fill-current')} />
                Wishlist
              </Button>
            </div>

            {/* Delivery Check */}
            <div className="mb-6">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-3">
                Delivery Options
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                  className="max-w-[200px]"
                />
                <Button variant="outline" onClick={checkDelivery}>
                  Check
                </Button>
              </div>
              {deliveryInfo && (
                <p className="text-sm text-muted-foreground mt-2">{deliveryInfo}</p>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">14 Day Returns</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">100% Original</p>
              </div>
            </div>

            {/* Product Details Accordion */}
            <Accordion type="single" collapsible className="mt-6">
              <AccordionItem value="description">
                <AccordionTrigger className="text-sm font-bold uppercase">
                  Product Description
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="material">
                <AccordionTrigger className="text-sm font-bold uppercase">
                  Material & Care
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{product.material}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Machine wash cold with similar colors.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Share */}
            <button className="flex items-center gap-2 text-sm text-muted-foreground mt-6 hover:text-primary">
              <Share2 className="w-4 h-4" />
              Share this product
            </button>
          </div>
        </div>

        <div className="mt-12 border-t pt-10">{renderWardrobeBlock()}</div>

        {/* Customer Reviews - five gold stars, WRITE A REVIEW red outline with pen icon */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" /> Customer Reviews
          </h2>
          <div className="border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-0.5 text-yellow-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm font-medium">Rahul Jsin</span>
              <span className="text-xs text-muted-foreground">11 Mar 2024</span>
            </div>
            <p className="text-sm text-muted-foreground">Good quality and fits perfectly! Highly recommended.</p>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="border-2 border-red-600 text-red-600 hover:bg-red-50">
              <PenLine className="w-4 h-4 mr-2" />
              WRITE A REVIEW
            </Button>
            <Button variant="outline" onClick={handleWishlistToggle} className="border-2">
              <Heart className={cn('w-4 h-4 mr-2', inWishlist && 'fill-current')} />
              WISHLIST
            </Button>
          </div>
        </section>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick fit setup</DialogTitle>
            <DialogDescription>
              Enter a few details — we&apos;ll save your profile and refresh scores on this page. No need to leave.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="quick-height">Height (cm)</Label>
              <Input
                id="quick-height"
                type="number"
                min={120}
                max={220}
                value={quickHeight}
                onChange={(e) => setQuickHeight(Number(e.target.value) || 170)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-weight">Weight (kg)</Label>
              <Input
                id="quick-weight"
                type="number"
                min={35}
                max={200}
                value={quickWeight}
                onChange={(e) => setQuickWeight(Number(e.target.value) || 70)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-chest">Chest (cm)</Label>
              <Input
                id="quick-chest"
                type="number"
                min={70}
                max={150}
                value={quickChest}
                onChange={(e) => setQuickChest(Number(e.target.value) || 96)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fit preference</Label>
              <Select value={quickFitPreference} onValueChange={(v) => setQuickFitPreference(v as FitPreference)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SLIM">Slim</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="LOOSE">Loose</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setProfileModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleQuickProfileSave} disabled={savingQuickProfile}>
              {savingQuickProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                'Done — show my fit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ProductDetail;
