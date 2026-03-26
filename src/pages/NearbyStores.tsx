import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, MapPin, Navigation, RefreshCw } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NearbyMapColumn } from '@/components/nearby-stores/NearbyMapColumn';
import { MapsTroubleshootPanel } from '@/components/nearby-stores/MapsTroubleshootPanel';
import { StoreCard } from '@/components/nearby-stores/StoreCard';
import { fetchNearbyStores } from '@/services/nearbyStoresService';
import { haversineKm } from '@/lib/geo';
import { cn } from '@/lib/utils';
import { getGoogleMapsBrowserApiKey } from '@/config/googleMaps';

const MAPS_KEY = getGoogleMapsBrowserApiKey();

const DEFAULT_LOC = { lat: 12.9716, lng: 77.5946, label: 'Bangalore (default)' };

export default function NearbyStores() {
  const [lat, setLat] = useState(DEFAULT_LOC.lat);
  const [lng, setLng] = useState(DEFAULT_LOC.lng);
  const [locLabel, setLocLabel] = useState(DEFAULT_LOC.label);
  const [radius, setRadius] = useState(10_000);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);

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
    error,
    refetch,
  } = useQuery({
    queryKey: ['nearby-stores', lat, lng, radius, openNowOnly],
    queryFn: () => fetchNearbyStores(lat, lng, { radius, openNow: openNowOnly }),
  });

  const sorted = useMemo(() => {
    const rows = stores.map((s) => ({
      store: s,
      km: haversineKm(lat, lng, s.lat, s.lng),
    }));
    rows.sort((a, b) => a.km - b.km);
    return rows;
  }, [stores, lat, lng]);

  const nearestPlaceId = sorted[0]?.store.placeId || null;

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
            'Location permission denied. Allow location access in your browser settings, or search for a city above the map.',
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

  const debugNearbyUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/nearby-stores?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}&radius=${radius}&openNow=${openNowOnly}`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" size="sm" className="gap-2 mb-6" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </Button>

        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary shrink-0" />
            Nearby clothing stores
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Use <strong>Use my location</strong>, search above the map, or tap the map to set the search point. Results
            appear below the map.
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{locLabel}</span>
            <span className="mx-1">·</span>
            <span>
              lat {lat.toFixed(5)}, lng {lng.toFixed(5)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <Button type="button" variant="default" size="sm" onClick={useMyLocation} disabled={geoBusy} className="gap-2">
            <Navigation className={cn('h-4 w-4', geoBusy && 'animate-pulse')} />
            Use my location
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => refetch()} disabled={loading} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="radius">Search radius</Label>
              <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                <SelectTrigger id="radius" className="w-[140px]">
                  <SelectValue placeholder="Radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1 km</SelectItem>
                  <SelectItem value="5000">5 km</SelectItem>
                  <SelectItem value="10000">10 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 h-10">
              <Label htmlFor="open-now" className="text-sm font-medium whitespace-nowrap">
                Open now
              </Label>
              <Switch id="open-now" checked={openNowOnly} onCheckedChange={setOpenNowOnly} />
            </div>
          </div>
        </div>

        {/* Map on top (classic layout like earlier /shops) */}
        <div
          className="w-full h-[320px] md:h-[420px] rounded-2xl border bg-muted/30 overflow-hidden mb-8"
          aria-label="Map of nearby stores"
        >
          <NearbyMapColumn
            apiKey={MAPS_KEY}
            userLat={lat}
            userLng={lng}
            stores={stores}
            selectedPlaceId={selectedPlaceId}
            onSelectStore={setSelectedPlaceId}
            onSearchLocation={(la, ln, label) => setUserLocation(la, ln, label)}
            onPickLocationOnMap={(la, ln) => {
              setLat(la);
              setLng(ln);
              setSelectedPlaceId(null);
              setLocLabel('Map — resolving address…');
            }}
            onReverseGeocode={(addr) => setLocLabel(addr)}
          />
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading places…
          </p>
        )}

        {isError && (
          <div className="mb-6 space-y-2">
            <p className="text-sm text-destructive">
              {(error as Error)?.message || 'Could not load stores. Is the API running on port 8080?'}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !isError && stores.length === 0 && (
          <div className="text-sm text-muted-foreground rounded-xl border bg-muted/30 px-4 py-4 space-y-4 mb-8">
            <p className="font-medium text-foreground">No stores found for this point</p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>Try a larger radius or turn <strong>Open now</strong> off.</li>
              <li>
                Test the API:{' '}
                <a className="text-primary underline break-all" href={debugNearbyUrl} target="_blank" rel="noreferrer">
                  {debugNearbyUrl}
                </a>
              </li>
            </ul>
            <MapsTroubleshootPanel variant="stores-empty" />
          </div>
        )}

        {sorted.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {sorted.map(({ store, km }) => {
              const key = store.placeId || `${store.lat}-${store.lng}-${store.name}`;
              const selected = selectedPlaceId != null && store.placeId === selectedPlaceId;
              const isNearest = nearestPlaceId != null && store.placeId === nearestPlaceId;
              return (
                <StoreCard
                  key={key}
                  store={store}
                  distanceKm={km}
                  selected={selected}
                  isNearest={isNearest}
                  onSelect={() => setSelectedPlaceId(store.placeId || null)}
                  onViewOnMap={() => setSelectedPlaceId(store.placeId || null)}
                />
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
