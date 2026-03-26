import { useEffect, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: 'places'[] = ['places'];

type GmWindow = Window & { gm_authFailure?: () => void };

/**
 * Single Maps JS load for nearby stores (map + Places autocomplete).
 */
export function useGoogleMapsNearbyLoader(apiKey: string) {
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

  return { isLoaded, loadError, mapsAuthFailed };
}
