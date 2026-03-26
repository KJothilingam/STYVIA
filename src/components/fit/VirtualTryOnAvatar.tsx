import type { BodyShape } from '@/services/bodyProfileService';

interface VirtualTryOnAvatarProps {
  productImageUrl: string;
  productName: string;
  heightCm: number;
  weightKg: number;
  bodyShape: BodyShape;
}

/**
 * Stylized 2D “virtual try-on”: silhouette scales with sliders; garment image is composited on the torso.
 * Not photorealistic 3D — aligns with honest product positioning in the project report.
 */
export function VirtualTryOnAvatar({
  productImageUrl,
  productName,
  heightCm,
  weightKg,
  bodyShape,
}: VirtualTryOnAvatarProps) {
  const hNorm = Math.min(1.15, Math.max(0.78, (heightCm - 140) / (200 - 140)));
  const wNorm = Math.min(1.12, Math.max(0.82, (weightKg - 45) / (110 - 45)));
  const shoulderMul = bodyShape === 'ATHLETIC' ? 1.06 : bodyShape === 'SLIM' ? 0.94 : bodyShape === 'HEAVY' ? 1.05 : 1;

  return (
    <div
      className="relative mx-auto flex w-full max-w-[280px] flex-col items-center justify-end rounded-2xl border bg-gradient-to-b from-muted/40 to-muted/80 px-4 pb-6 pt-10 shadow-inner"
      style={{ aspectRatio: '3 / 5' }}
      role="img"
      aria-label={`Virtual try-on preview for ${productName}`}
    >
      <div
        className="relative flex flex-col items-center justify-end origin-bottom transition-transform duration-500 ease-out"
        style={{
          transform: `scaleX(${wNorm * shoulderMul}) scaleY(${hNorm})`,
        }}
      >
        <svg viewBox="0 0 120 220" className="h-[220px] w-[120px] text-foreground/25 drop-shadow-sm" aria-hidden>
          <ellipse cx="60" cy="28" rx="22" ry="24" fill="currentColor" />
          <path
            d="M60 48 L28 62 Q22 88 26 118 L30 200 L48 200 L52 120 L68 120 L72 200 L90 200 L94 118 Q98 88 92 62 Z"
            fill="currentColor"
            opacity={0.35}
          />
          <path
            d="M60 48 L38 58 Q32 78 34 100 L38 188 L82 188 L86 100 Q88 78 82 58 Z"
            fill="currentColor"
            opacity={0.55}
          />
        </svg>

        <div
          className="pointer-events-none absolute left-1/2 top-[72px] w-[88px] -translate-x-1/2 overflow-hidden rounded-lg border-2 border-white/70 shadow-lg"
          style={{
            height: `${Math.round(118 * hNorm)}px`,
            opacity: 0.92,
          }}
        >
          <img src={productImageUrl} alt="" className="h-full w-full object-cover object-top" />
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground leading-snug max-w-[220px]">
        Preview scales with your height, weight, and shape. Open <strong>Fit scores</strong> for numeric fit confidence.
      </p>
    </div>
  );
}
