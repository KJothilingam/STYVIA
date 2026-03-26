import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Ruler,
  Save,
  Sparkles,
  UserRound,
  Zap,
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
    <svg viewBox="0 0 64 88" className="h-16 w-12 text-foreground/80" aria-hidden>
      <ellipse cx="32" cy="14" rx={thin ? 10 : wide ? 14 : 12} ry="11" fill="currentColor" opacity="0.2" />
      <path
        d={`M ${32 - w / 2} 26 Q 32 22 ${32 + w / 2} 26 L ${32 + w / 2 + 4} 52 Q 32 58 ${32 - w / 2 - 4} 52 Z`}
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d={`M ${32 - w / 3} 52 L ${32 - w / 4} 84 M ${32 + w / 3} 52 L ${32 + w / 4} 84`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
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
        <div className="mx-auto flex min-h-[40vh] w-full max-w-[1600px] items-center justify-center px-4 sm:px-6 lg:px-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-8 pb-24 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <nav className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link to="/profile" className="inline-flex items-center gap-1 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Account
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground font-medium">Body profile</span>
        </nav>

        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-intelligence-mid/30 bg-intelligence-deep/[0.06] px-3 py-1 text-xs font-bold uppercase tracking-widest text-intelligence-mid">
              <Sparkles className="h-3.5 w-3.5" />
              Body intelligence
            </div>
            <h1 className="font-display-hero text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Your measurements
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
              Structured sections — about 30 seconds. Used for fit recommendations across the shop.
            </p>
          </div>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => {
              if (v === 'quick' || v === 'detailed') setMode(v);
            }}
            className="inline-flex w-full shrink-0 justify-stretch rounded-lg border bg-muted/50 p-1 sm:max-w-[320px] lg:w-auto lg:max-w-none"
          >
            <ToggleGroupItem
              value="quick"
              className={cn(
                'min-h-10 flex-1 gap-1.5 px-3 font-semibold',
                'text-foreground data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground',
                'data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm',
                'data-[state=on]:[&_svg]:text-primary'
              )}
            >
              <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Quick
            </ToggleGroupItem>
            <ToggleGroupItem
              value="detailed"
              className={cn(
                'min-h-10 flex-1 gap-1.5 px-3 font-semibold',
                'text-foreground data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground',
                'data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm',
                'data-[state=on]:[&_svg]:text-primary'
              )}
            >
              <Ruler className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Detailed
            </ToggleGroupItem>
          </ToggleGroup>
        </header>

        <div className="space-y-8">
          {/* 1. Basic info */}
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold tracking-tight">Basic info</h2>
            </div>
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
                        'rounded-xl border-2 px-3 py-3 text-center text-sm font-bold transition-all',
                        gender === g
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                          : 'border-border bg-background hover:border-primary/40'
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
          </section>

          {/* 2. Body type */}
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7">
            <h2 className="mb-1 text-lg font-bold tracking-tight">Body type</h2>
            <p className="mb-5 text-sm text-muted-foreground">Tap the shape that matches you best.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
              {BODY_SHAPES.map(({ value, label, hint }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBodyShape(value)}
                  className={cn(
                    'flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-all',
                    bodyShape === value
                      ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/25'
                      : 'border-border bg-background hover:border-primary/35'
                  )}
                >
                  <Silhouette type={value} />
                  <span className="mt-2 font-bold">{label}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 3. Measurements (detailed only) */}
          {mode === 'detailed' && (
            <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Measurements</h2>
                  <p className="text-sm text-muted-foreground">
                    Optional overrides — we estimate from height &amp; weight; edit any value anytime.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={applyEstimates} className="shrink-0">
                  Fill from height &amp; weight
                </Button>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(
                    [
                      ['Chest', chestCm, setChestCm, 'chest'],
                      ['Shoulder', shoulderCm, setShoulderCm, 'shoulder'],
                      ['Waist', waistCm, setWaistCm, 'waist'],
                      ['Length', lengthCm, setLengthCm, 'length'],
                    ] as const
                  ).map(([label, val, setVal, key]) => (
                    <div key={key} className="space-y-2">
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
                          className="h-12 w-full rounded-lg border-2 border-input bg-background pr-12 text-center text-lg font-semibold tabular-nums outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          cm
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <MeasurementGuide />
              </div>
            </section>
          )}

          {/* Usual sizes (for fit check vs selected size on PDP) */}
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7">
            <h2 className="mb-1 text-lg font-bold tracking-tight">Sizes you usually buy</h2>
            <p className="mb-5 text-sm text-muted-foreground">
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
          </section>

          {/* 4. Fit preference */}
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7">
            <h2 className="mb-1 text-lg font-bold tracking-tight">Fit preference</h2>
            <p className="mb-5 text-sm text-muted-foreground">How you like clothes to feel.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FIT_PREFS.map(({ value, label, sub }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFitPreference(value)}
                  className={cn(
                    'rounded-xl border-2 px-4 py-4 text-left transition-all',
                    fitPreference === value
                      ? 'border-primary bg-primary/8 shadow-sm ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <span className="block font-bold">{label}</span>
                  <span className="text-sm text-muted-foreground">{sub}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 hidden items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 sm:flex">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Scale</span>
              <span className={cn('text-sm', fitPreference === 'SLIM' ? 'font-bold text-primary' : 'text-muted-foreground')}>
                Tight
              </span>
              <div className="relative h-2 flex-1 rounded-full bg-border">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-md transition-[left] duration-200"
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
          </section>

          {mode === 'quick' && (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-center text-sm text-muted-foreground">
              Quick mode uses smart estimates for chest, waist, and proportions. Switch to{' '}
              <button type="button" className="font-semibold text-primary underline" onClick={() => setMode('detailed')}>
                Detailed
              </button>{' '}
              to enter tape measurements.
            </p>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:z-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto flex w-full max-w-[1600px] justify-end px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 md:px-0">
            <Button size="lg" className="w-full gap-2 sm:w-auto min-w-[200px]" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Save profile
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
