import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ShoppingShellTone = 'amber' | 'rose' | 'emerald';

const SHELL_BG: Record<
  ShoppingShellTone,
  { light: string; dark: string; topLine: string; chipHover: string }
> = {
  amber: {
    light: 'from-amber-50/95 via-orange-50/28 to-background',
    dark: 'dark:from-[hsl(35_26%_14%)] dark:via-[hsl(28_22%_11%)] dark:to-[hsl(30_30%_8%)]',
    topLine: 'via-amber-400/40 dark:via-amber-400/28',
    chipHover: 'hover:text-amber-800 dark:hover:text-amber-200',
  },
  rose: {
    light: 'from-rose-50/95 via-fuchsia-50/22 to-background',
    dark: 'dark:from-[hsl(330_26%_14%)] dark:via-[hsl(300_20%_11%)] dark:to-[hsl(280_28%_8%)]',
    topLine: 'via-rose-400/42 dark:via-rose-400/28',
    chipHover: 'hover:text-rose-800 dark:hover:text-rose-200',
  },
  emerald: {
    light: 'from-emerald-50/95 via-teal-50/28 to-background',
    dark: 'dark:from-[hsl(158_26%_12%)] dark:via-[hsl(170_22%_10%)] dark:to-[hsl(160_28%_8%)]',
    topLine: 'via-emerald-400/45 dark:via-emerald-400/30',
    chipHover: 'hover:text-emerald-800 dark:hover:text-emerald-200',
  },
};

const BLOB_A: Record<ShoppingShellTone, string> = {
  amber:
    'bg-[radial-gradient(ellipse_at_center,hsl(38_88%_54%/0.26)_0%,transparent_66%)] dark:bg-[radial-gradient(ellipse_at_center,hsl(38_70%_45%/0.2)_0%,transparent_64%)]',
  rose:
    'bg-[radial-gradient(ellipse_at_center,hsl(330_75%_58%/0.22)_0%,transparent_65%)] dark:bg-[radial-gradient(ellipse_at_center,hsl(330_55%_45%/0.18)_0%,transparent_62%)]',
  emerald:
    'bg-[radial-gradient(ellipse_at_center,hsl(152_58%_48%/0.24)_0%,transparent_66%)] dark:bg-[radial-gradient(ellipse_at_center,hsl(152_50%_38%/0.22)_0%,transparent_64%)]',
};

const BLOB_B: Record<ShoppingShellTone, string> = {
  amber:
    'bg-[radial-gradient(ellipse_at_center,hsl(25_82%_52%/0.16)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,hsl(25_60%_42%/0.14)_0%,transparent_58%)]',
  rose:
    'bg-[radial-gradient(ellipse_at_center,hsl(280_65%_55%/0.14)_0%,transparent_58%)] dark:bg-[radial-gradient(ellipse_at_center,hsl(280_50%_42%/0.12)_0%,transparent_56%)]',
  emerald:
    'bg-[radial-gradient(ellipse_at_center,hsl(188_72%_42%/0.18)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,hsl(188_55%_38%/0.14)_0%,transparent_58%)]',
};

const BLOB_C: Record<ShoppingShellTone, string> = {
  amber:
    'bg-[radial-gradient(ellipse_at_center,hsl(43_90%_55%/0.1)_0%,transparent_55%)] dark:bg-[radial-gradient(ellipse_at_center,hsl(43_80%_45%/0.08)_0%,transparent_55%)]',
  rose:
    'bg-[radial-gradient(ellipse_at_center,hsl(340_80%_58%/0.1)_0%,transparent_55%)] dark:bg-[radial-gradient(ellipse_at_center,hsl(340_60%_45%/0.08)_0%,transparent_55%)]',
  emerald:
    'bg-[radial-gradient(ellipse_at_center,hsl(220_75%_58%/0.1)_0%,transparent_55%)] dark:bg-[radial-gradient(ellipse_at_center,hsl(220_55%_48%/0.08)_0%,transparent_55%)]',
};

const STRIPE: Record<ShoppingShellTone, string> = {
  amber:
    'opacity-[0.06] [background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(35_45%_45%/0.07)_48px,hsl(35_45%_45%/0.07)_49px)] dark:opacity-[0.09] dark:[background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(0_0%_100%/0.06)_48px,hsl(0_0%_100%/0.06)_49px)]',
  rose:
    'opacity-[0.06] [background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(320_40%_50%/0.07)_48px,hsl(320_40%_50%/0.07)_49px)] dark:opacity-[0.09] dark:[background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(0_0%_100%/0.06)_48px,hsl(0_0%_100%/0.06)_49px)]',
  emerald:
    'opacity-[0.06] [background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(160_40%_40%/0.06)_48px,hsl(160_40%_40%/0.06)_49px)] dark:opacity-[0.09] dark:[background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(0_0%_100%/0.06)_48px,hsl(0_0%_100%/0.06)_49px)]',
};

function ShoppingBackdrop({ tone }: { tone: ShoppingShellTone }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className={cn(
          'absolute -left-1/4 top-0 h-[min(68vh,520px)] w-[min(88vw,680px)] rounded-full blur-3xl motion-safe:animate-wardrobe-ambient',
          BLOB_A[tone],
        )}
      />
      <div
        className={cn(
          'absolute -right-1/4 bottom-0 h-[min(56vh,460px)] w-[min(82vw,580px)] rounded-full blur-3xl motion-safe:animate-wardrobe-ambient [animation-delay:-6s]',
          BLOB_B[tone],
        )}
      />
      <div
        className={cn(
          'absolute left-1/2 top-1/3 h-[min(42vh,380px)] w-[min(62vw,480px)] -translate-x-1/2 rounded-full blur-3xl motion-safe:animate-body-zone-float',
          BLOB_C[tone],
        )}
      />
      <div className={cn('absolute inset-0', STRIPE[tone])} />
    </div>
  );
}

function TopAccentLine({ tone }: { tone: ShoppingShellTone }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent to-transparent',
        SHELL_BG[tone].topLine,
      )}
    />
  );
}

export const glassCardClass =
  'relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 shadow-[0_20px_60px_-24px_hsl(220_40%_20%/0.1)] backdrop-blur-md dark:border-border dark:bg-card/80 dark:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.4)]';

export const glassCardInnerShine = (tone: ShoppingShellTone) =>
  cn(
    'pointer-events-none absolute inset-x-8 top-3 h-px rounded-full bg-[length:200%_100%] opacity-90 motion-safe:animate-wardrobe-rail-shine',
    tone === 'amber' && 'bg-gradient-to-r from-transparent via-amber-400/35 to-transparent dark:via-amber-400/25',
    tone === 'rose' && 'bg-gradient-to-r from-transparent via-rose-400/35 to-transparent dark:via-rose-400/25',
    tone === 'emerald' && 'bg-gradient-to-r from-transparent via-emerald-400/38 to-transparent dark:via-emerald-400/28',
  );

export function shoppingHeroIconClass(tone: ShoppingShellTone) {
  return cn(
    'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ring-2 motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:scale-105',
    tone === 'amber' &&
      'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-600/25 ring-amber-200/70 dark:shadow-amber-900/35 dark:ring-white/15',
    tone === 'rose' &&
      'bg-gradient-to-br from-rose-500 to-fuchsia-600 shadow-rose-600/25 ring-rose-200/70 dark:shadow-rose-900/35 dark:ring-white/15',
    tone === 'emerald' &&
      'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-600/25 ring-emerald-200/70 dark:shadow-emerald-900/35 dark:ring-white/15',
  );
}

interface ShoppingPageShellProps {
  tone: ShoppingShellTone;
  breadcrumb: ReactNode;
  chip: ReactNode;
  title: ReactNode;
  subtitle?: string;
  heroIcon: ReactNode;
  children: ReactNode;
}

export function ShoppingPageShell({ tone, breadcrumb, chip, title, subtitle, heroIcon, children }: ShoppingPageShellProps) {
  const s = SHELL_BG[tone];
  return (
    <div
      className={cn(
        'relative min-h-[62vh] overflow-hidden bg-gradient-to-b text-foreground',
        s.light,
        s.dark,
      )}
    >
      <ShoppingBackdrop tone={tone} />
      <TopAccentLine tone={tone} />
      <div className="relative z-10 mx-auto w-full max-w-[1600px] space-y-8 px-4 py-8 pb-16 md:px-6 md:py-12 lg:px-8">
        <div className="text-sm text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
          {breadcrumb}
        </div>
        <header
          className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500"
          style={{ animationFillMode: 'both' }}
        >
          {chip}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className={shoppingHeroIconClass(tone)}>{heroIcon}</div>
            <div className="min-w-0">
              <h1 className="font-display-hero text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">{title}</h1>
              {subtitle ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p> : null}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

export function shoppingBreadcrumbHomeClass(tone: ShoppingShellTone) {
  return cn(
    'inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 transition-colors',
    SHELL_BG[tone].chipHover,
  );
}
