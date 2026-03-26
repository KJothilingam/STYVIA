import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shirt, RefreshCw, Check, Wrench, Gift, Package, Smartphone } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useStore } from '@/context/StoreContext';
import wardrobeService, { WardrobeItemDTO, LifecycleState } from '@/services/wardrobeService';
import localWardrobeService, { mergeWardrobeLists } from '@/services/localWardrobeService';
import SafeProductImage from '@/components/SafeProductImage';
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

function rowQuantity(item: WardrobeItemDTO): number {
  const q = item.quantity;
  return q != null && q > 0 ? q : 1;
}

const Wardrobe = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [items, setItems] = useState<WardrobeItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<WardrobeItemDTO | null>(null);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const uid = user?.id;
    wardrobeService
      .getWardrobe()
      .then((remote) => {
        const local = uid ? localWardrobeService.listAsDtos(uid) : [];
        setItems(mergeWardrobeLists(remote, local));
      })
      .catch(() => {
        const local = uid ? localWardrobeService.listAsDtos(uid) : [];
        setItems(local);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const openPanel = (item: WardrobeItemDTO) => {
    setActiveItem(item);
    setPanelOpen(true);
  };

  const handleSync = () => {
    const prevRemote = items.filter((i) => !i.localOnly).length;
    const uid = user?.id;
    setSyncing(true);
    wardrobeService
      .syncFromOrders()
      .then((list) => {
        const local = uid ? localWardrobeService.listAsDtos(uid) : [];
        setItems(mergeWardrobeLists(list, local));
        const added = Math.max(0, list.length - prevRemote);
        if (added > 0) {
          toast({
            title: 'Imported from orders',
            description: `Added ${added} new row${added === 1 ? '' : 's'} from your order history.`,
          });
        } else {
          toast({
            title: 'Already up to date',
            description: 'Every order line is already linked, or there are no orders to import.',
          });
        }
      })
      .catch(() => toast({ title: 'Sync failed', variant: 'destructive' }))
      .finally(() => setSyncing(false));
  };

  const handleWorn = (item: WardrobeItemDTO) => {
    const uid = user?.id;
    if (item.localOnly && uid) {
      localWardrobeService.logWorn(uid, item.id);
      load();
      toast({ title: 'Logged as worn today!' });
      return;
    }
    wardrobeService
      .logWorn(item.id)
      .then(() => {
        load();
        toast({ title: 'Logged as worn today!' });
      })
      .catch(() => toast({ title: 'Failed to log', variant: 'destructive' }));
  };

  const handleRepair = (item: WardrobeItemDTO) => {
    const uid = user?.id;
    if (item.localOnly && uid) {
      localWardrobeService.logRepair(uid, item.id);
      load();
      toast({ title: 'Marked as needs repair.' });
      return;
    }
    wardrobeService
      .logRepair(item.id)
      .then(() => {
        load();
        toast({ title: 'Marked as needs repair.' });
      })
      .catch(() => toast({ title: 'Failed', variant: 'destructive' }));
  };

  const handleDonate = (item: WardrobeItemDTO) => {
    const uid = user?.id;
    if (item.localOnly && uid) {
      localWardrobeService.logDonate(uid, item.id);
      load();
      toast({ title: 'Marked for donate.' });
      return;
    }
    wardrobeService
      .logDonate(item.id)
      .then(() => {
        load();
        toast({ title: 'Marked for donate.' });
      })
      .catch(() => toast({ title: 'Failed', variant: 'destructive' }));
  };

  const handleDonated = (item: WardrobeItemDTO) => {
    const uid = user?.id;
    if (item.localOnly && uid) {
      localWardrobeService.logDonated(uid, item.id);
      load();
      setPanelOpen(false);
      toast({ title: 'Logged as donated.' });
      return;
    }
    wardrobeService
      .logEvent(item.id, 'DONATED')
      .then(() => {
        load();
        setPanelOpen(false);
        toast({ title: 'Logged as donated.' });
      })
      .catch(() => toast({ title: 'Failed', variant: 'destructive' }));
  };

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
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--intelligence-mid))]">
                Your closet
              </p>
              <h1 className="font-display-hero text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
                My wardrobe
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                When you <strong className="text-foreground font-medium">place an order</strong>, those lines are saved to
                your account automatically. You can also add pieces manually from any product page. Browse/demo URLs (like{' '}
                <code className="text-xs bg-muted px-1 rounded">/product/m5</code>) are kept{' '}
                <strong className="text-foreground font-medium">on this device</strong> until you open the same style from
                Shop with a numeric id — then it syncs to the server like your cart-backed orders.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button variant="default" className="rounded-full" asChild>
                <Link to="/products">
                  <Shirt className="w-4 h-4 mr-2" />
                  Browse &amp; add pieces
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-[hsl(var(--intelligence-mid)/0.25)] hover:bg-[hsl(262_58%_22%/0.06)]"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', syncing && 'animate-spin')} />
                Import missing order lines
              </Button>
            </div>
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
              <h2 className="font-display-hero text-2xl font-semibold mb-2">Nothing here yet</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                After your next checkout, items will appear automatically. You can also add pieces from any product page,
                or run <strong className="text-foreground font-medium">Import missing order lines</strong> if you had
                orders before this feature.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <Button size="lg" className="rounded-full px-8" asChild>
                  <Link to="/products">
                    <Shirt className="w-4 h-4 mr-2" />
                    Browse products
                  </Link>
                </Button>
                <Button
                  onClick={handleSync}
                  disabled={syncing}
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 border-[hsl(var(--intelligence-mid)/0.3)]"
                >
                  <RefreshCw className={cn('w-4 h-4 mr-2', syncing && 'animate-spin')} />
                  Import from orders
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {items.map((item) => {
                const q = rowQuantity(item);
                return (
                  <button
                    key={item.localOnly ? `local-${item.id}` : `api-${item.id}`}
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
                        <SafeProductImage
                          urls={[item.imageUrl]}
                          alt=""
                          className="absolute inset-0"
                          classNameImg="transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Shirt className="w-14 h-14 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                      {item.localOnly ? (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 text-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 shadow-md">
                          <Smartphone className="w-3 h-3" aria-hidden />
                          Device
                        </span>
                      ) : (
                        item.fromOrder && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 text-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 shadow-md">
                            <Package className="w-3 h-3" aria-hidden />
                            Order
                          </span>
                        )
                      )}
                      {q > 1 && (
                        <span className="absolute top-3 right-3 rounded-full bg-black/70 text-white text-xs font-semibold tabular-nums px-2 py-0.5">
                          ×{q}
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
                            {formatLastWorn(item.lastWornAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-between bg-card/95 backdrop-blur-sm border-t border-border/30">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate pr-2">
                        {item.size} · {item.color}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l border-border/60 bg-card p-0 gap-0">
          {activeItem && (
            <>
              <SheetDescription className="sr-only">
                Details for {activeItem.productName}.
              </SheetDescription>
              <div className="relative aspect-[5/4] bg-muted shrink-0">
                {activeItem.imageUrl ? (
                  <SafeProductImage urls={[activeItem.imageUrl]} alt="" className="absolute inset-0" />
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
                  <SheetDescription className="text-sm text-muted-foreground space-y-1">
                    <p>
                      {activeItem.size} · {activeItem.color} · Qty {rowQuantity(activeItem)}
                    </p>
                    <p>{LIFECYCLE_LABELS[activeItem.lifecycleState]}</p>
                    {activeItem.localOnly && (
                      <p className="text-xs">Stored on this browser only (demo / non-catalog product URL).</p>
                    )}
                    {!activeItem.localOnly && activeItem.fromOrder && (
                      <p className="text-xs">Linked to a purchase on this store.</p>
                    )}
                  </SheetDescription>
                </SheetHeader>

                {activeItem.recommendation && (
                  <p className="text-sm text-muted-foreground leading-relaxed border border-border/60 rounded-xl px-4 py-3 bg-muted/30">
                    {activeItem.recommendation}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="default" className="rounded-full" onClick={() => handleWorn(activeItem)}>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Worn today
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleRepair(activeItem)}>
                    <Wrench className="w-3.5 h-3.5 mr-1.5" />
                    Needs repair
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleDonate(activeItem)}>
                    <Gift className="w-3.5 h-3.5 mr-1.5" />
                    Suggest donate
                  </Button>
                  <Button size="sm" variant="secondary" className="rounded-full" onClick={() => handleDonated(activeItem)}>
                    I donated
                  </Button>
                  {!activeItem.localOnly && (
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
                  )}
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
