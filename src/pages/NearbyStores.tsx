import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Compass, Loader2, MapPin, Navigation, RefreshCw, Search, Sparkles } from 'lucide-react';
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

const DEFAULT_LOC = {
  lat: 12.8420,
  lng: 80.1549,
  label: 'VIT Chennai (default)',
};

function MapsBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-1/4 top-0 h-[min(60vh,480px)] w-[min(88vw,680px)] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(210_85%_58%/0.28)_0%,transparent_66%)] blur-3xl motion-safe:animate-wardrobe-ambient dark:bg-[radial-gradient(ellipse_at_center,hsl(210_70%_45%/0.22)_0%,transparent_65%)]" />
      <div className="absolute -right-1/4 bottom-0 h-[min(52vh,420px)] w-[min(82vw,560px)] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(188_72%_42%/0.2)_0%,transparent_60%)] blur-3xl motion-safe:animate-wardrobe-ambient [animation-delay:-6s] dark:bg-[radial-gradient(ellipse_at_center,hsl(188_55%_38%/0.16)_0%,transparent_58%)]" />
      <div className="absolute left-1/3 top-1/2 h-[min(40vh,340px)] w-[min(55vw,420px)] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,hsl(262_48%_58%/0.12)_0%,transparent_55%)] blur-3xl motion-safe:animate-body-zone-float dark:bg-[radial-gradient(ellipse_at_center,hsl(262_40%_45%/0.1)_0%,transparent_55%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(210_45%_45%/0.07)_48px,hsl(210_45%_45%/0.07)_49px)] dark:opacity-[0.09] dark:[background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(0_0%_100%/0.06)_48px,hsl(0_0%_100%/0.06)_49px)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/45 to-transparent dark:via-sky-400/35" />
    </div>
  );
}

type SearchCenter = { lat: number; lng: number; radius: number; openNow: boolean };

type NearbyStoreRow = NearbyStore & {
  googleMapsUrl?: string | null;
  photoUrl?: string | null;
  userRatingsTotal?: number | null;
  types?: string[] | null;
};

function mapsOpenUrl(store: NearbyStoreRow): string {
  const fromApi = store.googleMapsUrl?.trim();
  if (fromApi) return fromApi;
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
  if (!raw?.length) return 'Fashion / clothing';
  return raw.slice(0, 3).join(' · ');
}

export default function NearbyStores() {
  const [lat, setLat] = useState(DEFAULT_LOC.lat);
  const [lng, setLng] = useState(DEFAULT_LOC.lng);
  const [locLabel, setLocLabel] = useState(DEFAULT_LOC.label);
  const [radius, setRadius] = useState(10_000);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  /** Only set when user clicks "Search stores" — API uses this, not live map drags. */
  const [searchCenter, setSearchCenter] = useState<SearchCenter | null>(null);
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
    queryKey: ['nearby-stores', searchCenter?.lat, searchCenter?.lng, searchCenter?.radius, searchCenter?.openNow],
    queryFn: () =>
      fetchNearbyStores(searchCenter!.lat, searchCenter!.lng, {
        radius: searchCenter!.radius,
        openNow: searchCenter!.openNow,
      }),
    enabled: searchCenter != null,
  });

  const runSearch = useCallback(() => {
    setSearchCenter({ lat, lng, radius, openNow: openNowOnly });
    setSelectedPlaceId(null);
  }, [lat, lng, radius, openNowOnly]);

  const originLat = searchCenter?.lat ?? lat;
  const originLng = searchCenter?.lng ?? lng;

  const sorted = useMemo(() => {
    const rows = (stores as NearbyStoreRow[]).map((s) => ({
      store: s,
      km: haversineKm(originLat, originLng, s.lat, s.lng),
    }));
    rows.sort((a, b) => a.km - b.km);
    return rows;
  }, [stores, originLat, originLng]);

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
      <div
        className={cn(
          'relative flex w-full flex-col overflow-hidden',
          'bg-gradient-to-b from-sky-50/95 via-blue-50/30 to-background text-foreground',
          'dark:from-[hsl(217_28%_14%)] dark:via-[hsl(222_24%_11%)] dark:to-[hsl(222_32%_8%)]',
          'h-[calc(100dvh-6rem)] min-h-[480px]',
          'max-md:min-h-0',
        )}
      >
        <MapsBackdrop />
        <div
          className={cn(
            'relative z-10 flex min-h-0 flex-1 flex-row overflow-hidden',
            'max-md:flex-col max-md:min-h-0',
          )}
        >
        {/* Left 30% — nearby store cards + search */}
        <aside
          className={cn(
            'flex h-full w-[30%] min-w-0 shrink-0 flex-col overflow-hidden',
            'border-r border-border/70 bg-card/92 shadow-[4px_0_32px_-16px_hsl(210_40%_20%/0.12)] backdrop-blur-md',
            'dark:border-border dark:bg-card/85 dark:shadow-[4px_0_40px_-12px_rgba(0,0,0,0.35)]',
            'max-md:h-[32vh] max-md:w-full max-md:min-w-0 max-md:min-h-[200px]',
          )}
          aria-label="Nearby stores list"
        >
            <div className="relative shrink-0 space-y-3 border-b border-border/60 bg-gradient-to-b from-sky-50/50 to-transparent px-3 py-3 dark:from-white/[0.04] dark:to-transparent md:px-4">
              <div
                className="pointer-events-none absolute inset-x-6 top-2 h-px rounded-full bg-[length:200%_100%] bg-gradient-to-r from-transparent via-sky-400/35 to-transparent opacity-90 motion-safe:animate-wardrobe-rail-shine dark:via-sky-400/25"
                aria-hidden
              />
              <nav className="relative text-xs text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 rounded-full px-0.5 py-0.5 transition-colors hover:text-sky-700 dark:hover:text-sky-300"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Home
                </Link>
                <span className="mx-1.5 opacity-50">/</span>
                <span className="font-medium text-foreground">Maps</span>
              </nav>

              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-600/25 ring-2 ring-sky-200/70 dark:shadow-sky-900/40 dark:ring-white/15 motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:scale-105">
                  <Compass className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-sky-100/90 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-sky-900 dark:border-sky-400/25 dark:bg-sky-500/15 dark:text-sky-100">
                    <MapPin className="h-2.5 w-2.5 shrink-0 text-sky-600 dark:text-sky-300" />
                    Explore
                    <Sparkles className="h-2.5 w-2.5 shrink-0 text-amber-600/90 dark:text-amber-200/80" />
                  </div>
                  <h1 className="font-display-hero text-lg font-semibold leading-tight tracking-tight text-foreground md:text-2xl">
                    Nearby{' '}
                    <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-sky-300 dark:via-blue-300 dark:to-violet-300">
                      fashion &amp; clothing
                    </span>
                  </h1>
                  <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
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
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={runSearch}
                  disabled={loading}
                  className="gap-1.5 h-9 flex-1 min-w-[9rem] text-xs font-semibold sm:flex-none"
                >
                  <Search className={cn('h-3.5 w-3.5', loading && 'animate-pulse')} />
                  Search stores
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={loading || searchCenter == null}
                  className="gap-1.5 h-9 text-xs"
                  title="Repeat last search (same pin and filters)"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                  Refresh
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={geoBusy} className="gap-1.5 h-9 text-xs">
                  <Navigation className={cn('h-3.5 w-3.5', geoBusy && 'animate-pulse')} />
                  My location
                </Button>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="radius" className="text-[11px]">
                    Radius
                  </Label>
                  <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                    <SelectTrigger id="radius" className="h-8 w-[132px] text-xs">
                      <SelectValue placeholder="Radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">1 km</SelectItem>
                      <SelectItem value="3000">3 km</SelectItem>
                      <SelectItem value="5000">5 km</SelectItem>
                      <SelectItem value="10000">10 km</SelectItem>
                      <SelectItem value="15000">15 km</SelectItem>
                      <SelectItem value="20000">20 km</SelectItem>
                      <SelectItem value="30000">30 km</SelectItem>
                      <SelectItem value="40000">40 km</SelectItem>
                      <SelectItem value="50000">50 km</SelectItem>
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
                Set the pin with <strong className="text-foreground">My location</strong>, the search box, or{' '}
                <strong className="text-foreground">tap the map</strong>, choose radius, then click{' '}
                <strong className="text-foreground">Search stores</strong> (Places API runs only then — avoids rate limits).
                Cards open <strong className="text-foreground">Google Maps</strong> in a new tab.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 md:px-4 space-y-2.5">
              {searchCenter == null && !loading && (
                <div className="rounded-lg border border-dashed border-primary/25 bg-primary/[0.04] p-3 text-xs">
                  <p className="font-medium text-foreground">Ready to search</p>
                  <p className="mt-1 text-muted-foreground">
                    Move the map pin if you like, then press <strong className="text-foreground">Search stores</strong> to load
                    nearby shops (no API calls until you do).
                  </p>
                </div>
              )}

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

              {searchCenter != null && !loading && !isError && stores.length === 0 && (
                <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs">
                  <p className="font-medium text-foreground">No stores for this area</p>
                  <p className="mt-1 text-muted-foreground">Try a larger radius, turn Open now off, or move the pin and search again.</p>
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

        {/* Right 70% — map (padded frame so the map doesn’t sit flush to edges) */}
        <div
          className={cn(
            'relative flex h-full w-[70%] min-h-0 min-w-0 shrink-0 flex-col',
            'bg-gradient-to-br from-slate-200/40 via-muted/25 to-sky-100/20',
            'dark:from-slate-950/50 dark:via-muted/20 dark:to-slate-900/30',
            'p-3 sm:p-4 md:p-5 lg:p-6',
            'max-md:h-auto max-md:w-full max-md:flex-1 max-md:min-h-[min(360px,52vh)] max-md:p-3',
          )}
          aria-label="Map of nearby stores"
        >
          {mapBroken ? (
            <div className="flex min-h-[min(280px,45vh)] flex-1 items-center justify-center rounded-2xl border border-border/70 bg-muted/30 p-6 shadow-inner dark:bg-muted/25">
              <p className="text-center text-sm text-muted-foreground">Map preview isn&apos;t available right now.</p>
            </div>
          ) : (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-[0_12px_40px_-16px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.04] dark:bg-card/50 dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.45)] dark:ring-white/[0.06]">
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
            </div>
          )}
        </div>
        </div>
      </div>
    </Layout>
  );
}
