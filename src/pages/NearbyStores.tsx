import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2, MapPin, Navigation, RefreshCw } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapComponent } from '@/components/nearby-stores/MapComponent';
import { LocationAutocomplete } from '@/components/nearby-stores/LocationAutocomplete';
import { StoreSidebarCard } from '@/components/nearby-stores/StoreSidebarCard';
import { fetchNearbyStores, type NearbyStore } from '@/services/nearbyStoresService';
import { googleMapsSearchByPlaceId, haversineKm } from '@/lib/geo';
import { heroImageForPlace } from '@/data/storeHeroImages';
import { cn } from '@/lib/utils';
import { getGoogleMapsBrowserApiKey } from '@/config/googleMaps';
import { useGoogleMapsNearbyLoader } from '@/hooks/useGoogleMapsNearbyLoader';

const MAPS_KEY = getGoogleMapsBrowserApiKey();

const DEFAULT_LOC = { lat: 12.9716, lng: 77.5946, label: 'Bangalore (default)' };

type NearbyStoreRow = NearbyStore & {
  googleMapsUrl?: string | null;
  photoUrl?: string | null;
  userRatingsTotal?: number | null;
  types?: string[] | null;
};

function mapsOpenUrl(store: NearbyStoreRow): string {
  const direct = store.googleMapsUrl?.trim();
  if (direct) return direct;
  const pid = store.placeId?.trim();
  if (pid) return googleMapsSearchByPlaceId(pid);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address}`)}`;
}

function storeHeroUrls(store: NearbyStoreRow): string[] {
  const photo = store.photoUrl?.trim();
  const fallbackKey = store.placeId?.trim() || `${store.lat},${store.lng}`;
  const unsplash = heroImageForPlace(fallbackKey);
  if (photo) return [photo, unsplash];
  return [unsplash];
}

function typesLabel(store: NearbyStoreRow): string {
  const raw = store.types?.filter(Boolean);
  if (!raw?.length) return 'Clothing store';
  return raw
    .slice(0, 3)
    .map((t) =>
      t
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    )
    .join(' · ');
}

export default function NearbyStores() {
  const [lat, setLat] = useState(DEFAULT_LOC.lat);
  const [lng, setLng] = useState(DEFAULT_LOC.lng);
  const [locLabel, setLocLabel] = useState(DEFAULT_LOC.label);
  const [radius, setRadius] = useState(10_000);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);

  const { isLoaded, loadError, mapsAuthFailed } = useGoogleMapsNearbyLoader(MAPS_KEY);
  const mapBroken = loadError != null || mapsAuthFailed;

  const setUserLocation = useCallback((nextLat: number, nextLng: number, label: string) => {
    setLat(nextLat);
    setLng(nextLng);
    setLocLabel(label);
    setSelectedPlaceId(null);
  }, []);

  const {
    data: stores = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['nearby-stores', lat, lng, radius, openNowOnly],
    queryFn: () => fetchNearbyStores(lat, lng, { radius, openNow: openNowOnly }),
  });

  const sorted = useMemo(() => {
    const rows = (stores as NearbyStoreRow[]).map((s) => ({
      store: s,
      km: haversineKm(lat, lng, s.lat, s.lng),
    }));
    rows.sort((a, b) => a.km - b.km);
    return rows;
  }, [stores, lat, lng]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocLabel('Geolocation not supported in this browser');
      alert('Geolocation is not supported in this browser.');
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;
        setUserLocation(nextLat, nextLng, 'Your location');
        setGeoBusy(false);
      },
      (err) => {
        setGeoBusy(false);
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          alert(
            'Location permission denied. Allow location access in your browser settings, or search for a city in the sidebar.',
          );
        } else {
          alert('Could not get your location. Try search or tap the map to choose an area.');
        }
        setLocLabel('Location unavailable — use search or map');
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  }, [setUserLocation]);

  const loading = isLoading || isFetching;

  return (
    <Layout>
      {/*
        Fixed proportion like Google Maps: 30% left = store list + controls, 70% right = map.
        Full width under header; tall viewport fill. On small screens, stack: 30vh list / rest map.
      */}
      <div
        className={cn(
          'flex w-full flex-row overflow-hidden bg-background',
          'h-[calc(100dvh-6rem)] min-h-[480px]',
          'max-md:flex-col max-md:h-[calc(100dvh-6rem)] max-md:min-h-0',
        )}
      >
        {/* Left 30% — nearby store cards + search */}
        <aside
          className={cn(
            'flex h-full w-[30%] min-w-0 shrink-0 flex-col overflow-hidden border-r border-border bg-background',
            'max-md:h-[30vh] max-md:w-full max-md:min-w-0 max-md:min-h-[180px]',
          )}
          aria-label="Nearby stores list"
        >
            <div className="shrink-0 space-y-3 border-b px-3 py-3 md:px-4">
              <nav className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                <Link to="/" className="hover:text-primary">
                  Home
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                <span className="text-foreground">Maps</span>
              </nav>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <h1 className="font-display-hero text-lg font-semibold leading-tight tracking-tight text-foreground md:text-xl">
                    Clothing stores near you
                  </h1>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    <span className="font-medium text-foreground">{locLabel}</span>
                    <span className="mx-1">·</span>
                    <span className="tabular-nums">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                  </p>
                </div>
              </div>

              {mapBroken ? (
                <p className="text-[11px] text-destructive">
                  Map script did not load. You can still open each store in Google Maps from the list.
                </p>
              ) : isLoaded ? (
                <LocationAutocomplete onPlaceSelect={(la, ln, label) => setUserLocation(la, ln, label)} />
              ) : (
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" aria-hidden />
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="default" size="sm" onClick={useMyLocation} disabled={geoBusy} className="gap-1.5 h-8 text-xs">
                  <Navigation className={cn('h-3.5 w-3.5', geoBusy && 'animate-pulse')} />
                  My location
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => refetch()} disabled={loading} className="gap-1.5 h-8 text-xs">
                  <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                  Refresh
                </Button>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="radius" className="text-[11px]">
                    Radius
                  </Label>
                  <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                    <SelectTrigger id="radius" className="h-8 w-[120px] text-xs">
                      <SelectValue placeholder="Radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1 km</SelectItem>
                      <SelectItem value="5000">5 km</SelectItem>
                      <SelectItem value="10000">10 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex h-8 items-center gap-2 rounded-md border px-2.5">
                  <Label htmlFor="open-now" className="text-xs font-medium whitespace-nowrap">
                    Open now
                  </Label>
                  <Switch id="open-now" checked={openNowOnly} onCheckedChange={setOpenNowOnly} />
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Tap the <strong className="text-foreground">map</strong> to move the search pin. Each store card opens{' '}
                <strong className="text-foreground">Google Maps in a new tab</strong>.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 md:px-4 space-y-2.5">
              {loading && (
                <p className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  Loading places…
                </p>
              )}

              {isError && (
                <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs space-y-2">
                  <p className="font-medium text-muted-foreground">Stores list couldn&apos;t load.</p>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => refetch()} disabled={isFetching}>
                    Try again
                  </Button>
                </div>
              )}

              {!loading && !isError && stores.length === 0 && (
                <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs">
                  <p className="font-medium text-foreground">No stores for this area</p>
                  <p className="mt-1 text-muted-foreground">Try a larger radius or turn Open now off.</p>
                </div>
              )}

              {sorted.map(({ store, km }) => {
                const key = store.placeId || `${store.lat}-${store.lng}-${store.name}`;
                const selected = selectedPlaceId != null && store.placeId === selectedPlaceId;
                return (
                  <StoreSidebarCard
                    key={key}
                    store={store}
                    km={km}
                    selected={selected}
                    mapsHref={mapsOpenUrl(store)}
                    heroUrls={storeHeroUrls(store)}
                    categoryLabel={typesLabel(store)}
                    onHoverPlace={setSelectedPlaceId}
                  />
                );
              })}
            </div>
        </aside>

        {/* Right 70% — map */}
        <div
          className={cn(
            'relative h-full w-[70%] min-w-0 shrink-0 overflow-hidden bg-muted/30',
            'max-md:h-auto max-md:w-full max-md:flex-1 max-md:min-h-[280px]',
          )}
          aria-label="Map of nearby stores"
        >
            {mapBroken ? (
              <div className="flex h-full min-h-[280px] items-center justify-center bg-muted/20 p-6">
                <p className="text-center text-sm text-muted-foreground">Map preview isn&apos;t available right now.</p>
              </div>
            ) : (
              <MapComponent
                mapApiReady={isLoaded}
                userLat={lat}
                userLng={lng}
                stores={stores}
                selectedPlaceId={selectedPlaceId}
                onSelectStore={setSelectedPlaceId}
                onPickLocationOnMap={(la, ln) => {
                  setLat(la);
                  setLng(ln);
                  setSelectedPlaceId(null);
                  setLocLabel('Map — resolving address…');
                }}
                onReverseGeocode={(addr) => setLocLabel(addr)}
              />
            )}
        </div>
      </div>
    </Layout>
  );
}
