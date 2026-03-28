import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeProductImageUrl } from '@/lib/productAdapter';

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

function buildCleanUrls(urls: Array<string | null | undefined> | undefined): string[] {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const raw of urls ?? []) {
    if (raw == null) continue;
    const normalized = normalizeProductImageUrl(String(raw).trim());
    if (!normalized || !isLoadableUrl(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    parts.push(normalized);
  }
  return parts;
}

export type SafeProductImageProps = {
  urls: Array<string | null | undefined>;
  alt: string;
  /** Outer wrapper — use e.g. `absolute inset-0` inside an aspect box */
  className?: string;
  classNameImg?: string;
  /** When using a carousel, set to the current slide index to retry that URL first */
  preferIndex?: number;
  loading?: 'eager' | 'lazy';
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
  loading = 'eager',
}: SafeProductImageProps) {
  /** Derive every render so a new `images` array reference never leaves memoized state stale. */
  const cleanUrls = buildCleanUrls(urls);
  const urlKey = cleanUrls.join('\0');
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [tryIndex, setTryIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const len = cleanUrls.length;
    const start = len === 0 ? 0 : Math.min(Math.max(0, preferIndex), len - 1);
    setTryIndex(start);
    setFailed(len === 0);
    setLoaded(false);
  }, [urlKey, preferIndex]);

  const src = cleanUrls[tryIndex];

  /** Cached / bfcache: image can finish before `onLoad` runs — unstick the invisible-until-loaded UI. */
  useLayoutEffect(() => {
    if (failed || !src) return;
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src, failed, tryIndex, urlKey]);

  const handleError = useCallback(() => {
    setLoaded(false);
    setTryIndex((i) => {
      if (i < cleanUrls.length - 1) return i + 1;
      queueMicrotask(() => setFailed(true));
      return i;
    });
  }, [cleanUrls.length]);

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
        ref={imgRef}
        key={`${urlKey}-${tryIndex}-${src}`}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={handleError}
        onLoad={() => setLoaded(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          /** invisible until loaded so browsers never flash the native broken-image icon */
          loaded ? 'opacity-100' : 'opacity-0 invisible',
          classNameImg,
        )}
      />
    </div>
  );
}
