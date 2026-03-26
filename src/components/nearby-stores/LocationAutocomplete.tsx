import { useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Search } from 'lucide-react';

export interface LocationAutocompleteProps {
  onPlaceSelect: (lat: number, lng: number, label: string) => void;
}

/**
 * Requires Maps JS API + Places library (loaded by parent via useJsApiLoader).
 */
export function LocationAutocomplete({ onPlaceSelect }: LocationAutocompleteProps) {
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Autocomplete
        onLoad={(instance) => {
          acRef.current = instance;
        }}
        onPlaceChanged={() => {
          const place = acRef.current?.getPlace();
          let lat: number | undefined;
          let lng: number | undefined;
          const loc = place?.geometry?.location;
          if (loc) {
            lat = loc.lat();
            lng = loc.lng();
          } else if (place?.geometry?.viewport) {
            const c = place.geometry.viewport.getCenter();
            lat = c.lat();
            lng = c.lng();
          }
          if (lat == null || lng == null || !place) {
            window.alert(
              'Pick a place from the suggestion list (do not only press Enter). That locks the correct coordinates.',
            );
            return;
          }
          const name =
            place.formatted_address || place.name || place.vicinity || 'Selected location';
          onPlaceSelect(lat, lng, name);
        }}
        options={{
          fields: ['geometry', 'formatted_address', 'name', 'vicinity'],
        }}
      >
        <input
          type="text"
          placeholder="Search location (Mumbai, Bangalore, address…)"
          className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          autoComplete="off"
        />
      </Autocomplete>
    </div>
  );
}
