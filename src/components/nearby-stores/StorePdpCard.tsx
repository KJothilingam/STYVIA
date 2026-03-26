import { useState } from 'react';
import { Heart, MapPin, Navigation, Star, Store, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NearbyStore } from '@/services/nearbyStoresService';
import { formatDistanceKm, googleMapsDirectionsTo, googleMapsSearchByPlaceId } from '@/lib/geo';
import { heroImageForPlace } from '@/data/storeHeroImages';
import SafeProductImage from '@/components/SafeProductImage';

export interface StorePdpCardProps {
  store: NearbyStore;
  distanceKm: number;
  selected: boolean;
  isNearest: boolean;
  onViewOnMap: () => void;
}

type DistanceBand = '< 1 km' | '1–3 km' | '3–5 km' | '5+ km';

function distanceBand(km: number): DistanceBand {
  if (km < 1) return '< 1 km';
  if (km < 3) return '1–3 km';
  if (km < 5) return '3–5 km';
  return '5+ km';
}

const BANDS: DistanceBand[] = ['< 1 km', '1–3 km', '3–5 km', '5+ km'];

export function StorePdpCard({ store, distanceKm, selected, isNearest, onViewOnMap }: StorePdpCardProps) {
  const [saved, setSaved] = useState(false);
  const directionsUrl = googleMapsDirectionsTo(store.lat, store.lng);
  const placeUrl = store.placeId
    ? googleMapsSearchByPlaceId(store.placeId)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address}`)}`;

  const heroUrl = heroImageForPlace(store.placeId || `${store.lat},${store.lng}`);
  const band = distanceBand(distanceKm);
  const rating = store.rating != null ? Number(store.rating) : null;

  return (
    <article
      className={cn(
        'rounded-2xl border bg-card shadow-sm transition-shadow',
        selected && 'ring-2 ring-primary shadow-md',
      )}
    >
      <div className="grid grid-cols-1 gap-8 p-4 md:p-6 lg:grid-cols-2 lg:gap-12 lg:items-start">
        {/* LEFT: hero image = hyperlink (new tab) — entire visual block */}
        <div className="lg:sticky lg:top-28">
          <div className="relative">
            <a
              href={placeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl border bg-muted/30',
                'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
              aria-label={`Open ${store.name} in Google Maps (new tab)`}
            >
              <SafeProductImage
                urls={[heroUrl]}
                alt=""
                className="absolute inset-0"
                classNameImg="transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <span className="sr-only">Opens Google Maps in a new tab</span>
            </a>
            <button
              type="button"
              onClick={() => setSaved((s) => !s)}
              className={cn(
                'absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/95 shadow-md backdrop-blur-sm transition hover:bg-background',
                saved && 'border-primary bg-primary text-primary-foreground',
              )}
              aria-label={saved ? 'Remove from saved stores' : 'Save store'}
            >
              <Heart className={cn('h-5 w-5', saved && 'fill-current')} />
            </button>
          </div>
        </div>

        {/* RIGHT: PDP-style stack */}
        <div className="min-w-0 space-y-6">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5" aria-hidden />
              Clothing store
            </p>
            <h2 className="font-display-hero mt-2 text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl lg:text-4xl">
              {store.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn('h-4 w-4', rating != null && i <= Math.round(rating) ? 'fill-current' : '')}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {rating != null ? `${rating.toFixed(1)} · Google Maps` : 'No rating yet · Google Maps'}
              </span>
            </div>
          </header>

          {/* “Price” block → distance */}
          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-bold tabular-nums text-foreground md:text-5xl">
                {formatDistanceKm(distanceKm)}
              </span>
              <span className="text-lg text-muted-foreground">from search point</span>
              {isNearest && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-bold text-primary">Nearest</span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Straight-line distance from your search pin</p>
          </div>

          <div className="flex items-start gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" aria-hidden />
            <span>{store.address || 'Address not available'}</span>
          </div>

          {/* Size-style row → distance bands */}
          <div className="space-y-6">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Distance</h3>
              <span className="text-sm font-semibold text-intelligence-mid">How close</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BANDS.map((b) => {
                const active = b === band;
                return (
                  <span
                    key={b}
                    className={cn(
                      'relative min-h-12 min-w-[3.5rem] rounded-md border-2 px-4 py-2 text-sm font-semibold tabular-nums',
                      active
                        ? 'border-primary bg-primary text-white shadow-md ring-2 ring-primary/40 ring-offset-2 ring-offset-background'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    {b}
                  </span>
                );
              })}
            </div>

            <div className="rounded-2xl border-2 border-intelligence-mid/30 bg-gradient-to-br from-intelligence-deep/[0.08] to-background p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/90 text-amber-950 shadow-sm">
                  <Zap className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold tracking-tight text-foreground md:text-lg">Visit this store</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Tap the large photo to open the place in <strong className="text-foreground">Google Maps</strong> in a
                    new tab. Get directions or highlight it on the map below.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Actions</h3>
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="h-14 w-full text-lg font-bold bg-red-600 hover:bg-red-700 text-white"
                  asChild
                >
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                    <Navigation className="w-5 h-5 mr-2" />
                    Get directions
                  </a>
                </Button>
                <Button type="button" variant="outline" size="lg" className="h-12 w-full font-semibold" onClick={onViewOnMap}>
                  <MapPin className="w-5 h-5 mr-2" />
                  View on map
                </Button>
                <Button type="button" variant="secondary" size="lg" className="h-12 w-full font-semibold" asChild>
                  <a href={placeUrl} target="_blank" rel="noopener noreferrer">
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
