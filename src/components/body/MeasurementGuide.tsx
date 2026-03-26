/**
 * Compact diagram: where to measure chest & shoulder (front torso).
 */
export default function MeasurementGuide({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-dashed border-primary/30 bg-muted/30 p-4 ${className}`}
      role="img"
      aria-label="Diagram showing chest and shoulder measurement positions on the upper body"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Where to measure</p>
      <svg viewBox="0 0 200 240" className="mx-auto h-44 w-auto max-w-full text-foreground" aria-hidden>
        {/* torso */}
        <ellipse cx="100" cy="52" rx="28" ry="22" fill="currentColor" opacity="0.12" />
        <path
          d="M 72 58 Q 100 48 128 58 L 132 120 Q 100 128 68 120 Z"
          fill="currentColor"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.35"
        />
        {/* chest band */}
        <ellipse cx="100" cy="88" rx="34" ry="10" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
        <text x="100" y="86" textAnchor="middle" className="fill-primary text-[10px] font-bold">
          Chest
        </text>
        {/* shoulder line */}
        <line x1="55" y1="62" x2="145" y2="62" stroke="hsl(var(--intelligence-mid))" strokeWidth="2" strokeDasharray="4 3" />
        <text x="100" y="56" textAnchor="middle" className="fill-[hsl(var(--intelligence-mid))] text-[9px] font-semibold">
          Shoulder
        </text>
        {/* waist hint */}
        <ellipse cx="100" cy="118" rx="30" ry="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        <text x="100" y="121" textAnchor="middle" className="fill-muted-foreground text-[9px]">
          Waist
        </text>
      </svg>
      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
        Chest: around the fullest part, keep tape level. Shoulder: seam to seam across the back. Waist: narrowest part of
        torso.
      </p>
    </div>
  );
}
