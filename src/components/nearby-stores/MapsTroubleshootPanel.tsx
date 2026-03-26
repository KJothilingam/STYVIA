import { AlertTriangle, ExternalLink } from 'lucide-react';

const CONSOLE_MAPS_JS = 'https://console.cloud.google.com/apis/library/maps-backend.googleapis.com';
const CONSOLE_PLACES = 'https://console.cloud.google.com/apis/library/places-backend.googleapis.com';
const CONSOLE_KEYS = 'https://console.cloud.google.com/apis/credentials';
const CONSOLE_BILLING = 'https://console.cloud.google.com/billing';

export function MapsTroubleshootPanel({ variant }: { variant: 'map-load' | 'stores-empty' }) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-left text-sm space-y-3">
      <div className="flex gap-2 font-semibold text-amber-950 dark:text-amber-100">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        {variant === 'map-load' ? 'Google Maps failed to load' : 'No stores from the server'}
      </div>

      {variant === 'map-load' && (
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-xs leading-relaxed">
          <li>
            <strong className="text-foreground">Billing</strong> must be enabled on the Google Cloud project (Maps shows
            &quot;For development purposes only&quot; or a popup when billing is off).
          </li>
          <li>
            Enable the <strong className="text-foreground">Maps JavaScript API</strong> for the key used in{' '}
            <code className="text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code>.
          </li>
          <li>
            Under <strong className="text-foreground">API restrictions</strong>, allow at least Maps JavaScript API and{' '}
            <strong className="text-foreground">Places API</strong> (needed for the search box).
          </li>
          <li>
            Under <strong className="text-foreground">Application restrictions → HTTP referrers</strong>, add:
            <code className="ml-1 text-[11px]">http://localhost:5173/*</code> and{' '}
            <code className="text-[11px]">http://127.0.0.1:5173/*</code>
          </li>
        </ol>
      )}

      {variant === 'stores-empty' && (
        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            The <strong className="text-foreground">browser map key</strong> and the{' '}
            <strong className="text-foreground">server Places key</strong> are different constraints:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <code className="text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code> — used in the browser; use{' '}
              <strong>HTTP referrer</strong> restrictions.
            </li>
            <li>
              <code className="text-[11px]">GOOGLE_PLACES_API_KEY</code> (Spring Boot) — used by Java over HTTPS;{' '}
              <strong>referrer rules do not apply</strong>. Use <strong>IP restriction</strong> (your server) or{' '}
              <strong>None</strong> for local dev, or create a <strong>second API key</strong> only for the backend.
            </li>
            <li>
              Enable <strong className="text-foreground">Places API</strong> (legacy Nearby Search) for the server key.
            </li>
          </ul>
          <p className="text-[11px]">
            If the same key is locked to &quot;HTTP referrers&quot; only, the map may still attempt to load while{' '}
            <code className="text-[11px]">/nearby-stores</code> gets <code className="text-[11px]">REQUEST_DENIED</code>{' '}
            and returns an empty list. Check backend logs for <code className="text-[11px]">Places Nearby Search API status</code>.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href={CONSOLE_BILLING}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Billing <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={CONSOLE_MAPS_JS}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Maps JavaScript API <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={CONSOLE_PLACES}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Places API <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={CONSOLE_KEYS}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Credentials <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
