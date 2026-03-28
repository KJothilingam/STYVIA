import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import productService from '@/services/productService';
import bodyProfileService, { type BodyProfileDTO, type BodyShape, type ShoulderWidth } from '@/services/bodyProfileService';
import fitService, { type FitConfidenceResponse } from '@/services/fitService';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';
import { fitConfidenceLabel } from '@/features/fit/fitLabels';
import { VirtualTryOnAvatar } from '@/components/fit/VirtualTryOnAvatar';
import SafeProductImage from '@/components/SafeProductImage';

const BODY_SHAPES: BodyShape[] = ['SLIM', 'REGULAR', 'ATHLETIC', 'HEAVY'];
const SHOULDERS: ShoulderWidth[] = ['NARROW', 'NORMAL', 'BROAD'];

export default function FitStudio() {
  const { productId } = useParams<{ productId: string }>();
  const id = productId ? Number(productId) : NaN;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<BodyProfileDTO | null>(null);
  const [fit, setFit] = useState<FitConfidenceResponse | null>(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const initRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    productService
      .getProductById(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product) return;
    initRef.current = false;
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    bodyProfileService.get().then((p) => {
      if (cancelled) return;
      if (p) {
        setDraft({ ...p });
        initRef.current = true;
      } else if (!initRef.current) {
        const gender =
          product.category === 'women' ? 'WOMEN' : product.category === 'kids' ? 'KIDS' : 'MEN';
        setDraft({
          heightCm: 170,
          weightKg: 70,
          gender,
          bodyShape: 'REGULAR',
          shoulderWidth: 'NORMAL',
          chestType: 'AVERAGE',
          waistType: 'AVERAGE',
          fitPreference: 'REGULAR',
        });
        initRef.current = true;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [product]);

  const loadFit = useCallback(() => {
    if (!Number.isFinite(id)) return;
    setFitLoading(true);
    fitService
      .getFitConfidence(id)
      .then(setFit)
      .catch(() => setFit(null))
      .finally(() => setFitLoading(false));
  }, [id]);

  const persistDraft = useCallback(
    async (d: BodyProfileDTO) => {
      try {
        await bodyProfileService.save(d);
        loadFit();
      } catch {
        toast({ title: 'Could not save profile', variant: 'destructive' });
      }
    },
    [loadFit, toast]
  );

  useEffect(() => {
    if (!draft) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistDraft(draft), 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, persistDraft]);

  useEffect(() => {
    if (fit?.recommendedSize && !selectedSize) setSelectedSize(fit.recommendedSize);
  }, [fit?.recommendedSize, selectedSize]);

  useEffect(() => {
    if (!selectedSize && product?.sizes?.length) setSelectedSize(product.sizes[0]);
  }, [product?.sizes, selectedSize]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!product || !Number.isFinite(id)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-destructive font-medium">Product not found.</p>
          <Button asChild className="mt-6">
            <Link to="/products">Back to shop</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const sizes = product.sizes ?? [];
  const bySize = new Map<string, number>();
  if (fit?.allSizes?.length) fit.allSizes.forEach((s) => bySize.set(s.size, s.confidence));
  else if (fit?.breakdown?.length) fit.breakdown.forEach((b) => bySize.set(b.size, b.finalScore ?? b.score));

  const addFromStudio = async () => {
    if (!selectedSize) {
      toast({ title: 'Choose a size', variant: 'destructive' });
      return;
    }
    const color = product.colors?.[0]?.name ?? '';
    const ok = await addToCart(product, selectedSize, color);
    if (!ok) return;
    toast({ title: 'Added to bag', description: `${product.name} · ${selectedSize}` });
    navigate('/cart');
  };

  const patch = (partial: Partial<BodyProfileDTO>) => {
    if (!draft) return;
    setDraft({ ...draft, ...partial });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" size="sm" className="gap-2 mb-6" asChild>
          <Link to={`/product/${product.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to product
          </Link>
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">Fit Studio</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-muted/30 p-6 flex flex-col items-center justify-center min-h-[320px]">
              {draft && (product.images?.length ?? 0) > 0 && (
                <VirtualTryOnAvatar
                  productImageUrls={product.images ?? []}
                  productName={product.name}
                  heightCm={draft.heightCm}
                  weightKg={draft.weightKg}
                  bodyShape={draft.bodyShape}
                />
              )}
            </div>

            {draft && (
              <div className="space-y-5 rounded-xl border p-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <Label>Height</Label>
                    <span className="text-muted-foreground tabular-nums">{draft.heightCm} cm</span>
                  </div>
                  <Slider
                    min={140}
                    max={210}
                    step={1}
                    value={[draft.heightCm]}
                    onValueChange={([v]) => patch({ heightCm: v })}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <Label>Weight</Label>
                    <span className="text-muted-foreground tabular-nums">{draft.weightKg} kg</span>
                  </div>
                  <Slider
                    min={40}
                    max={140}
                    step={1}
                    value={[draft.weightKg]}
                    onValueChange={([v]) => patch({ weightKg: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body shape</Label>
                  <Select value={draft.bodyShape} onValueChange={(v) => patch({ bodyShape: v as BodyShape })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BODY_SHAPES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Shoulder type</Label>
                  <Select
                    value={draft.shoulderWidth}
                    onValueChange={(v) => patch({ shoulderWidth: v as ShoulderWidth })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOULDERS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border">
              <SafeProductImage urls={product.images ?? []} alt={product.name} className="absolute inset-0" />
              <div className="p-4">
                <p className="text-xs text-muted-foreground uppercase">{product.brand}</p>
                <p className="font-semibold">{product.name}</p>
                <p className="text-lg font-bold mt-1">₹{product.price.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-2">Fit scores</h3>
              {fitLoading && (
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating…
                </p>
              )}
              {fit?.recommendedSize && (
                <p className="text-sm font-medium text-primary mb-3">Best size: {fit.recommendedSize}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {sizes.map((sz) => {
                  const score = bySize.get(sz) ?? 0;
                  const active = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium ${
                        active ? 'bg-foreground text-background border-foreground' : 'border-border'
                      }`}
                    >
                      {sz} ({score}%)
                    </button>
                  );
                })}
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {sizes.map((sz) => {
                  const score = bySize.get(sz) ?? 0;
                  return (
                    <li key={sz} className="flex justify-between">
                      <span>{sz}</span>
                      <span>
                        {score}% — {fitConfidenceLabel(score)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Button size="lg" className="w-full h-12 font-bold" onClick={addFromStudio}>
              Add to cart · {selectedSize || '—'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
