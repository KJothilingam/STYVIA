import { useState, useEffect, useMemo } from 'react';
import type { CartItem } from '@/types';
import bodyProfileService from '@/services/bodyProfileService';
import fitService from '@/services/fitService';

export interface ProductFitSnapshot {
  recommendedSize: string | null;
  scoresBySize: Record<string, number>;
}

function sizesEqual(a: string, b: string | null | undefined) {
  if (b == null) return false;
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

/** Build snapshot from API response */
function snapshotFromFitResponse(r: Awaited<ReturnType<typeof fitService.getFitConfidence>>): ProductFitSnapshot {
  const scoresBySize: Record<string, number> = {};
  (r.allSizes ?? []).forEach((s) => {
    scoresBySize[s.size] = Number(s.confidence);
  });
  (r.breakdown ?? []).forEach((b) => {
    const v = b.finalScore ?? b.score;
    if (typeof v === 'number') scoresBySize[b.size] = Number(v);
  });
  return { recommendedSize: r.recommendedSize, scoresBySize };
}

export function scoreForSelectedSize(snap: ProductFitSnapshot, selectedSize: string): number | undefined {
  if (snap.scoresBySize[selectedSize] != null) return snap.scoresBySize[selectedSize];
  const u = selectedSize.toUpperCase();
  const key = Object.keys(snap.scoresBySize).find((k) => k.toUpperCase() === u);
  return key != null ? snap.scoresBySize[key] : undefined;
}

export function isRecommendedSize(snap: ProductFitSnapshot, selectedSize: string) {
  return sizesEqual(selectedSize, snap.recommendedSize);
}

/**
 * When logged in with a body profile, loads fit-confidence per distinct product in the cart
 * (chunked) so line items can show “Recommended ✔” or per-size fit %.
 */
export function useCartFitSnapshots(cart: CartItem[], isLoggedIn: boolean) {
  const [snapshots, setSnapshots] = useState<Record<string, ProductFitSnapshot>>({});
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const productIdKey = useMemo(() => {
    const ids = [...new Set(cart.map((c) => c.product.id))].sort();
    return ids.join(',');
  }, [cart]);

  useEffect(() => {
    if (!isLoggedIn || productIdKey === '') {
      setSnapshots({});
      setHasProfile(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const ok = await bodyProfileService.hasProfile().catch(() => false);
      if (cancelled) return;
      setHasProfile(ok);
      if (!ok) {
        setSnapshots({});
        setLoading(false);
        return;
      }

      setLoading(true);
      const ids = productIdKey.split(',').filter(Boolean);
      const next: Record<string, ProductFitSnapshot> = {};
      const chunk = 4;

      try {
        for (let i = 0; i < ids.length; i += chunk) {
          if (cancelled) return;
          const slice = ids.slice(i, i + chunk);
          await Promise.all(
            slice.map(async (id) => {
              try {
                const r = await fitService.getFitConfidence(Number(id));
                if (!cancelled) next[id] = snapshotFromFitResponse(r);
              } catch {
                /* product without sizes / network */
              }
            })
          );
        }
        if (!cancelled) setSnapshots(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, productIdKey]);

  return { snapshots, loading, hasProfile };
}
