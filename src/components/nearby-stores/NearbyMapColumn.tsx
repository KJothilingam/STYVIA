import { useEffect, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { MapComponent } from '@/components/nearby-stores/MapComponent';
import { LocationAutocomplete } from '@/components/nearby-stores/LocationAutocomplete';
import { MapsTroubleshootPanel } from '@/components/nearby-stores/MapsTroubleshootPanel';
import type { NearbyStore } from '@/services/nearbyStoresService';

const libraries: 'places'[] = ['places'];

type GmWindow = Window & { gm_authFailure?: () => void };

export interface NearbyMapColumnProps {
  apiKey: string;
  userLat: number;
  userLng: number;
  stores: NearbyStore[];
  selectedPlaceId: string | null;
  onSelectStore: (placeId: string | null) => void;
  onSearchLocation: (lat: number, lng: number, label: string) => void;
  onPickLocationOnMap: (lat: number, lng: number) => void;
  onReverseGeocode?: (formattedAddress: string) => void;
}

/**
 * Single Maps JS load (places + map). Autocomplete + map share the same script.
 */
export function NearbyMapColumn({
  apiKey,
  userLat,
  userLng,
  stores,
  selectedPlaceId,
  onSelectStore,
  onSearchLocation,
  onPickLocationOnMap,
  onReverseGeocode,
}: NearbyMapColumnProps) {
  const [mapsAuthFailed, setMapsAuthFailed] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'nearby-stores-map-script',
    googleMapsApiKey: apiKey,
    libraries,
    version: 'weekly',
  });

  useEffect(() => {
    const w = window as GmWindow;
    w.gm_authFailure = () => setMapsAuthFailed(true);
    return () => {
      if (w.gm_authFailure) {
        delete w.gm_authFailure;
      }
    };
  }, []);

  if (loadError || mapsAuthFailed) {
    return (
      <div className="flex h-full min-h-[280px] flex-col gap-4 bg-muted/30 p-4 overflow-auto">
        <p className="text-sm text-muted-foreground">
          {loadError != null &&
            (loadError instanceof Error ? loadError.message : typeof loadError === 'string' ? loadError : String(loadError))}
          {mapsAuthFailed && loadError == null && 'Google rejected this Maps API key (gm_authFailure).'}
        </p>
        <MapsTroubleshootPanel variant="map-load" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b bg-muted/30 p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Search area</p>
        {isLoaded ? (
          <LocationAutocomplete
            onPlaceSelect={(lat, lng, label) => {
              onSearchLocation(lat, lng, label);
            }}
          />
        ) : (
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" aria-hidden />
        )}
        <p className="text-[11px] text-muted-foreground">
          Tap <strong>the map</strong> to move the search point (the blue pin does not block map taps). For search, pick
          a row from the suggestions list.
        </p>
      </div>
      <div className="flex-1 min-h-[280px]">
        <MapComponent
          mapApiReady={isLoaded}
          userLat={userLat}
          userLng={userLng}
          stores={stores}
          selectedPlaceId={selectedPlaceId}
          onSelectStore={onSelectStore}
          onPickLocationOnMap={onPickLocationOnMap}
          onReverseGeocode={onReverseGeocode}
        />
      </div>
    </div>
  );
}
