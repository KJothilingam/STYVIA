/**
 * Maps JavaScript API + Places Autocomplete (browser).
 * Also configured on the server in application.yml:
 * - places-api-key: Places Nearby Search + Photo (AIzaSyD8SvH5aZN2PJOQ7YxuQ0Eh0TpUFWY2V94)
 * - geocoding-api-key: Geocoding REST (AIzaSyA-mQkSyn27E8xHasFL7J5Gr8RixbpsnRA)
 * Env VITE_GOOGLE_MAPS_API_KEY overrides this when set.
 */
const EMBEDDED_MAPS_JS_KEY = 'AIzaSyCG1I9it7DgAvX5YlgkVkwKgMxTykziy4U';

export function getGoogleMapsBrowserApiKey(): string {
  return (
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined)?.trim() ||
    EMBEDDED_MAPS_JS_KEY
  );
}
