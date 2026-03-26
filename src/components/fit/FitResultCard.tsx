import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowUpCircle, Ruler } from 'lucide-react';
import { FitCheckResponse } from '@/services/fitService';

type Props = {
  result: FitCheckResponse;
  selectedSize: string;
};

const toneByFit: Record<FitCheckResponse['fit'], string> = {
  GOOD: 'text-green-700 bg-green-50 border-green-200',
  TIGHT: 'text-orange-700 bg-orange-50 border-orange-200',
  LOOSE: 'text-blue-700 bg-blue-50 border-blue-200',
};

function Row({ label, body, garment }: { label: string; body: number; garment: number }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-0.5 text-xs sm:text-sm border-b border-border/50 py-2 last:border-0">
      <span className="font-medium text-foreground">{label}</span>
      <span className="tabular-nums text-muted-foreground text-right">You ≈ {body} cm</span>
      <span className="tabular-nums text-right">Size {garment} cm</span>
    </div>
  );
}

export default function FitResultCard({ result, selectedSize }: Props) {
  const c = result.comparison;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className={`rounded-full px-3 py-1 text-xs font-bold border ${toneByFit[result.fit]}`}>
          {result.fit === 'GOOD' ? 'Good Fit' : result.fit === 'TIGHT' ? 'May Be Tight' : 'May Be Loose'}
        </div>
        <span className="text-sm font-semibold">{result.confidence}% match</span>
      </div>

      <p className="text-sm text-foreground">{result.message}</p>

      <p className="text-xs text-muted-foreground leading-relaxed">
        We compared <strong className="text-foreground">size {selectedSize}</strong> on this product to your{' '}
        <Link to="/body" className="text-primary font-medium underline underline-offset-2">
          Body
        </Link>{' '}
        profile (estimated chest, shoulder, waist, length). Garment numbers come from our size chart when available,
        otherwise graded from your measurements.
      </p>

      {c ? (
        <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
            <Ruler className="h-3.5 w-3.5" aria-hidden />
            Body vs this size (cm)
          </div>
          <Row label="Chest" body={c.bodyChestCm} garment={c.garmentChestCm} />
          <Row label="Shoulder" body={c.bodyShoulderCm} garment={c.garmentShoulderCm} />
          <Row label="Waist" body={c.bodyWaistCm} garment={c.garmentWaistCm} />
          <Row label="Length" body={c.bodyLengthCm} garment={c.garmentLengthCm} />
        </div>
      ) : null}

      <div className="space-y-1">
        {result.issues?.map((issue) => (
          <p key={issue} className="text-sm text-muted-foreground flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
            <span>{issue}</span>
          </p>
        ))}
      </div>

      {result.suggestedSize && result.suggestedSize !== selectedSize ? (
        <p className="text-sm font-medium flex items-center gap-2">
          <ArrowUpCircle className="h-4 w-4 text-primary" />
          Try size <strong>{result.suggestedSize}</strong> for a better overall match.
        </p>
      ) : (
        <p className="text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Selected size <strong>{selectedSize}</strong> scores best among in-stock sizes for your profile.
        </p>
      )}
    </div>
  );
}
