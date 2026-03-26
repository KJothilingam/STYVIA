/**
 * Maps JavaScript API key (browser). Env vars override when set.
 * Rotate this key if the repo is public; prefer VITE_GOOGLE_MAPS_API_KEY in production.
 */
const EMBEDDED_MAPS_JS_KEY = 'AIzaSyCG1I9it7DgAvX5YlgkVkwKgMxTykziy4U';

export function getGoogleMapsBrowserApiKey(): string {
  return (
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined)?.trim() ||
    EMBEDDED_MAPS_JS_KEY
  );
}
