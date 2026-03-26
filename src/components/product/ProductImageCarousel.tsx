import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const safe = images.length ? images : ['https://via.placeholder.com/600x800?text=No+image'];
  const i = Math.min(Math.max(0, index), safe.length - 1);

  const prev = () => onIndexChange((i - 1 + safe.length) % safe.length);
  const next = () => onIndexChange((i + 1) % safe.length);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border bg-muted/30">
        <img src={safe[i]} alt={alt} className="h-full w-full object-cover" />
        {safe.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md"
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
              key={idx}
              type="button"
              onClick={() => onIndexChange(idx)}
              className={cn(
                'h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity',
                idx === i ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
