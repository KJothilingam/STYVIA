import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { GoogleMap, InfoWindow, Marker } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import type { NearbyStore } from '@/services/nearbyStoresService';
import { reverseGeocode } from '@/services/mapsService';
import { googleMapsDirectionsTo, googleMapsSearchByPlaceId } from '@/lib/geo';

const mapContainerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: '240px',
};

const defaultOptions: google.maps.MapOptions = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
};

export interface MapComponentProps {
  /** Parent already loaded Maps JS API (incl. places if needed elsewhere). */
  mapApiReady: boolean;
  userLat: number;
  userLng: number;
  stores: NearbyStore[];
  selectedPlaceId: string | null;
  onSelectStore: (placeId: string | null) => void;
  /** Map background click — set search origin (blue pin is not clickable so clicks reach the map). */
  onPickLocationOnMap?: (lat: number, lng: number) => void;
  /** After a map click / pin drag, formatted address from Geocoder (optional). */
  onReverseGeocode?: (formattedAddress: string) => void;
}

/**
 * Interactive map: user marker + store markers, synced selection and InfoWindow.
 */
export function MapComponent({
  mapApiReady,
  userLat,
  userLng,
  stores,
  selectedPlaceId,
  onSelectStore,
  onPickLocationOnMap,
  onReverseGeocode,
}: MapComponentProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoPlaceId, setInfoPlaceId] = useState<string | null>(null);
  const prevUserRef = useRef<{ lat: number; lng: number } | null>(null);

  const center = useMemo(() => ({ lat: userLat, lng: userLng }), [userLat, userLng]);

  const selectedStore = useMemo(
    () => (selectedPlaceId ? stores.find((s) => s.placeId === selectedPlaceId) : undefined),
    [stores, selectedPlaceId],
  );

  // Pan/zoom when user search origin changes (geo, autocomplete, map click) — not on first paint before onLoad.
  useEffect(() => {
    if (!mapApiReady || !mapRef.current) return;
    const prev = prevUserRef.current;
    if (prev === null) {
      prevUserRef.current = { lat: userLat, lng: userLng };
      return;
    }
    if (prev.lat === userLat && prev.lng === userLng) return;
    prevUserRef.current = { lat: userLat, lng: userLng };
    if (selectedPlaceId) return;
    mapRef.current.panTo({ lat: userLat, lng: userLng });
    mapRef.current.setZoom(14);
  }, [userLat, userLng, mapApiReady, selectedPlaceId]);

  useEffect(() => {
    if (!selectedPlaceId) {
      setInfoPlaceId(null);
      return;
    }
    setInfoPlaceId(selectedPlaceId);
    const s = stores.find((x) => x.placeId === selectedPlaceId);
    if (s && mapRef.current) {
      mapRef.current.panTo({ lat: s.lat, lng: s.lng });
      mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 14, 15));
    }
  }, [selectedPlaceId, stores]);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      prevUserRef.current = { lat: userLat, lng: userLng };
      if (stores.length === 0) {
        map.setCenter(center);
        map.setZoom(14);
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(center);
      stores.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
      map.fitBounds(bounds, 56);
    },
    [center, stores, userLat, userLng],
  );

  const resolveAddress = useCallback(
    (plat: number, plng: number) => {
      if (!onReverseGeocode) return;
      void reverseGeocode(plat, plng)
        .then(onReverseGeocode)
        .catch(() => onReverseGeocode(`Map point (${plat.toFixed(5)}, ${plng.toFixed(5)})`));
    },
    [onReverseGeocode],
  );

  const userIcon: google.maps.Icon | undefined = mapApiReady
    ? {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new google.maps.Size(32, 32),
      }
    : undefined;

  if (!mapApiReady) {
    return (
      <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-muted/25 dark:bg-muted/20">
        <span className="text-sm text-muted-foreground">Loading map…</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={14}
      options={defaultOptions}
      onLoad={onMapLoad}
      onClick={(e) => {
        setInfoPlaceId(null);
        onSelectStore(null);
        if (!onPickLocationOnMap || !e.latLng) return;
        const plat = e.latLng.lat();
        const plng = e.latLng.lng();
        onPickLocationOnMap(plat, plng);
        resolveAddress(plat, plng);
      }}
    >
      {/* clickable=false so taps pass through to the map (a normal pin blocks clicks on the ground). */}
      <Marker
        position={center}
        title="Search origin — tap the map (not this pin) to move it"
        icon={userIcon}
        zIndex={999}
        clickable={false}
      />

      {stores.map((s) => (
        <Marker
          key={s.placeId || `${s.lat}-${s.lng}-${s.name}`}
          position={{ lat: s.lat, lng: s.lng }}
          title={s.name}
          onClick={() => {
            onSelectStore(s.placeId || null);
            setInfoPlaceId(s.placeId || null);
          }}
          icon={
            selectedPlaceId && s.placeId === selectedPlaceId
              ? {
                  url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                  scaledSize: new google.maps.Size(34, 34),
                }
              : {
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new google.maps.Size(32, 32),
                }
          }
        />
      ))}

      {infoPlaceId && selectedStore && (
        <InfoWindow
          position={{ lat: selectedStore.lat, lng: selectedStore.lng }}
          onCloseClick={() => setInfoPlaceId(null)}
        >
          <div className="max-w-[220px] py-1 pr-1">
            <p className="font-semibold text-sm text-gray-900">{selectedStore.name}</p>
            {selectedStore.rating != null && (
              <p className="text-xs text-gray-600 mt-0.5">Rating: {selectedStore.rating.toFixed(1)}</p>
            )}
            <div className="mt-2 flex flex-col gap-1">
              <Button type="button" variant="default" size="sm" className="h-8 text-xs" asChild>
                <a
                  href={
                    selectedStore.placeId
                      ? googleMapsSearchByPlaceId(selectedStore.placeId)
                      : googleMapsDirectionsTo(selectedStore.lat, selectedStore.lng)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Maps
                </a>
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" asChild>
                <a
                  href={googleMapsDirectionsTo(selectedStore.lat, selectedStore.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions
                </a>
              </Button>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
