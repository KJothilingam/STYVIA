import { useState, useEffect, useMemo } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

function isLoadableUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith('/') || t.startsWith('data:')) return true;
  try {
    const u = new URL(t);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export type SafeProductImageProps = {
  urls: Array<string | null | undefined>;
  alt: string;
  /** Outer wrapper — use e.g. `absolute inset-0` inside an aspect box */
  className?: string;
  classNameImg?: string;
  /** When using a carousel, set to the current slide index to retry that URL first */
  preferIndex?: number;
};

/**
 * Shows a product image only after a successful load; falls back through `urls` on error,
 * then a neutral placeholder (no broken-image icon).
 */
export default function SafeProductImage({
  urls,
  alt,
  className,
  classNameImg,
  preferIndex = 0,
}: SafeProductImageProps) {
  const cleanUrls = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of urls) {
      if (raw == null) continue;
      const s = String(raw).trim();
      if (!isLoadableUrl(s) || seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
    return out;
  }, [urls]);

  const urlKey = cleanUrls.join('\0');

  const [tryIndex, setTryIndex] = useState(0);
  const [failed, setFailed] = useState(() => cleanUrls.length === 0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const start = cleanUrls.length === 0 ? 0 : Math.min(Math.max(0, preferIndex), cleanUrls.length - 1);
    setTryIndex(start);
    setFailed(cleanUrls.length === 0);
    setLoaded(false);
  }, [urlKey, preferIndex, cleanUrls.length]);

  const src = cleanUrls[tryIndex];

  const handleError = () => {
    setLoaded(false);
    if (tryIndex < cleanUrls.length - 1) {
      setTryIndex((i) => i + 1);
    } else {
      setFailed(true);
    }
  };

  if (failed || !src) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center bg-muted text-muted-foreground',
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-9 w-9 shrink-0 opacity-35" strokeWidth={1.25} aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted/90" aria-hidden />}
      <img
        key={`${tryIndex}-${src}`}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={handleError}
        onLoad={() => setLoaded(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          loaded ? 'opacity-100' : 'opacity-0',
          classNameImg,
        )}
      />
    </div>
  );
}
