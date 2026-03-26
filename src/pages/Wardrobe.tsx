import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shirt,
  RefreshCw,
  Check,
  Wrench,
  Gift,
  TrendingDown,
  Flame,
  Sparkles,
  CalendarDays,
  Hourglass,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import wardrobeService, { WardrobeItemDTO, LifecycleState } from '@/services/wardrobeService';
import lifecycleService, { LifecycleItemInsight } from '@/services/lifecycleService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const LIFECYCLE_LABELS: Record<LifecycleState, string> = {
  NEW: 'New',
  FREQUENTLY_USED: 'Frequently used',
  RARELY_USED: 'Rarely used',
  REPAIR_NEEDED: 'Needs repair',
  DONATE_RECOMMENDED: 'Donate suggested',
  DONATED: 'Donated',
};

function formatLastWorn(iso: string | null): string {
  if (!iso) return 'Never worn';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wk ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isLowUsage(item: WardrobeItemDTO, insight: LifecycleItemInsight | undefined): boolean {
  if (item.lifecycleState === 'RARELY_USED' || item.lifecycleState === 'DONATE_RECOMMENDED') return true;
  if (!insight) return item.wearCount < 2;
  if (insight.wearFrequencyLabel === 'NONE' || insight.wearFrequencyLabel === 'LOW') return true;
  if (insight.wearCount < 3 && insight.monthsOwned >= 4) return true;
  return false;
}

function isHighUsage(insight: LifecycleItemInsight | undefined, item: WardrobeItemDTO): boolean {
  if (item.wearCount >= 12) return true;
  return insight?.wearFrequencyLabel === 'HIGH';
}

const Wardrobe = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<WardrobeItemDTO[]>([]);
  const [insights, setInsights] = useState<LifecycleItemInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<WardrobeItemDTO | null>(null);
  const { toast } = useToast();

  const insightMap = useMemo(() => {
    const m = new Map<number, LifecycleItemInsight>();
    insights.forEach((i) => m.set(i.wardrobeItemId, i));
    return m;
  }, [insights]);

  const load = useCallback(() => {
    setLoading(true);
    wardrobeService
      .getWardrobe()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const loadInsights = useCallback(() => {
    lifecycleService.getInsights().then((d) => setInsights(d.items)).catch(() => setInsights([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadInsights();
  }, [items.length, loadInsights]);

  const activeInsight = activeItem ? insightMap.get(activeItem.id) : undefined;

  const openPanel = (item: WardrobeItemDTO) => {
    setActiveItem(item);
    setPanelOpen(true);
  };

  const handleSync = () => {
    setSyncing(true);
    wardrobeService
      .syncFromOrders()
      .then((list) => {
        setItems(list);
        toast({ title: 'Wardrobe synced from delivered orders.' });
      })
      .catch(() => toast({ title: 'Sync failed', variant: 'destructive' }))
      .finally(() => setSyncing(false));
  };

  const handleWorn = (id: number) => {
    wardrobeService.logWorn(id).then(() => {
      load();
      loadInsights();
      toast({ title: 'Logged as worn today!' });
    }).catch(() => toast({ title: 'Failed to log', variant: 'destructive' }));
  };

  const handleRepair = (id: number) => {
    wardrobeService.logRepair(id).then(() => {
      load();
      loadInsights();
      toast({ title: 'Marked as needs repair.' });
    }).catch(() => toast({ title: 'Failed', variant: 'destructive' }));
  };

  const handleDonate = (id: number) => {
    wardrobeService.logDonate(id).then(() => {
      load();
      loadInsights();
      toast({ title: 'Marked for donate.' });
    }).catch(() => toast({ title: 'Failed', variant: 'destructive' }));
  };

  const handleDonated = (id: number) => {
    wardrobeService.logEvent(id, 'DONATED').then(() => {
      load();
      loadInsights();
      setPanelOpen(false);
      toast({ title: 'Logged as donated.' });
    }).catch(() => toast({ title: 'Failed', variant: 'destructive' }));
  };

  const attentionCount = useMemo(() => {
    return items.filter((item) => {
      const ins = insightMap.get(item.id);
      const low = isLowUsage(item, ins);
      const drift = ins && ins.simulatedFitNow < ins.baselineFitConfidence - 4;
      return low || drift;
    }).length;
  }, [items, insightMap]);

  return (
    <Layout>
      <div className="min-h-[60vh] bg-gradient-to-b from-[hsl(262_58%_22%/0.07)] via-background to-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <nav className="text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-foreground">Wardrobe</span>
          </nav>

          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
            <div className="space-y-3 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--intelligence-mid))]">
                Your closet
              </p>
              <h1 className="font-display-hero text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
                Pieces you own,{' '}
                <span className="text-[hsl(var(--intelligence-accent))]">understood.</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Tap any item for wear history and simulated fit drift — the story behind each garment.
              </p>
              {items.length > 0 && attentionCount > 0 && (
                <p className="inline-flex items-center gap-2 text-sm text-[hsl(var(--intelligence-mid))]">
                  <Sparkles className="w-4 h-4 shrink-0 text-[hsl(var(--intelligence-accent))]" />
                  <span>
                    {attentionCount} piece{attentionCount === 1 ? '' : 's'} could use a look — open insights for details.
                  </span>
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="shrink-0 border-[hsl(var(--intelligence-mid)/0.25)] hover:bg-[hsl(262_58%_22%/0.06)]"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', syncing && 'animate-spin')} />
              Sync from orders
            </Button>
          </header>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden bg-muted/50 animate-pulse aspect-[4/5]"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 bg-card/50 px-8 py-16 text-center max-w-lg mx-auto">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(262_58%_22%/0.08)] mb-6">
                <Shirt className="w-8 h-8 text-[hsl(var(--intelligence-mid))]" />
              </div>
              <h2 className="font-display-hero text-2xl font-semibold mb-2">Start your wardrobe</h2>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                Deliver an order, then sync — we&apos;ll track wears, last worn, and how fit may evolve over time.
              </p>
              <Button onClick={handleSync} disabled={syncing} size="lg" className="rounded-full px-8">
                <RefreshCw className={cn('w-4 h-4 mr-2', syncing && 'animate-spin')} />
                Sync from orders
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {items.map((item) => {
                const ins = insightMap.get(item.id);
                const low = isLowUsage(item, ins);
                const hot = isHighUsage(ins, item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openPanel(item)}
                    className={cn(
                      'group relative text-left rounded-2xl overflow-hidden bg-card',
                      'shadow-sm hover:shadow-xl transition-all duration-500 ease-out',
                      'ring-1 ring-border/40 hover:ring-2 hover:ring-[hsl(var(--intelligence-accent)/0.45)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    )}
                  >
                    <div className="aspect-[4/5] relative bg-gradient-to-b from-muted/30 to-muted/80">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Shirt className="w-14 h-14 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                      {low && (
                        <span className="absolute top-3 left-3 rounded-full bg-amber-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 shadow-lg">
                          Low use
                        </span>
                      )}
                      {hot && !low && (
                        <span className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/95 text-white shadow-lg">
                          <Flame className="w-4 h-4" aria-hidden />
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-3.5 pt-12 text-white">
                        <p className="font-display-hero text-[15px] md:text-base font-semibold leading-snug line-clamp-2 mb-2">
                          {item.productName}
                        </p>
                        <div className="flex items-baseline justify-between gap-2 border-t border-white/20 pt-2.5 mt-1">
                          <span className="text-sm font-semibold tabular-nums">
                            Worn {item.wearCount}×
                          </span>
                          <span className="text-[11px] md:text-xs text-white/75 flex items-center gap-1 shrink-0">
                            <CalendarDays className="w-3 h-3 opacity-80" aria-hidden />
                            {formatLastWorn(item.lastWornAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-between bg-card/95 backdrop-blur-sm border-t border-border/30">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate pr-2">
                        {item.size} · {item.color}
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--intelligence-accent))] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l border-[hsl(var(--intelligence-mid)/0.15)] bg-gradient-to-b from-card to-[hsl(262_58%_22%/0.04)] p-0 gap-0">
          {activeItem && (
            <>
              <SheetDescription className="sr-only">
                Wear history and fit insights for {activeItem.productName}.
              </SheetDescription>
              <div className="relative aspect-[5/4] bg-muted shrink-0">
                {activeItem.imageUrl ? (
                  <img
                    src={activeItem.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Shirt className="w-20 h-20 text-muted-foreground/35" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              </div>

              <div className="px-6 pb-8 pt-2 space-y-6">
                <SheetHeader className="space-y-1 text-left pr-8">
                  <SheetTitle className="font-display-hero text-2xl font-semibold leading-tight">
                    {activeItem.productName}
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">
                    {activeItem.size} · {activeItem.color} · {LIFECYCLE_LABELS[activeItem.lifecycleState]}
                  </SheetDescription>
                </SheetHeader>

                <section
                  aria-label="Insights"
                  className="rounded-2xl border border-[hsl(var(--intelligence-accent)/0.25)] bg-gradient-to-br from-[hsl(187_70%_42%/0.08)] via-card to-[hsl(262_58%_22%/0.06)] p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--intelligence-deep))] text-primary-foreground">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[hsl(var(--intelligence-deep))]">
                      Insights
                    </h2>
                  </div>

                  <ul className="space-y-4">
                    <li className="flex gap-4 items-start">
                      <div className="rounded-xl bg-background/80 px-4 py-3 border border-border/60 min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Usage</p>
                        <p className="font-display-hero text-2xl font-semibold tabular-nums">
                          Worn {activeItem.wearCount} {activeItem.wearCount === 1 ? 'time' : 'times'}
                        </p>
                      </div>
                    </li>

                    {isLowUsage(activeItem, activeInsight) && (
                      <li className="flex gap-3 items-center rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400">
                          <Hourglass className="w-5 h-5" />
                        </span>
                        <div>
                          <p className="font-semibold text-amber-900 dark:text-amber-200">Low usage item</p>
                          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                            This piece isn&apos;t getting much wear — worth re-styling or checking fit.
                          </p>
                        </div>
                      </li>
                    )}

                    {activeInsight && activeInsight.simulatedFitNow < activeInsight.baselineFitConfidence && (
                      <li className="flex gap-3 items-center rounded-xl bg-rose-500/8 border border-rose-500/20 px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                          <TrendingDown className="w-5 h-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-rose-900 dark:text-rose-100">
                            Fit decreased to {activeInsight.simulatedFitNow}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            From {activeInsight.baselineFitConfidence}% at purchase (simulated stretch, wash & wear).
                          </p>
                          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
                            <div
                              className="h-full bg-[hsl(var(--intelligence-accent))] transition-all duration-500"
                              style={{ width: `${activeInsight.simulatedFitNow}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide">
                            <span>Then {activeInsight.baselineFitConfidence}%</span>
                            <span>Est. now</span>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>

                  {activeInsight?.narrative && (
                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground border-t border-border/50 pt-4">
                      {activeInsight.narrative}
                    </p>
                  )}
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="default" className="rounded-full" onClick={() => handleWorn(activeItem.id)}>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Worn today
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleRepair(activeItem.id)}>
                    <Wrench className="w-3.5 h-3.5 mr-1.5" />
                    Needs repair
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleDonate(activeItem.id)}>
                    <Gift className="w-3.5 h-3.5 mr-1.5" />
                    Suggest donate
                  </Button>
                  <Button size="sm" variant="secondary" className="rounded-full" onClick={() => handleDonated(activeItem.id)}>
                    I donated
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-emerald-600/40 text-emerald-800 dark:text-emerald-300"
                    onClick={() => {
                      navigate('/donations', {
                        state: {
                          wardrobeItemId: activeItem.id,
                          productSummary: activeItem.productName,
                          size: activeItem.size,
                        },
                      });
                      setPanelOpen(false);
                    }}
                  >
                    Schedule donation pickup
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default Wardrobe;
