import { MapPin, Navigation, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NearbyStore } from '@/services/nearbyStoresService';
import { formatDistanceKm, googleMapsDirectionsTo, googleMapsSearchByPlaceId } from '@/lib/geo';

export interface StoreCardProps {
  store: NearbyStore;
  distanceKm: number;
  selected: boolean;
  isNearest: boolean;
  onSelect: () => void;
  onViewOnMap: () => void;
}

export function StoreCard({ store, distanceKm, selected, isNearest, onSelect, onViewOnMap }: StoreCardProps) {
  const directionsUrl = googleMapsDirectionsTo(store.lat, store.lng);
  const placeUrl = store.placeId
    ? googleMapsSearchByPlaceId(store.placeId)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address}`)}`;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'ring-2 ring-primary shadow-md',
      )}
    >
      <CardHeader className="pb-2 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{store.name}</CardTitle>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatDistanceKm(distanceKm)}
          </span>
        </div>
        <CardDescription className="flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
          <span>{store.address || 'Address not available'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {store.rating != null && (
            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
              {store.rating.toFixed(1)}
            </span>
          )}
          <Badge variant={store.openNow ? 'default' : 'secondary'} className="text-xs font-normal">
            {store.openNow ? 'Open now' : 'Hours vary / closed'}
          </Badge>
          {isNearest && (
            <Badge variant="outline" className="text-xs">
              Nearest
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" className="gap-1" onClick={onViewOnMap}>
            <MapPin className="h-3.5 w-3.5" />
            View on map
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <Navigation className="h-3.5 w-3.5" />
              Get directions
            </a>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1" asChild>
            <a href={placeUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              Open in Maps
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
