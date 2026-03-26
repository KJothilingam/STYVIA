import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import fitService, { FitConfidenceResponse, OutfitRecommendationDTO } from '@/services/fitService';
import bodyProfileService, { type BodyShape, type BodyProfileDTO } from '@/services/bodyProfileService';
import productService from '@/services/productService';
import wardrobeService, { WardrobeItemDTO } from '@/services/wardrobeService';
import { Product } from '@/types';
import { fitConfidenceLabel } from '@/features/fit/fitLabels';

/** When the user has no body profile, show a neutral “typical range” estimate (not personalized). */
function estimateGenericFitRows(sizes: string[]): { size: string; confidence: number; label: string; isBest: boolean }[] {
  if (!sizes.length) return [];
  const n = sizes.length;
  const bestIdx = Math.floor(n / 2);
  return sizes.map((size, i) => {
    const dist = Math.abs(i - bestIdx);
    const confidence = Math.round(Math.max(48, Math.min(88, 86 - dist * 11)));
    const isBest = i === bestIdx;
    const label = fitConfidenceLabel(confidence);
    return { size, confidence, label, isBest };
  });
}

function fitRowsFromApi(
  sizes: string[],
  fit: FitConfidenceResponse
): { size: string; confidence: number; label: string; isBest: boolean }[] {
  const map = new Map<string, number>();
  if (fit.allSizes?.length) {
    fit.allSizes.forEach((s) => map.set(s.size, s.confidence));
  } else if (fit.breakdown?.length) {
    fit.breakdown.forEach((b) => map.set(b.size, b.finalScore ?? b.score));
  }
  const rec = fit.recommendedSize;
  return sizes.map((size) => {
    const confidence = map.get(size) ?? 0;
    const isBest = rec != null && rec === size;
    return { size, confidence, label: fitConfidenceLabel(confidence), isBest };
  });
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    const pid = id ?? '';
    const numId = Number(pid);
    if (!isNaN(numId)) {
      productService.getProductById(numId).then(setProduct).catch(() => setProduct(getMockProduct(pid) ?? null)).finally(() => setLoading(false));
    } else {
      setProduct(getMockProduct(pid) ?? null);
      setLoading(false);
    }
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

  const productIdNum = id ? Number(id) : NaN;
  const canUseFit = user && !isNaN(productIdNum);

  const [fitResult, setFitResult] = useState<FitConfidenceResponse | null>(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [outfitResult, setOutfitResult] = useState<OutfitRecommendationDTO | null>(null);
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [hasBodyProfile, setHasBodyProfile] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [quickHeight, setQuickHeight] = useState(170);
  const [quickWeight, setQuickWeight] = useState(70);
  const [quickBodyShape, setQuickBodyShape] = useState<BodyShape>('REGULAR');
  const [savingQuickProfile, setSavingQuickProfile] = useState(false);
  const outfitFetchedRef = useRef(false);

  useEffect(() => {
    outfitFetchedRef.current = false;
  }, [productIdNum]);

  useEffect(() => {
    if (user) bodyProfileService.hasProfile().then(setHasBodyProfile).catch(() => setHasBodyProfile(false));
    else setHasBodyProfile(false);
  }, [user]);

  const loadFitConfidence = useCallback(() => {
    if (!user || !hasBodyProfile || Number.isNaN(productIdNum)) return;
    setFitLoading(true);
    fitService
      .getFitConfidence(productIdNum)
      .then(setFitResult)
      .catch(() => {
        setFitResult(null);
        toast({ title: 'Could not load fit analysis.', variant: 'destructive' });
      })
      .finally(() => setFitLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast stable enough; omit to avoid refetch loops
  }, [user, hasBodyProfile, productIdNum]);

  useEffect(() => {
    if (canUseFit && hasBodyProfile && !Number.isNaN(productIdNum)) {
      loadFitConfidence();
    } else {
      setFitResult(null);
    }
  }, [canUseFit, hasBodyProfile, productIdNum, loadFitConfidence]);

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

  useEffect(() => {
    if (!user || !hasBodyProfile || !fitResult || outfitFetchedRef.current || Number.isNaN(productIdNum)) return;
    outfitFetchedRef.current = true;
    handleGetOutfit();
  }, [user, hasBodyProfile, fitResult, productIdNum, handleGetOutfit]);

  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [wardrobeItemForProduct, setWardrobeItemForProduct] = useState<WardrobeItemDTO | null>(null);

  useEffect(() => {
    if (product?.category) {
      productService.filterProducts({ categorySlug: product.category, size: 6 }).then((res) => {
        setSimilarProducts(res.content.filter((p) => p.id !== product.id).slice(0, 5));
      }).catch(() => setSimilarProducts(mockProducts.filter((p) => p.category === product?.category && p.id !== product?.id).slice(0, 5)));
    }
  }, [product?.id, product?.category]);

  useEffect(() => {
    if (!user || !product) return;
    wardrobeService.getWardrobe().then((items) => {
      const match = items.find((w) => String(w.productId) === String(product.id));
      setWardrobeItemForProduct(match ?? null);
    }).catch(() => setWardrobeItemForProduct(null));
  }, [user, product?.id]);

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

  const handleAddToBag = () => {
    if (!selectedSize) {
      toast({ title: 'Please select a size', variant: 'destructive' });
      return;
    }
    const color = selectedColor || product.colors[0]?.name || '';
    addToCart(product, selectedSize, color);
    toast({ title: 'Added to bag!', description: `${product.name} has been added to your bag.` });
  };

  const handleWishlistToggle = () => {
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

  const inferGender = (): BodyProfileDTO['gender'] => {
    if (product?.category === 'women') return 'WOMEN';
    if (product?.category === 'kids') return 'KIDS';
    return 'MEN';
  };

  const fitDisplayRows = useMemo(() => {
    if (!product?.sizes?.length) return [];
    if (user && hasBodyProfile && fitResult) return fitRowsFromApi(product.sizes, fitResult);
    return estimateGenericFitRows(product.sizes);
  }, [product?.sizes, user, hasBodyProfile, fitResult]);

  const fitIsPersonalized = !!(user && hasBodyProfile && fitResult);

  const openTryOnFlow = () => {
    if (!user) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    if (!hasBodyProfile) {
      setProfileModalOpen(true);
      return;
    }
    navigate(`/fit-studio/${product.id}`);
  };

  const handleQuickProfileSave = async () => {
    setSavingQuickProfile(true);
    try {
      const dto: BodyProfileDTO = {
        heightCm: quickHeight,
        weightKg: quickWeight,
        gender: inferGender(),
        bodyShape: quickBodyShape,
        shoulderWidth: 'NORMAL',
        chestType: 'AVERAGE',
        waistType: 'AVERAGE',
        fitPreference: 'REGULAR',
      };
      await bodyProfileService.save(dto);
      setHasBodyProfile(true);
      setProfileModalOpen(false);
      toast({ title: "You're set!", description: 'Personalized fit scores are loading…' });
      loadFitConfidence();
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
        <Home className="w-5 h-5" /> Wardrobe Lifecycle Insights
      </h2>
      {!user ? (
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-primary font-medium underline">Log in</Link> and add items from orders to track wear and lifecycle.
        </p>
      ) : wardrobeItemForProduct ? (
        <div className="border rounded-lg p-4 bg-card space-y-4">
          <p className="text-sm font-medium">Wear count: {wardrobeItemForProduct.wearCount}</p>
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
        <div className="border rounded-lg p-4 bg-muted/50 text-sm text-muted-foreground">
          After you buy this item, sync it from <Link to="/orders" className="text-primary font-medium underline">Orders</Link> in <Link to="/wardrobe" className="text-primary font-medium underline">My Wardrobe</Link> to track wear count and get lifecycle suggestions.
        </div>
      )}
    </section>
  );

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
                      className={cn('h-4 w-4', i <= Math.round(product.rating) ? 'fill-current' : '')}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating.toFixed(1)} · {product.reviewCount.toLocaleString()} reviews
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
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      'min-h-12 min-w-[3rem] border-2 px-4 text-sm font-semibold transition-all',
                      selectedSize === size
                        ? 'border-[hsl(var(--intelligence-deep))] bg-[hsl(var(--intelligence-deep))] text-white'
                        : 'border-border bg-background text-foreground hover:border-intelligence-mid/40'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>

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
                      See how this will fit you using AI — then try it on your body in Fit Studio.
                    </p>
                  </div>
                </div>
              </div>

              {/* FIT ANALYSIS */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Fit analysis
                </h3>
                {fitLoading && user && hasBodyProfile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating personalized scores…
                  </div>
                )}
                <ul className="rounded-xl border bg-card divide-y">
                  {fitDisplayRows.map((row) => (
                    <li
                      key={row.size}
                      className={cn(
                        'flex items-center justify-between gap-3 px-4 py-3 text-sm',
                        row.isBest && 'bg-primary/5'
                      )}
                    >
                      <span className="font-semibold tabular-nums">Size {row.size}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="tabular-nums font-medium">{row.confidence}%</span>
                      <span className="flex-1 text-right text-muted-foreground">
                        {row.label}
                        {row.isBest && ' ✓'}
                      </span>
                    </li>
                  ))}
                </ul>
                {!fitIsPersonalized && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Showing a typical size curve for this product. Add your measurements (quick form below) to unlock{' '}
                    <strong className="text-foreground">your</strong> AI scores.
                  </p>
                )}
              </div>

              {/* Primary CTAs — Try on first */}
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={openTryOnFlow}
                  className="h-14 w-full text-base font-bold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
                >
                  Try this on your body
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={openTryOnFlow}
                  className="h-12 w-full text-sm font-semibold border-2 border-intelligence-mid/50"
                >
                  Try on my body — Fit Studio
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={handleAddToBag}
                  className="h-14 w-full text-lg font-bold bg-red-600 hover:bg-red-700 text-white"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Add to cart
                </Button>
              </div>

              {/* Complete the Look — after fit + main actions */}
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
                              <Link to={`/product/${item.product.id}`} className="block">
                                {item.product.images?.[0] && (
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    className="aspect-[4/5] w-full object-cover"
                                  />
                                )}
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
            </div>

            {/* Color */}
            {product.colors.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">Color</h2>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={cn(
                        'h-11 w-11 rounded-full border-2 transition-all ring-offset-2 ring-offset-background',
                        selectedColor === color.name
                          ? 'scale-105 border-intelligence-mid ring-2 ring-intelligence-mid/30'
                          : 'border-border hover:border-muted-foreground'
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
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
              <Label>Body type</Label>
              <Select value={quickBodyShape} onValueChange={(v) => setQuickBodyShape(v as BodyShape)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SLIM">Slim</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="ATHLETIC">Athletic</SelectItem>
                  <SelectItem value="HEAVY">Heavy</SelectItem>
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
