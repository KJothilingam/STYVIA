import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import SafeProductImage from '@/components/SafeProductImage';

interface ProductImageCarouselProps {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (i: number) => void;
  overlay?: ReactNode;
}

export default function ProductImageCarousel({
  images,
  alt,
  index,
  onIndexChange,
  overlay,
}: ProductImageCarouselProps) {
  const safe = images.map((s) => String(s).trim()).filter(Boolean);
  const i = safe.length === 0 ? 0 : Math.min(Math.max(0, index), safe.length - 1);

  const prev = () => onIndexChange((i - 1 + safe.length) % safe.length);
  const next = () => onIndexChange((i + 1) % safe.length);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border bg-muted/30">
        <SafeProductImage urls={safe} alt={alt} preferIndex={i} className="absolute inset-0" />
        {safe.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        {overlay && <div className="absolute right-3 top-3 z-10">{overlay}</div>}
      </div>
      {safe.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safe.map((src, idx) => (
            <button
              key={`${idx}-${src}`}
              type="button"
              onClick={() => onIndexChange(idx)}
              className={cn(
                'h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity',
                idx === i ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <SafeProductImage urls={[src]} alt="" className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
