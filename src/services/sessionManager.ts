import axios from 'axios';
import { API_BASE_URL } from '@/config/apiBaseUrl';
import type { AuthResponse } from '@/services/authService';
import { getAccessTokenExpiryMs } from '@/lib/jwtUtils';

/** Refresh this long before access token expires */
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;
/** Minimum delay before proactive refresh (avoid tight loops) */
const MIN_SCHEDULE_DELAY_MS = 15_000;
/** Maximum timer we’ll set (sanity) */
const MAX_SCHEDULE_DELAY_MS = 24 * 60 * 60 * 1000;

type SessionListener = (event: 'logout' | 'tokens-updated') => void;

const listeners = new Set<SessionListener>();

let refreshInFlight: Promise<AuthResponse> | null = null;
let proactiveTimer: ReturnType<typeof setTimeout> | null = null;

function notify(event: 'logout' | 'tokens-updated') {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      /* ignore */
    }
  });
}

export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persistAuthResponse(data: AuthResponse) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  const raw = localStorage.getItem('user');
  let merged: AuthResponse = data;
  if (raw) {
    try {
      const prev = JSON.parse(raw) as Partial<AuthResponse>;
      merged = {
        ...prev,
        ...data,
        roles: Array.isArray(data.roles) ? data.roles : Array.isArray(prev.roles) ? prev.roles : [],
      } as AuthResponse;
    } catch {
      merged = data;
    }
  }
  localStorage.setItem('user', JSON.stringify(merged));
}

/**
 * Deduplicated refresh (used by axios 401 handler). Uses raw axios so the api client interceptor cannot recurse.
 */
export async function refreshSessionTokens(): Promise<AuthResponse> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return Promise.reject(new Error('No refresh token'));
  }

  refreshInFlight = (async () => {
    try {
      const response = await axios.post<{ data: AuthResponse }>(`${API_BASE_URL}/auth/refresh`, null, {
        params: { refreshToken },
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response.data?.data;
      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error('Invalid refresh response');
      }

      persistAuthResponse(data);
      notify('tokens-updated');
      scheduleProactiveAccessRefresh();
      return data;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export function scheduleProactiveAccessRefresh() {
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
    proactiveTimer = null;
  }

  const access = localStorage.getItem('accessToken');
  const refresh = localStorage.getItem('refreshToken');
  if (!access || !refresh) return;

  const expMs = getAccessTokenExpiryMs(access);
  if (!expMs) return;

  const now = Date.now();
  const refreshAt = expMs - REFRESH_BEFORE_EXPIRY_MS;
  let delay = refreshAt - now;
  if (delay < MIN_SCHEDULE_DELAY_MS) delay = MIN_SCHEDULE_DELAY_MS;
  if (delay > MAX_SCHEDULE_DELAY_MS) return;

  proactiveTimer = setTimeout(async () => {
    proactiveTimer = null;
    try {
      await refreshSessionTokens();
    } catch {
      clearSessionAndNotify();
      redirectAfterSessionInvalid();
    }
  }, delay);
}

/** Call after login / signup storage is written */
export function onSessionEstablished() {
  scheduleProactiveAccessRefresh();
}

export function clearClientSession() {
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
    proactiveTimer = null;
  }
  refreshInFlight = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

/** Clear tokens and notify React listeners (same-tab logout or failed refresh). */
export function clearSessionAndNotify() {
  clearClientSession();
  notify('logout');
}

export function redirectAfterSessionInvalid() {
  const path = window.location.pathname;
  const wasAdmin = path.startsWith('/admin');
  window.location.href = wasAdmin ? '/login?session=expired&from=admin' : '/login?session=expired';
}

function isAuthRefreshUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\/auth\/(refresh|login|signup)(?:\?|$)/.test(url);
}

/** Wire once from api interceptor */
export function shouldSkipAuthRetry(config: { url?: string } | undefined): boolean {
  return isAuthRefreshUrl(config?.url);
}

const PROTECTED_ROUTE_PREFIXES = [
  '/admin',
  '/cart',
  '/wishlist',
  '/profile',
  '/body',
  '/checkout',
  '/orders',
  '/wardrobe',
  '/donations',
  '/donation-box',
  '/shops',
  '/order-confirmation',
  '/fit-studio',
];

function pathRequiresAuth(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((pre) => pathname === pre || pathname.startsWith(`${pre}/`));
}

let crossTabListenerAttached = false;

export function initSessionCrossTabSync() {
  if (crossTabListenerAttached) return;
  crossTabListenerAttached = true;
  window.addEventListener('storage', (e) => {
    if (e.key !== 'accessToken') return;
    if (e.newValue) {
      notify('tokens-updated');
      scheduleProactiveAccessRefresh();
      return;
    }
    if (e.oldValue && !e.newValue) {
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      notify('logout');
      if (pathRequiresAuth(window.location.pathname)) {
        redirectAfterSessionInvalid();
      }
    }
  });
}
