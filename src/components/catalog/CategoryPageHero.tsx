import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CatalogCategorySlug = 'men' | 'women' | 'kids' | 'accessories';

const THEMES: Record<
  CatalogCategorySlug,
  {
    title: string;
    subtitle: string;
    gradient: string;
    orbA: string;
    orbB: string;
    orbC: string;
    accentText: string;
    chipClass: string;
  }
> = {
  men: {
    title: "Men's",
    subtitle: 'Tailored lines, urban edge, and everyday essentials — built to move with you.',
    gradient: 'from-slate-950 via-sky-950/95 to-indigo-950',
    orbA: 'bg-sky-500/35',
    orbB: 'bg-cyan-400/25',
    orbC: 'bg-indigo-500/20',
    accentText: 'text-sky-200/90',
    chipClass: 'border-sky-400/30 bg-sky-500/10 text-sky-100',
  },
  women: {
    title: "Women's",
    subtitle: 'Soft power dressing — from runway energy to quiet luxury and everything between.',
    gradient: 'from-rose-950 via-fuchsia-950/90 to-violet-950',
    orbA: 'bg-rose-500/35',
    orbB: 'bg-fuchsia-400/25',
    orbC: 'bg-violet-500/20',
    accentText: 'text-rose-100/90',
    chipClass: 'border-rose-300/35 bg-rose-500/10 text-rose-50',
  },
  kids: {
    title: 'Kids',
    subtitle: 'Play-proof fits, happy colours, and sizes that keep up with every adventure.',
    gradient: 'from-amber-950 via-orange-900/95 to-cyan-950',
    orbA: 'bg-amber-400/40',
    orbB: 'bg-cyan-400/30',
    orbC: 'bg-orange-500/25',
    accentText: 'text-amber-100/95',
    chipClass: 'border-amber-300/40 bg-amber-400/15 text-amber-50',
  },
  accessories: {
    title: 'Accessories',
    subtitle: 'Finishing touches — watches, bags, and details that complete the story.',
    gradient: 'from-stone-950 via-amber-950/90 to-yellow-950',
    orbA: 'bg-amber-500/30',
    orbB: 'bg-yellow-400/20',
    orbC: 'bg-stone-500/15',
    accentText: 'text-amber-100/90',
    chipClass: 'border-amber-400/35 bg-amber-500/10 text-amber-50',
  },
};

interface CategoryPageHeroProps {
  category: CatalogCategorySlug;
  itemCount: number;
  loading?: boolean;
}

const CategoryPageHero = ({ category, itemCount, loading }: CategoryPageHeroProps) => {
  const t = THEMES[category];

  return (
    <div
      className={cn(
        'relative mb-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br shadow-lg',
        'ring-1 ring-black/5 dark:ring-white/10',
        t.gradient,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full blur-3xl motion-safe:animate-home-pulse-soft',
          t.orbA,
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute -right-16 top-1/3 h-64 w-64 rounded-full blur-3xl motion-safe:animate-home-float-slow',
          t.orbB,
        )}
        style={{ animationDelay: '-4s' }}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute bottom-0 left-1/3 h-48 w-[28rem] rounded-full blur-3xl opacity-80 motion-safe:animate-category-hero-vignette-pulse',
          t.orbC,
        )}
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%20opacity%3D%220.04%22%2F%3E%3C%2Fsvg%3E')] opacity-60" aria-hidden />

      {/* Diagonal light rays — sweep across the banner */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl motion-reduce:hidden"
        aria-hidden
      >
        <div
          className={cn(
            'absolute -left-1/4 top-0 h-full w-[55%] mix-blend-overlay',
            'bg-gradient-to-r from-transparent via-white/50 to-transparent',
            'blur-[2px] motion-safe:animate-category-hero-ray',
          )}
        />
        <div
          className={cn(
            'absolute -left-1/4 top-0 h-full w-[22%] mix-blend-soft-light',
            'bg-gradient-to-r from-transparent via-white/90 to-transparent',
            'motion-safe:animate-category-hero-ray-narrow',
          )}
          style={{ animationDelay: '2.85s' }}
        />
        <div
          className={cn(
            'absolute -left-1/4 top-0 h-full w-[12%] opacity-40',
            'bg-gradient-to-r from-transparent via-white to-transparent',
            'motion-safe:animate-category-hero-ray-narrow',
          )}
          style={{ animationDelay: '1.1s', animationDuration: '8.5s' }}
        />
      </div>

      {/* Soft moving highlight along top edge */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden rounded-t-2xl opacity-90 motion-reduce:hidden"
        aria-hidden
      >
        <div
          className={cn(
            'h-full w-[40%] bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[1px]',
            'motion-safe:animate-category-hero-edge-shine',
          )}
        />
      </div>

      <div className="relative z-10 px-4 py-5 md:px-6 md:py-6 lg:px-8">
        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md sm:text-[11px] sm:px-2.5">
          <Sparkles className="h-3 w-3 shrink-0 motion-safe:animate-pulse" aria-hidden />
          <span className={cn('rounded-full px-1.5 py-px sm:px-2', t.chipClass)}>Styvia collection</span>
        </div>

        <h1 className="motion-safe:animate-home-reveal-up font-sans text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)] sm:text-3xl md:text-3xl lg:text-4xl">
          <span className="bg-gradient-to-r from-white via-white to-white/75 bg-clip-text text-transparent">
            {t.title}
          </span>{' '}
          <span className={cn('font-light italic opacity-95', t.accentText)}>collection</span>
        </h1>

        <p
          className={cn(
            'motion-safe:animate-home-reveal-up mt-1.5 max-w-2xl text-xs leading-snug sm:text-sm md:text-sm',
            t.accentText,
          )}
          style={{ animationDelay: '80ms' }}
        >
          {t.subtitle}
        </p>

        <div
          className="motion-safe:animate-home-reveal-up mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2"
          style={{ animationDelay: '140ms' }}
        >
          <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium leading-tight text-white/90 ring-1 ring-white/15 backdrop-blur-sm sm:text-xs sm:px-2.5 sm:py-1">
            {loading
              ? 'Loading…'
              : itemCount === 1
                ? '1 piece in this collection'
                : `${itemCount} pieces in this collection`}
          </span>
          <Link
            to="/"
            className="inline-flex items-center rounded-md border border-white/25 bg-white/90 px-2 py-0.5 text-[11px] font-medium leading-tight text-slate-900 shadow-sm transition hover:bg-white sm:text-xs sm:px-2.5 sm:py-1"
          >
            ← Back to home
          </Link>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px overflow-hidden motion-reduce:hidden"
        aria-hidden
      >
        <div
          className="h-full w-[35%] bg-gradient-to-r from-transparent via-white/50 to-transparent motion-safe:animate-category-hero-edge-shine"
          style={{ animationDelay: '1.4s' }}
        />
      </div>
    </div>
  );
};

export default CategoryPageHero;
