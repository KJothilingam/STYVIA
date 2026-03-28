/**
 * Shared ambient layout for storefront Donations and admin donation ops — keeps visuals in sync.
 */
export function DonationsPageBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -left-1/4 top-0 h-[min(72vh,560px)] w-[min(90vw,720px)] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(152_55%_52%/0.35)_0%,transparent_68%)] blur-3xl motion-safe:animate-wardrobe-ambient dark:bg-[radial-gradient(ellipse_at_center,hsl(152_50%_38%/0.28)_0%,transparent_68%)]"
      />
      <div
        className="absolute -right-1/4 bottom-0 h-[min(65vh,520px)] w-[min(85vw,680px)] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(262_48%_58%/0.2)_0%,transparent_62%)] blur-3xl motion-safe:animate-wardrobe-ambient [animation-delay:-7s] dark:bg-[radial-gradient(ellipse_at_center,hsl(262_42%_42%/0.22)_0%,transparent_62%)]"
      />
      <div
        className="absolute left-1/2 top-1/3 h-[min(50vh,420px)] w-[min(70vw,520px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,hsl(43_90%_55%/0.18)_0%,transparent_60%)] blur-3xl motion-safe:animate-body-zone-float dark:bg-[radial-gradient(ellipse_at_center,hsl(43_90%_50%/0.12)_0%,transparent_60%)]"
      />
      <div className="absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(90deg,transparent,transparent_52px,hsl(160_40%_40%/0.06)_52px,hsl(160_40%_40%/0.06)_53px)] dark:opacity-[0.09] dark:[background-image:repeating-linear-gradient(90deg,transparent,transparent_52px,hsl(0_0%_100%/0.07)_52px,hsl(0_0%_100%/0.07)_53px)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/45 to-transparent dark:via-emerald-400/35" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal-500/25 to-transparent opacity-70 dark:via-teal-500/20 dark:opacity-60" />
    </div>
  );
}

export const donationsAmbientPageClass =
  'relative min-h-full overflow-hidden bg-gradient-to-b from-emerald-50/95 via-teal-50/35 to-background text-foreground dark:from-[hsl(158_28%_12%)] dark:via-[hsl(158_24%_10%)] dark:to-[hsl(158_30%_8%)]';

/** Primary column below backdrop (matches user Donations). */
export const donationsPageContentClass =
  'relative z-10 mx-auto w-full max-w-[1600px] space-y-8 px-4 py-8 pb-16 md:px-6 md:py-12 lg:px-8';

/** Large frosted panel wrapping tabs + lists (matches user Donations). */
export const donationsMainGlassPanelClass =
  'relative rounded-[2rem] border border-border/70 bg-card/85 bg-gradient-to-b from-white/90 to-emerald-50/40 p-5 shadow-[0_20px_60px_-24px_hsl(160_40%_20%/0.12)] backdrop-blur-md dark:border-white/[0.1] dark:from-white/[0.1] dark:to-white/[0.03] dark:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.5)] md:p-8 lg:p-10';
