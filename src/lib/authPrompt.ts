import type { NavigateFunction } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { getSafeInternalPath } from '@/lib/utils';

let navigateRef: NavigateFunction | null = null;

export function setAuthNavigate(nav: NavigateFunction | null) {
  navigateRef = nav;
}

/**
 * Guest guard: top-center Sonner + navigate to login with safe `next` (open redirect safe).
 */
export function promptLogin(explicitPath?: string) {
  const raw =
    explicitPath ??
    (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/');
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  const safe = getSafeInternalPath(normalized) ?? '/';

  toast.message('Login to proceed further', {
    description: 'Sign in to continue.',
    position: 'top-center',
  });

  const target = `/login?next=${encodeURIComponent(safe)}`;
  if (navigateRef) {
    navigateRef(target);
  } else if (typeof window !== 'undefined') {
    window.location.assign(target);
  }
}
