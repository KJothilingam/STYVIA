/**
 * Shared visual shell for admin pages (dashboard, orders, etc.).
 */
export const adminPageShell =
  'relative min-h-full overflow-hidden bg-gradient-to-b from-slate-50/98 via-indigo-50/22 to-slate-100/88 text-foreground dark:from-[hsl(222_28%_10%)] dark:via-[hsl(250_22%_12%)] dark:to-[hsl(222_35%_7%)]';

export const adminContentClass =
  'relative z-10 mx-auto max-w-[1600px] space-y-8 px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10';

export const adminGlassCard =
  'rounded-[1.35rem] border border-border/65 bg-card/88 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.14)] backdrop-blur-md dark:border-border/80 dark:bg-card/75 dark:shadow-[0_24px_70px_-20px_rgba(0,0,0,0.45)]';

export function AdminStudioBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-1/4 top-0 h-[min(64vh,480px)] w-[min(90vw,700px)] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(239_65%_58%/0.2)_0%,transparent_65%)] blur-3xl motion-safe:animate-wardrobe-ambient dark:bg-[radial-gradient(ellipse_at_center,hsl(239_55%_48%/0.18)_0%,transparent_62%)]" />
      <div className="absolute -right-1/4 bottom-[10%] h-[min(52vh,420px)] w-[min(85vw,600px)] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(262_48%_52%/0.14)_0%,transparent_58%)] blur-3xl motion-safe:animate-wardrobe-ambient [animation-delay:-6s] dark:bg-[radial-gradient(ellipse_at_center,hsl(262_40%_45%/0.12)_0%,transparent_56%)]" />
      <div className="absolute left-1/2 top-1/4 h-[min(38vh,320px)] w-[min(58vw,440px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,hsl(199_70%_48%/0.1)_0%,transparent_55%)] blur-3xl motion-safe:animate-body-zone-float dark:bg-[radial-gradient(ellipse_at_center,hsl(199_55%_42%/0.08)_0%,transparent_55%)]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:repeating-linear-gradient(90deg,transparent,transparent_44px,hsl(230_40%_40%/0.06)_44px,hsl(230_40%_40%/0.06)_45px)] dark:opacity-[0.08] dark:[background-image:repeating-linear-gradient(90deg,transparent,transparent_44px,hsl(0_0%_100%/0.05)_44px,hsl(0_0%_100%/0.05)_45px)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/35 to-transparent dark:via-indigo-400/25" />
    </div>
  );
}
