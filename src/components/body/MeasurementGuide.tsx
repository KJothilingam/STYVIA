/**
 * Animated diagram: chest, shoulder, waist — measurement studio style.
 */
export default function MeasurementGuide({ className = '' }: { className?: string }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.06] via-muted/40 to-intelligence-deep/[0.08] p-5 shadow-inner dark:from-primary/10 dark:via-card/50 ${className}`}
      role="img"
      aria-label="Diagram showing chest and shoulder measurement positions on the upper body"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, hsl(var(--primary) / 0.15) 1px, transparent 1px),
            linear-gradient(hsl(var(--primary) / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '14px 14px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 animate-body-scan bg-gradient-to-b from-transparent via-primary/15 to-transparent"
        aria-hidden
      />

      <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-primary/90">
        Measurement map
      </p>
      <p className="relative mt-1 text-xs text-muted-foreground">Tape placement — front view</p>

      <svg
        viewBox="0 0 200 248"
        className="relative mx-auto mt-4 h-52 w-auto max-w-full text-foreground drop-shadow-sm"
        aria-hidden
      >
        <defs>
          <linearGradient id="mg-torso" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(var(--intelligence-mid))" stopOpacity="0.2" />
          </linearGradient>
          <filter id="mg-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="100" cy="52" rx="28" ry="22" fill="url(#mg-torso)" opacity="0.9" />
        <path
          d="M 72 58 Q 100 48 128 58 L 132 120 Q 100 132 68 120 Z"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeOpacity="0.25"
          filter="url(#mg-soft)"
        />

        {/* Chest — animated ring */}
        <ellipse
          cx="100"
          cy="88"
          rx="36"
          ry="11"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.2"
          strokeDasharray="8 6"
          className="origin-center animate-body-tick [animation-delay:0ms]"
        />
        <ellipse
          cx="100"
          cy="88"
          rx="40"
          ry="13"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          className="animate-pulse opacity-30"
        />
        <text x="100" y="84" textAnchor="middle" className="fill-primary text-[10px] font-bold">
          Chest
        </text>

        {/* Shoulder */}
        <line
          x1="52"
          y1="62"
          x2="148"
          y2="62"
          stroke="hsl(var(--intelligence-mid))"
          strokeWidth="2"
          strokeDasharray="6 5"
          strokeLinecap="round"
          className="animate-body-tick [animation-delay:200ms]"
        />
        <text
          x="100"
          y="56"
          textAnchor="middle"
          className="fill-[hsl(var(--intelligence-mid))] text-[9px] font-semibold"
        >
          Shoulder
        </text>

        {/* Waist */}
        <ellipse
          cx="100"
          cy="118"
          rx="31"
          ry="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.4"
          className="animate-body-tick [animation-delay:400ms]"
        />
        <text x="100" y="122" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          Waist
        </text>

        {/* Vertical guide */}
        <line
          x1="100"
          y1="28"
          x2="100"
          y2="200"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          strokeDasharray="3 5"
          opacity="0.2"
        />
      </svg>

      <p className="relative mt-3 border-t border-border/50 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground/90">Chest</span> — fullest part, tape level.{' '}
        <span className="font-semibold text-foreground/90">Shoulder</span> — seam to seam across the back.{' '}
        <span className="font-semibold text-foreground/90">Waist</span> — narrowest torso point.
      </p>
    </div>
  );
}
