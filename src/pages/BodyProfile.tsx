import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Ruler,
  Save,
  ScanLine,
  Shirt,
  Sparkles,
  UserRound,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/context/StoreContext';
import { cn } from '@/lib/utils';
import { deriveMeasurementEnums, estimateMeasurements } from '@/lib/bodyEstimates';
import { USUAL_TOP_SIZES } from '@/lib/usualTopSizes';
import MeasurementGuide from '@/components/body/MeasurementGuide';
import bodyProfileService, {
  type BodyProfileDTO,
  type BodyShape,
  type FitPreference,
} from '@/services/bodyProfileService';

const GENDERS: BodyProfileDTO['gender'][] = ['MEN', 'WOMEN', 'KIDS', 'UNISEX'];

const BODY_SHAPES: { value: BodyShape; label: string; hint: string }[] = [
  { value: 'SLIM', label: 'Slim', hint: 'Lean frame' },
  { value: 'REGULAR', label: 'Regular', hint: 'Balanced' },
  { value: 'ATHLETIC', label: 'Athletic', hint: 'Broader build' },
  { value: 'HEAVY', label: 'Heavy', hint: 'Fuller frame' },
];

const FIT_PREFS: { value: FitPreference; label: string; sub: string }[] = [
  { value: 'SLIM', label: 'Slim fit', sub: 'Closer cut' },
  { value: 'REGULAR', label: 'Regular', sub: 'Standard' },
  { value: 'LOOSE', label: 'Loose', sub: 'More room' },
];

function Silhouette({ type }: { type: BodyShape }) {
  const thin = type === 'SLIM';
  const wide = type === 'HEAVY' || type === 'ATHLETIC';
  const w = wide ? 38 : thin ? 26 : 32;
  return (
    <svg
      viewBox="0 0 64 88"
      className="h-[4.5rem] w-14 text-foreground/85 transition-all duration-500 ease-out"
      aria-hidden
    >
      <ellipse cx="32" cy="14" rx={thin ? 10 : wide ? 14 : 12} ry="11" fill="currentColor" opacity="0.18" />
      <path
        d={`M ${32 - w / 2} 26 Q 32 22 ${32 + w / 2} 26 L ${32 + w / 2 + 4} 52 Q 32 58 ${32 - w / 2 - 4} 52 Z`}
        fill="currentColor"
        opacity="0.22"
        className="transition-all duration-500"
      />
      <path
        d={`M ${32 - w / 3} 52 L ${32 - w / 4} 84 M ${32 + w / 3} 52 L ${32 + w / 4} 84`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

function StudioBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-primary/25 via-rose-400/15 to-transparent blur-[100px] animate-body-zone-glow" />
      <div
        className="absolute -right-20 top-1/3 h-[22rem] w-[22rem] rounded-full bg-gradient-to-bl from-intelligence-mid/20 via-primary/10 to-transparent blur-[90px] animate-body-zone-glow [animation-delay:1.2s]"
      />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-400/10 blur-[80px] animate-body-zone-float" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, hsl(var(--border) / 0.45) 1px, transparent 1px),
            linear-gradient(hsl(var(--border) / 0.45) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 85% 70% at 50% 20%, black 15%, transparent 70%)',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>
  );
}

type MeasureSectionProps = {
  sectionIndex: number;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: 'primary' | 'intelligence';
  children: ReactNode;
};

function MeasureSection({ sectionIndex, title, subtitle, icon: Icon, accent = 'primary', children }: MeasureSectionProps) {
  const delay = sectionIndex * 85;
  return (
    <section
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
      className={cn(
        'animate-in fade-in-0 slide-in-from-bottom-6 duration-700',
        'rounded-3xl border border-border/50 bg-card/85 p-6 shadow-xl shadow-black/[0.04] backdrop-blur-md',
        'transition-[box-shadow,transform,border-color] duration-300 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/[0.07]',
        'dark:border-white/[0.07] dark:bg-card/60 dark:shadow-black/40',
        'sm:p-8',
      )}
    >
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm',
              accent === 'primary'
                ? 'border-primary/30 bg-gradient-to-br from-primary/18 via-primary/8 to-transparent text-primary'
                : 'border-intelligence-mid/35 bg-gradient-to-br from-intelligence-deep/20 to-intelligence-mid/10 text-intelligence-mid',
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="font-display-hero text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function BodyProfile() {
  const { user } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');

  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);
  const [gender, setGender] = useState<BodyProfileDTO['gender']>('MEN');
  const [bodyShape, setBodyShape] = useState<BodyShape>('REGULAR');
  const [fitPreference, setFitPreference] = useState<FitPreference>('REGULAR');
  const [shoulderWidth, setShoulderWidth] = useState<BodyProfileDTO['shoulderWidth']>('NORMAL');
  const [chestType, setChestType] = useState<BodyProfileDTO['chestType']>('AVERAGE');
  const [waistType, setWaistType] = useState<BodyProfileDTO['waistType']>('AVERAGE');

  const [chestCm, setChestCm] = useState(96);
  const [shoulderCm, setShoulderCm] = useState(44);
  const [waistCm, setWaistCm] = useState(82);
  const [lengthCm, setLengthCm] = useState(70);

  const [usualShirtSize, setUsualShirtSize] = useState('');
  const [usualPantWaist, setUsualPantWaist] = useState('');
  const [usualShoeSize, setUsualShoeSize] = useState('');
  const [sareeStyle, setSareeStyle] = useState('');
  const [prefersFreeSize, setPrefersFreeSize] = useState(false);

  const applyEstimates = useCallback(() => {
    const e = estimateMeasurements(heightCm, weightKg, bodyShape, shoulderWidth);
    setChestCm(e.chestCm);
    setShoulderCm(e.shoulderCm);
    setWaistCm(e.waistCm);
    setLengthCm(e.lengthCm);
  }, [heightCm, weightKg, bodyShape, shoulderWidth]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true, state: { from: '/body' } });
      return;
    }
    let cancelled = false;
    bodyProfileService
      .get()
      .then((p) => {
        if (cancelled) return;
        if (!p) {
          const e = estimateMeasurements(170, 70, 'REGULAR', 'NORMAL');
          setChestCm(e.chestCm);
          setShoulderCm(e.shoulderCm);
          setWaistCm(e.waistCm);
          setLengthCm(e.lengthCm);
          return;
        }
        setHeightCm(p.heightCm);
        setWeightKg(p.weightKg);
        setGender(p.gender);
        setBodyShape(p.bodyShape);
        setFitPreference(p.fitPreference);
        setShoulderWidth(p.shoulderWidth);
        setChestType(p.chestType);
        setWaistType(p.waistType);
        const hasOverrides =
          p.chestCm != null && p.shoulderCm != null && p.waistCm != null && p.lengthCm != null;
        if (hasOverrides) {
          setMode('detailed');
          setChestCm(p.chestCm!);
          setShoulderCm(p.shoulderCm!);
          setWaistCm(p.waistCm!);
          setLengthCm(p.lengthCm!);
        } else {
          const e = estimateMeasurements(p.heightCm, p.weightKg, p.bodyShape, p.shoulderWidth);
          setChestCm(e.chestCm);
          setShoulderCm(e.shoulderCm);
          setWaistCm(e.waistCm);
          setLengthCm(e.lengthCm);
        }
        setUsualShirtSize((p.usualShirtSize?.trim() ?? '').toUpperCase());
        setUsualPantWaist(p.usualPantWaistInches != null ? String(p.usualPantWaistInches) : '');
        setUsualShoeSize(p.usualShoeSize?.trim() ?? '');
        setSareeStyle(p.sareeStyle?.trim() ?? '');
        setPrefersFreeSize(Boolean(p.prefersFreeSize));
      })
      .catch(() => {
        if (cancelled) return;
        const e = estimateMeasurements(170, 70, 'REGULAR', 'NORMAL');
        setChestCm(e.chestCm);
        setShoulderCm(e.shoulderCm);
        setWaistCm(e.waistCm);
        setLengthCm(e.lengthCm);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const pantParsed = parseInt(usualPantWaist, 10);
      const usualPantWaistInches =
        usualPantWaist.trim() === '' || !Number.isFinite(pantParsed)
          ? null
          : pantParsed >= 20 && pantParsed <= 60
            ? pantParsed
            : null;

      const usualFields = {
        usualShirtSize: usualShirtSize.trim() ? usualShirtSize.trim().toUpperCase() : null,
        usualPantWaistInches,
        usualShoeSize: usualShoeSize.trim() || null,
        sareeStyle: sareeStyle.trim() || null,
        prefersFreeSize,
      };

      let dto: BodyProfileDTO;
      if (mode === 'detailed') {
        const derived = deriveMeasurementEnums(heightCm, weightKg, bodyShape, {
          chestCm,
          waistCm,
          shoulderCm,
        });
        dto = {
          heightCm,
          weightKg,
          gender,
          bodyShape,
          fitPreference,
          shoulderWidth: derived.shoulderWidth,
          chestType: derived.chestType,
          waistType: derived.waistType,
          chestCm,
          shoulderCm,
          waistCm,
          lengthCm,
          ...usualFields,
        };
      } else {
        dto = {
          heightCm,
          weightKg,
          gender,
          bodyShape,
          fitPreference,
          shoulderWidth,
          chestType,
          waistType,
          chestCm: null,
          shoulderCm: null,
          waistCm: null,
          lengthCm: null,
          ...usualFields,
        };
      }
      await bodyProfileService.save(dto);
      toast({ title: 'Body profile saved', description: 'Fit checks will use your latest details.' });
    } catch {
      toast({ title: 'Could not save', description: 'Check your connection and try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <Layout>
        <div className="relative mx-auto flex min-h-[50vh] w-full max-w-[1600px] flex-col items-center justify-center gap-6 px-4 sm:px-6 lg:px-8">
          <StudioBackdrop />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/25 bg-card/80 shadow-xl backdrop-blur-md">
            <Loader2 className="h-9 w-9 animate-spin text-primary" />
            <span className="absolute inset-0 rounded-3xl border border-primary/20 animate-ping opacity-20" />
          </div>
          <p className="relative text-sm font-medium text-muted-foreground">Loading your measurement profile…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative overflow-hidden pb-28 md:pb-16">
        <StudioBackdrop />
        <div className="relative mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <nav className="mb-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-muted/60 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Account
            </Link>
            <span aria-hidden className="text-border">
              /
            </span>
            <span className="font-medium text-foreground">Body studio</span>
          </nav>

          <header
            className="mb-10 animate-in fade-in-0 slide-in-from-bottom-3 duration-500"
            style={{ animationFillMode: 'both' }}
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="min-w-0 flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-gradient-to-r from-primary/10 via-rose-500/10 to-transparent px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
                  <ScanLine className="h-3.5 w-3.5 animate-pulse" />
                  Measurement zone
                </div>
                <h1 className="font-display-hero text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Calibrate your{' '}
                  <span className="bg-gradient-to-r from-primary via-rose-500 to-amber-500 bg-clip-text text-transparent">
                    fit profile
                  </span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  A guided studio for height, shape, and (optionally) tape measurements — tuned for check-fit across the
                  catalog.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      { label: 'Height', value: `${Math.round(heightCm)}`, unit: 'cm' },
                      { label: 'Weight', value: weightKg.toFixed(1), unit: 'kg' },
                      { label: 'Mode', value: mode === 'quick' ? 'Quick' : 'Tape', unit: '' },
                      { label: 'Shape', value: bodyShape.charAt(0) + bodyShape.slice(1).toLowerCase(), unit: '' },
                    ] as const
                  ).map((cell, i) => (
                    <div
                      key={cell.label}
                      className={cn(
                        'animate-in fade-in-0 zoom-in-95 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md',
                        'dark:bg-background/40',
                      )}
                      style={{ animationDelay: `${120 + i * 60}ms`, animationFillMode: 'both' }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{cell.label}</p>
                      <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
                        {cell.value}
                        {cell.unit ? (
                          <span className="ml-1 text-sm font-normal text-muted-foreground">{cell.unit}</span>
                        ) : null}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full shrink-0 lg:max-w-[340px]">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entry mode</p>
                <ToggleGroup
                  type="single"
                  value={mode}
                  onValueChange={(v) => {
                    if (v === 'quick' || v === 'detailed') setMode(v);
                  }}
                  className="inline-flex w-full flex-col gap-2 rounded-2xl border border-border/60 bg-muted/40 p-2 shadow-inner sm:flex-row sm:gap-0"
                >
                  <ToggleGroupItem
                    value="quick"
                    className={cn(
                      'min-h-12 flex-1 gap-2 rounded-xl px-4 font-semibold transition-all duration-200',
                      'data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-background/50',
                      'data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-md',
                      'data-[state=on]:ring-2 data-[state=on]:ring-primary/20',
                    )}
                  >
                    <Zap className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                    Quick estimate
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="detailed"
                    className={cn(
                      'min-h-12 flex-1 gap-2 rounded-xl px-4 font-semibold transition-all duration-200',
                      'data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-background/50',
                      'data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-md',
                      'data-[state=on]:ring-2 data-[state=on]:ring-primary/20',
                    )}
                  >
                    <Ruler className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    Tape measurements
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Quick uses height &amp; weight intelligence. Tape unlocks chest, shoulder, waist &amp; length fields.
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-8 lg:space-y-10">
          <MeasureSection
            sectionIndex={0}
            title="Vitals & identity"
            subtitle="Sliders update your live readouts above. Gender steers size curves in fit checks."
            icon={UserRound}
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-6">
              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <Label className="text-base font-semibold">Height</Label>
                  <span className="tabular-nums text-lg font-bold text-primary">{Math.round(heightCm)} cm</span>
                </div>
                <Slider
                  value={[heightCm]}
                  onValueChange={([v]) => setHeightCm(v)}
                  min={120}
                  max={220}
                  step={1}
                  className="py-1"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>120 cm</span>
                  <span>220 cm</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <Label className="text-base font-semibold">Weight</Label>
                  <span className="tabular-nums text-lg font-bold text-primary">{weightKg.toFixed(1)} kg</span>
                </div>
                <Slider
                  value={[weightKg]}
                  onValueChange={([v]) => setWeightKg(v)}
                  min={35}
                  max={160}
                  step={0.5}
                  className="py-1"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>35 kg</span>
                  <span>160 kg</span>
                </div>
              </div>
              <div className="lg:col-span-2">
                <Label className="mb-3 block text-base font-semibold">Gender</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={cn(
                        'rounded-xl border-2 px-3 py-3 text-center text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                        gender === g
                          ? 'border-primary bg-gradient-to-b from-primary/15 to-primary/5 text-primary shadow-md ring-2 ring-primary/25'
                          : 'border-border/80 bg-background/80 hover:border-primary/45 hover:shadow-sm'
                      )}
                    >
                      {g === 'MEN' && 'Men'}
                      {g === 'WOMEN' && 'Women'}
                      {g === 'KIDS' && 'Kids'}
                      {g === 'UNISEX' && 'Unisex'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </MeasureSection>

          <MeasureSection
            sectionIndex={1}
            title="Silhouette"
            subtitle="Pick the outline closest to yours — we blend it with vitals for proportion estimates."
            icon={ScanLine}
            accent="intelligence"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
              {BODY_SHAPES.map(({ value, label, hint }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBodyShape(value)}
                  className={cn(
                    'group flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-all duration-300',
                    bodyShape === value
                      ? 'border-primary bg-gradient-to-b from-primary/12 to-transparent shadow-lg ring-2 ring-primary/30'
                      : 'border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-background/80 hover:shadow-md',
                  )}
                >
                  <span
                    className={cn(
                      'rounded-2xl p-2 transition-transform duration-300',
                      bodyShape === value ? 'scale-105' : 'group-hover:scale-[1.03]',
                    )}
                  >
                    <Silhouette type={value} />
                  </span>
                  <span className="mt-2 font-bold">{label}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </button>
              ))}
            </div>
          </MeasureSection>

          {mode === 'detailed' && (
            <MeasureSection
              sectionIndex={2}
              title="Tape station"
              subtitle="Override any value — or sync from vitals with one tap. Numbers power detailed fit on product pages."
              icon={Ruler}
            >
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground sm:max-w-md">
                  Chest, shoulder, waist &amp; garment length in centimetres.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyEstimates}
                  className="shrink-0 gap-2 rounded-xl border-primary/30 shadow-sm transition-all hover:border-primary hover:bg-primary/5"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Sync from vitals
                </Button>
              </div>
              <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(
                    [
                      ['Chest', chestCm, setChestCm, 'chest'],
                      ['Shoulder', shoulderCm, setShoulderCm, 'shoulder'],
                      ['Waist', waistCm, setWaistCm, 'waist'],
                      ['Length', lengthCm, setLengthCm, 'length'],
                    ] as const
                  ).map(([label, val, setVal, key]) => (
                    <div key={key} className="group space-y-2">
                      <Label htmlFor={`m-${key}`} className="text-sm font-semibold">
                        {label}
                      </Label>
                      <div className="relative">
                        <input
                          id={`m-${key}`}
                          type="number"
                          min={30}
                          max={200}
                          step={0.5}
                          value={val}
                          onChange={(e) => setVal(Number(e.target.value) || 0)}
                          className="h-12 w-full rounded-xl border-2 border-input bg-background pr-12 text-center font-mono text-lg font-semibold tabular-nums outline-none transition-all duration-200 focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.2)] focus-visible:ring-0"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          cm
                        </span>
                        <span
                          className="pointer-events-none absolute -inset-px -z-10 rounded-xl bg-gradient-to-br from-primary/0 to-primary/10 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
                          aria-hidden
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <MeasurementGuide />
              </div>
            </MeasureSection>
          )}

          <MeasureSection
            sectionIndex={mode === 'detailed' ? 3 : 2}
            title="Wardrobe baseline"
            subtitle="What you usually buy — we compare PDP sizes to these on Check fit."
            icon={Shirt}
          >
            <p className="mb-6 text-sm text-muted-foreground">
              On <strong className="font-medium text-foreground">Check fit</strong>, we compare the size you select on
              the product to these. For tops (shirts, hoodies, tees), a smaller letter than your usual reads{' '}
              <strong className="font-medium text-foreground">tighter</strong>; a larger letter reads{' '}
              <strong className="font-medium text-foreground">looser</strong>. For pants, we use waist in inches.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 sm:col-span-2">
                <Label className="text-sm font-semibold">Usual shirt / top size</Label>
                <p className="text-xs text-muted-foreground">
                  Tap the size you most often buy (XS, S, M, L, XL, XXL, …).
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setUsualShirtSize('')}
                    className={cn(
                      'min-h-10 min-w-[3.25rem] rounded-lg border-2 px-3 text-sm font-bold transition-all',
                      !usualShirtSize.trim()
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/35'
                    )}
                  >
                    —
                  </button>
                  {USUAL_TOP_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setUsualShirtSize(sz)}
                      className={cn(
                        'min-h-10 min-w-[2.75rem] rounded-lg border-2 px-2.5 text-sm font-bold tabular-nums transition-all sm:min-w-[3rem]',
                        usualShirtSize.trim().toUpperCase() === sz
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                          : 'border-border bg-background hover:border-primary/35'
                      )}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="usual-pant" className="text-sm font-semibold">
                  Usual pant waist (inches)
                </Label>
                <Input
                  id="usual-pant"
                  inputMode="numeric"
                  placeholder="e.g. 34"
                  value={usualPantWaist}
                  onChange={(e) => setUsualPantWaist(e.target.value.replace(/[^\d]/g, ''))}
                  maxLength={2}
                  className="h-11 tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usual-shoe" className="text-sm font-semibold">
                  Usual shoe size
                </Label>
                <Input
                  id="usual-shoe"
                  placeholder="e.g. UK 8, EU 42"
                  value={usualShoeSize}
                  onChange={(e) => setUsualShoeSize(e.target.value)}
                  maxLength={32}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saree-style" className="text-sm font-semibold">
                  Saree / drape preference
                </Label>
                <Input
                  id="saree-style"
                  placeholder="e.g. Traditional, pre-draped"
                  value={sareeStyle}
                  onChange={(e) => setSareeStyle(e.target.value)}
                  maxLength={64}
                  className="h-11"
                />
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-border/80 bg-muted/30 px-4 py-3">
              <Checkbox
                id="prefers-free-size"
                checked={prefersFreeSize}
                onCheckedChange={(v) => setPrefersFreeSize(v === true)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="prefers-free-size" className="cursor-pointer text-sm font-semibold leading-none">
                  I often buy free-size items
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  We&apos;ll mention this when a product is tagged or named as free size.
                </p>
              </div>
            </div>
          </MeasureSection>

          <MeasureSection
            sectionIndex={mode === 'detailed' ? 4 : 3}
            title="Fit feel"
            subtitle="How you like garments to sit — we fold this into fit language on products."
            icon={Sparkles}
            accent="intelligence"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FIT_PREFS.map(({ value, label, sub }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFitPreference(value)}
                  className={cn(
                    'rounded-2xl border-2 px-4 py-4 text-left transition-all duration-200 hover:shadow-md',
                    fitPreference === value
                      ? 'border-primary bg-gradient-to-br from-primary/12 to-transparent shadow-md ring-2 ring-primary/25'
                      : 'border-border/70 bg-muted/15 hover:border-primary/45',
                  )}
                >
                  <span className="block font-bold">{label}</span>
                  <span className="text-sm text-muted-foreground">{sub}</span>
                </button>
              ))}
            </div>
            <div className="mt-8 hidden items-center gap-4 rounded-2xl border border-border/50 bg-gradient-to-r from-muted/40 via-muted/20 to-transparent px-5 py-4 sm:flex">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Spectrum</span>
              <span className={cn('text-sm', fitPreference === 'SLIM' ? 'font-bold text-primary' : 'text-muted-foreground')}>
                Tight
              </span>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-border/80 shadow-inner">
                <div
                  className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-lg transition-all duration-500 ease-out"
                  style={{
                    left:
                      fitPreference === 'SLIM' ? '0%' : fitPreference === 'REGULAR' ? '50%' : '100%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>
              <span className={cn('text-sm', fitPreference === 'LOOSE' ? 'font-bold text-primary' : 'text-muted-foreground')}>
                Loose
              </span>
            </div>
          </MeasureSection>

          {mode === 'quick' && (
            <div
              className="animate-in fade-in-0 zoom-in-95 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/[0.06] to-transparent px-5 py-5 text-center sm:flex-row sm:justify-between sm:text-left"
              style={{ animationFillMode: 'both' }}
            >
              <p className="max-w-xl text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Quick mode</span> keeps chest, waist &amp; proportions
                estimated from vitals. Open{' '}
                <button
                  type="button"
                  className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
                  onClick={() => setMode('detailed')}
                >
                  Tape measurements
                </button>{' '}
                for the full studio.
              </p>
              <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-xl border-primary/30" onClick={() => setMode('detailed')}>
                <Ruler className="mr-2 h-4 w-4" />
                Open tape mode
              </Button>
            </div>
          )}
        </div>

        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/90 p-4 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-background/75 md:static md:z-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
          <div className="mx-auto flex w-full max-w-[1600px] justify-end px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 md:px-0">
            <Button
              size="lg"
              className="w-full gap-2 bg-gradient-to-r from-primary to-rose-600 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 sm:w-auto sm:min-w-[220px]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Save profile
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
