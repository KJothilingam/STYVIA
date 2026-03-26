import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

/**
 * Sitewide strip so Body Intelligence is never “hidden” behind generic e‑com chrome.
 */
const IntelligenceStrip = () => {
  const { isLoggedIn } = useStore();

  return (
    <div className="border-b border-white/10 bg-gradient-to-r from-intelligence-deep via-intelligence-mid to-[hsl(220_45%_18%)] text-white shadow-sm">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
              <Sparkles className="h-4 w-4 text-intelligence-glow" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-intelligence-glow/95">
                Body Intelligence
              </p>
              <p className="text-xs sm:text-sm text-white/90 truncate sm:whitespace-normal">
                Rule-based fit + crowd signals + optional ML layer — scores on every product when you&apos;re signed in.
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs sm:text-sm font-medium">
            <Link
              to={isLoggedIn ? '/profile' : '/login?next=%2Fprofile'}
              className="inline-flex items-center gap-0.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/25 transition hover:bg-white/25"
            >
              {isLoggedIn ? 'Body profile' : 'Sign in · Body profile'}
              <ChevronRight className="h-3.5 w-3.5 opacity-80" />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              Shop · Fit scores
              <ChevronRight className="h-3.5 w-3.5 opacity-70" />
            </Link>
            <Link
              to={isLoggedIn ? '/wardrobe' : '/login?next=%2Fwardrobe'}
              className="inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              Smart wardrobe
              <ChevronRight className="h-3.5 w-3.5 opacity-70" />
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceStrip;
