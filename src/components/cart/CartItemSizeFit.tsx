import type { ProductFitSnapshot } from '@/hooks/useCartFitSnapshots';
import { isRecommendedSize, scoreForSelectedSize } from '@/hooks/useCartFitSnapshots';
import { fitConfidenceLabel } from '@/features/fit/fitLabels';
import { cn } from '@/lib/utils';

interface CartItemSizeFitProps {
  selectedSize: string;
  fit?: ProductFitSnapshot;
  loading: boolean;
  isLoggedIn: boolean;
  hasProfile: boolean;
  compact?: boolean;
}

export default function CartItemSizeFit({
  selectedSize,
  fit,
  loading,
  isLoggedIn,
  hasProfile,
  compact,
}: CartItemSizeFitProps) {
  if (!isLoggedIn) {
    return <span className={cn(compact && 'text-[11px]')}>Size {selectedSize}</span>;
  }
  if (loading) {
    return <span className="text-muted-foreground">Fit…</span>;
  }
  if (!hasProfile || !fit) {
    return <span className={cn(compact && 'text-[11px]')}>Size {selectedSize}</span>;
  }
  const score = scoreForSelectedSize(fit, selectedSize);
  const rec = isRecommendedSize(fit, selectedSize);
  if (score == null) {
    return <span className={cn(compact && 'text-[11px]')}>Size {selectedSize}</span>;
  }
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-1.5', compact && 'text-[11px]')}>
      <span>Size {selectedSize}</span>
      <span className="text-muted-foreground">·</span>
      <span className="tabular-nums">{Math.round(score)}%</span>
      <span className="text-muted-foreground">({fitConfidenceLabel(score)})</span>
      {rec && (
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Recommended</span>
      )}
    </span>
  );
}
