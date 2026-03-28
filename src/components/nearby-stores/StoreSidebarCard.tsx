import { MapPin, Star } from 'lucide-react';
import SafeProductImage from '@/components/SafeProductImage';
import { formatDistanceKm } from '@/lib/geo';
import { cn } from '@/lib/utils';
import type { NearbyStore } from '@/services/nearbyStoresService';

type StoreRow = NearbyStore & {
  googleMapsUrl?: string | null;
  photoUrl?: string | null;
  userRatingsTotal?: number | null;
  types?: string[] | null;
};

export interface StoreSidebarCardProps {
  store: StoreRow;
  km: number;
  selected: boolean;
  mapsHref: string;
  heroUrls: string[];
  categoryLabel: string;
  onHoverPlace?: (placeId: string | null) => void;
}

export function StoreSidebarCard({
  store,
  km,
  selected,
  mapsHref,
  heroUrls,
  categoryLabel,
  onHoverPlace,
}: StoreSidebarCardProps) {
  const rating = store.rating != null ? Number(store.rating) : null;
  const reviewTotal = store.userRatingsTotal != null ? Number(store.userRatingsTotal) : null;
  const openLine = store.openNow ? 'Open now' : 'May be closed — check Maps';

  return (
    <a
      href={mapsHref}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex gap-3 rounded-xl border border-border/80 bg-card p-3 text-left shadow-sm transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-sky-300/45 hover:bg-muted/40 hover:shadow-md dark:hover:border-sky-500/25',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected && 'ring-2 ring-primary border-primary/40 bg-primary/[0.04]',
      )}
      onMouseEnter={() => onHoverPlace?.(store.placeId || null)}
      aria-label={`${store.name}: open in Google Maps in a new tab`}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <h2 className="text-[15px] font-semibold leading-snug text-foreground group-hover:underline decoration-primary/60 underline-offset-2 line-clamp-2">
          {store.name}
        </h2>

        {(rating != null || (reviewTotal != null && reviewTotal > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
              {rating != null ? <span className="font-semibold tabular-nums">{rating.toFixed(1)}</span> : null}
            </span>
            {reviewTotal != null && reviewTotal > 0 ? (
              <span>({reviewTotal.toLocaleString()} reviews)</span>
            ) : null}
          </div>
        )}

        <p className="text-xs text-muted-foreground line-clamp-2">
          <span className="text-foreground/90">{categoryLabel}</span>
          {store.address ? (
            <>
              <span className="mx-1">·</span>
              <span>{store.address}</span>
            </>
          ) : null}
        </p>

        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{openLine}</p>

        <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          {formatDistanceKm(km)} away
        </p>

        <p className="text-[10px] text-muted-foreground/80">Opens Google Maps in a new tab</p>
      </div>

      <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg border bg-muted">
        <SafeProductImage
          urls={heroUrls}
          alt=""
          className="absolute inset-0"
          classNameImg="transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </a>
  );
}
