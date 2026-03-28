import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shirt, RefreshCw, Check, Wrench, Package, Smartphone } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useStore } from '@/context/StoreContext';
import wardrobeService, { WardrobeItemDTO, LifecycleState } from '@/services/wardrobeService';
import localWardrobeService, { mergeWardrobeLists } from '@/services/localWardrobeService';
import donationService from '@/services/donationService';
import type { DonationPickupDTO } from '@/services/donationService';
import SafeProductImage from '@/components/SafeProductImage';
import { useToast } from '@/hooks/use-toast';
import { cn, getApiErrorMessage } from '@/lib/utils';
import { getWardrobeDisplayImageUrls } from '@/lib/localListingImages';
import { dedupeWardrobeByOutfit, excludeOutfitsAnyDonated } from '@/lib/wardrobeDedupe';

const LIFECYCLE_LABELS: Record<LifecycleState, string> = {
  NEW: 'New',
  FREQUENTLY_USED: 'Frequently used',
  RARELY_USED: 'Rarely used',
  REPAIR_NEEDED: 'Needs wash',
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

function filterVisibleWardrobe(items: WardrobeItemDTO[]): WardrobeItemDTO[] {
  return items.filter((i) => String(i.lifecycleState ?? '').toUpperCase() !== 'DONATED');
}

const ACTIVE_DONATION_PICKUP_STATUSES = new Set([
  'PENDING',
  'REQ_ACCEPTED',
  'EXPECTED_PICK_DATE',
]);

function activePickupForWardrobeItem(
  pickups: DonationPickupDTO[],
  wardrobeItemId: number
): DonationPickupDTO | undefined {
  return pickups.find(
    (p) =>
      p.wardrobeItemId != null &&
      Number(p.wardrobeItemId) === Number(wardrobeItemId) &&
      ACTIVE_DONATION_PICKUP_STATUSES.has(p.status)
  );
}

function buildWardrobeGridList(remote: WardrobeItemDTO[], local: WardrobeItemDTO[]): WardrobeItemDTO[] {
  const merged = mergeWardrobeLists(remote, local);
  const withoutDonatedSlots = excludeOutfitsAnyDonated(merged);
  return filterVisibleWardrobe(dedupeWardrobeByOutfit(withoutDonatedSlots));
}

const Wardrobe = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [items, setItems] = useState<WardrobeItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<WardrobeItemDTO | null>(null);
  const [donatedDialogOpen, setDonatedDialogOpen] = useState(false);
  const [userPickups, setUserPickups] = useState<DonationPickupDTO[]>([]);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const uid = user?.id;
    wardrobeService
      .getWardrobe()
      .then((remote) => {
        const local = uid ? localWardrobeService.listAsDtos(uid) : [];
        setItems(buildWardrobeGridList(remote, local));
      })
      .catch(() => {
        const local = uid ? localWardrobeService.listAsDtos(uid) : [];
        setItems(buildWardrobeGridList([], local));
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!panelOpen || !user?.id || activeItem?.localOnly) {
      setUserPickups([]);
      return;
    }
    let cancelled = false;
    donationService
      .listPickups()
      .then((list) => {
        if (!cancelled) setUserPickups(list);
      })
      .catch(() => {
        if (!cancelled) setUserPickups([]);
      });
    return () => {
      cancelled = true;
    };
  }, [panelOpen, user?.id, activeItem?.id, activeItem?.localOnly]);

  const openPanel = (item: WardrobeItemDTO) => {
    setActiveItem(item);
    setPanelOpen(true);
  };

  const onSheetOpenChange = (open: boolean) => {
    setPanelOpen(open);
    if (!open) setDonatedDialogOpen(false);
  };

  const handleSync = () => {
    const prevVisibleNonLocal = items.filter((i) => !i.localOnly).length;
    const uid = user?.id;
    setSyncing(true);
    wardrobeService
      .syncFromOrders()
      .then((list) => {
        const local = uid ? localWardrobeService.listAsDtos(uid) : [];
        const next = buildWardrobeGridList(list, local);
        setItems(next);
        const nextVisibleNonLocal = next.filter((i) => !i.localOnly).length;
        const added = Math.max(0, nextVisibleNonLocal - prevVisibleNonLocal);
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

  const sameWardrobeSlot = (a: WardrobeItemDTO, b: WardrobeItemDTO) =>
    a.id === b.id && Boolean(a.localOnly) === Boolean(b.localOnly);

  const handleWorn = (item: WardrobeItemDTO) => {
    const uid = user?.id;
    const bumpWornUi = () => {
      setActiveItem((prev) => {
        if (!prev || !sameWardrobeSlot(prev, item)) return prev;
        const nextWear = (prev.wearCount ?? 0) + 1;
        return {
          ...prev,
          wearCount: nextWear,
          lastWornAt: new Date().toISOString(),
          lifecycleState: nextWear >= 6 ? 'FREQUENTLY_USED' : prev.lifecycleState,
        };
      });
    };
    if (item.localOnly && uid) {
      localWardrobeService.logWorn(uid, item.id);
      bumpWornUi();
      load();
      toast({ title: 'Logged as worn today!' });
      return;
    }
    wardrobeService
      .logWorn(item.id)
      .then(() => {
        bumpWornUi();
        load();
        toast({ title: 'Logged as worn today!' });
      })
      .catch(() => toast({ title: 'Failed to log', variant: 'destructive' }));
  };

  const lifecycleAfterClearRepair = (wearCount: number): LifecycleState =>
    wearCount >= 6 ? 'FREQUENTLY_USED' : 'NEW';

  const handleRepair = (item: WardrobeItemDTO) => {
    const uid = user?.id;
    const bumpRepairUi = () => {
      setActiveItem((prev) =>
        prev && sameWardrobeSlot(prev, item) ? { ...prev, lifecycleState: 'REPAIR_NEEDED' } : prev
      );
    };
    const bumpClearRepairUi = () => {
      setActiveItem((prev) =>
        prev && sameWardrobeSlot(prev, item)
          ? { ...prev, lifecycleState: lifecycleAfterClearRepair(prev.wearCount ?? 0) }
          : prev
      );
    };

    if (item.lifecycleState === 'REPAIR_NEEDED') {
      if (item.localOnly && uid) {
        localWardrobeService.clearRepairNeed(uid, item.id);
        bumpClearRepairUi();
        load();
        toast({ title: 'Dress washed' });
        return;
      }
      wardrobeService
        .clearRepairNeed(item.id)
        .then(() => {
          bumpClearRepairUi();
          load();
          toast({ title: 'Dress washed' });
        })
        .catch(() => toast({ title: 'Failed to update', variant: 'destructive' }));
      return;
    }

    if (item.localOnly && uid) {
      localWardrobeService.logRepair(uid, item.id);
      bumpRepairUi();
      load();
      toast({ title: 'Marked as needs wash.' });
      return;
    }
    wardrobeService
      .logRepair(item.id)
      .then(() => {
        bumpRepairUi();
        load();
        toast({ title: 'Marked as needs wash.' });
      })
      .catch(() => toast({ title: 'Failed', variant: 'destructive' }));
  };

  const panelImageUrls = activeItem
    ? getWardrobeDisplayImageUrls(activeItem.productName, activeItem.imageUrl)
    : [];

  const confirmMarkDonated = () => {
    const item = activeItem;
    if (!item || item.localOnly) {
      setDonatedDialogOpen(false);
      return;
    }
    wardrobeService
      .markDonated(item.id)
      .then(() => {
        setDonatedDialogOpen(false);
        setPanelOpen(false);
        setActiveItem(null);
        load();
        toast({
          title: 'Marked as donated',
          description: 'Hidden from your closet. It will not come back when you import missing order lines.',
        });
      })
      .catch((err) =>
        toast({
          title: 'Could not update wardrobe',
          description: getApiErrorMessage(
            err,
            'If a pickup is scheduled for this item, wait until it is completed. Otherwise try again.'
          ),
          variant: 'destructive',
        })
      );
  };

  const onIDonatedClick = () => {
    if (!activeItem) return;
    if (activeItem.localOnly) {
      toast({
        title: 'Account wardrobe only',
        description:
          '“I donated” is saved on the server for shop orders. This device-only row cannot use that action.',
        variant: 'destructive',
      });
      return;
    }
    const blocking = activePickupForWardrobeItem(userPickups, activeItem.id);
    if (blocking) {
      toast({
        title: 'Pickup already scheduled',
        description:
          'A donation pickup is in progress for this piece. It will leave your wardrobe when that request is marked completed — you do not need to tap “I donated”.',
        variant: 'destructive',
      });
      return;
    }
    setDonatedDialogOpen(true);
  };

  return (
    <Layout>
      <div className="relative min-h-[60vh] overflow-hidden bg-[hsl(28_35%_12%)] text-foreground">
        <div
          className="pointer-events-none absolute -left-1/4 top-0 h-[min(70vh,520px)] w-[70%] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(35_45%_42%/0.22)_0%,transparent_65%)] blur-3xl animate-wardrobe-ambient"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-1/4 bottom-0 h-[min(60vh,480px)] w-[65%] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(262_45%_35%/0.2)_0%,transparent_60%)] blur-3xl animate-wardrobe-ambient [animation-delay:-7s]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(0_0%_100%/0.06)_48px,hsl(0_0%_100%/0.06)_49px)]"
          aria-hidden
        />
        <div className="relative container mx-auto px-4 py-8 md:py-12">
          <nav className="text-sm text-white/55 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            <Link to="/" className="hover:text-styvia-pink transition-colors">
              Home
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white/90">Wardrobe</span>
          </nav>

          <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10 md:mb-12 animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-styvia-gold/90">
                Virtual closet
              </p>
              <h1 className="font-display-hero text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.1] drop-shadow-sm">
                Your wardrobe room
              </h1>
              <p className="text-white/65 text-sm md:text-base leading-relaxed">
                When you <strong className="text-white/90 font-medium">place an order</strong>, those lines sync to your
                account. Add pieces from any product page — browse/demo URLs stay{' '}
                <strong className="text-white/90 font-medium">on this device</strong> until you open the same style from
                Shop with a numeric id.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="default"
                className="rounded-full bg-styvia-pink hover:bg-styvia-pink/90 text-white shadow-lg shadow-styvia-pink/25"
                asChild
              >
                <Link to="/products">
                  <Shirt className="w-4 h-4 mr-2" />
                  Browse &amp; add pieces
                </Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/25 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', syncing && 'animate-spin')} />
                Import missing order lines
              </Button>
            </div>
          </header>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10 animate-pulse aspect-[4/5]"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.06] backdrop-blur-md px-8 py-16 text-center max-w-lg mx-auto animate-in fade-in-0 zoom-in-95 duration-500">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-styvia-pink/15 mb-6 ring-1 ring-styvia-pink/30">
                <Shirt className="w-8 h-8 text-styvia-pink" />
              </div>
              <h2 className="font-display-hero text-2xl font-semibold mb-2 text-white">Your rails are empty</h2>
              <p className="text-white/60 text-sm mb-6 leading-relaxed">
                After checkout, pieces appear here automatically. Add from any product page, or run{' '}
                <strong className="text-white/85 font-medium">Import missing order lines</strong> for older orders.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-styvia-pink hover:bg-styvia-pink/90 text-white"
                  asChild
                >
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
                  className="rounded-full px-8 border-white/25 bg-white/5 text-white hover:bg-white/10"
                >
                  <RefreshCw className={cn('w-4 h-4 mr-2', syncing && 'animate-spin')} />
                  Import from orders
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative rounded-[2rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-4 md:p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)] backdrop-blur-sm">
              <div
                className="pointer-events-none absolute inset-x-8 top-3 h-px rounded-full bg-[length:200%_100%] bg-gradient-to-r from-transparent via-styvia-gold/40 to-transparent opacity-80 animate-wardrobe-rail-shine"
                aria-hidden
              />
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7 pt-4">
                {items.map((item, i) => {
                  const q = rowQuantity(item);
                  const imageUrls = getWardrobeDisplayImageUrls(item.productName, item.imageUrl);
                  return (
                    <button
                      key={item.localOnly ? `local-${item.id}` : `api-${item.id}`}
                      type="button"
                      onClick={() => openPanel(item)}
                      style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
                      className={cn(
                        'group relative text-left rounded-2xl overflow-hidden',
                        'bg-[hsl(28_25%_8%)] ring-1 ring-white/10 shadow-lg shadow-black/40',
                        'hover:ring-styvia-pink/35 hover:shadow-xl hover:shadow-styvia-pink/10 hover:-translate-y-1',
                        'transition-all duration-500 ease-out',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-styvia-pink focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(28_35%_12%)]',
                        'animate-in fade-in-0 slide-in-from-bottom-4 duration-500',
                      )}
                    >
                      <div className="absolute left-1/2 top-0 z-10 h-3 w-10 -translate-x-1/2 rounded-b-md bg-gradient-to-b from-white/25 to-white/5 shadow-inner" />
                      <div className="aspect-[4/5] relative bg-gradient-to-b from-white/[0.08] to-black/40 mt-2">
                        {imageUrls.length > 0 ? (
                          <SafeProductImage
                            urls={imageUrls}
                            alt=""
                            className="absolute inset-0"
                            classNameImg="transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Shirt className="w-14 h-14 text-white/25" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                        {item.localOnly ? (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ring-1 ring-white/15 backdrop-blur-sm">
                            <Smartphone className="w-3 h-3" aria-hidden />
                            Device
                          </span>
                        ) : (
                          item.fromOrder && (
                            <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-950/70 text-emerald-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ring-1 ring-emerald-400/30 backdrop-blur-sm">
                              <Package className="w-3 h-3" aria-hidden />
                              Order
                            </span>
                          )
                        )}
                        {q > 1 && (
                          <span className="absolute top-3 right-3 rounded-full bg-black/70 text-white text-xs font-semibold tabular-nums px-2 py-0.5 ring-1 ring-white/10">
                            ×{q}
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-3.5 pt-12 text-white">
                          <p className="font-display-hero text-[15px] md:text-base font-semibold leading-snug line-clamp-2 mb-2">
                            {item.productName}
                          </p>
                          <div className="flex items-baseline justify-between gap-2 border-t border-white/15 pt-2.5 mt-1">
                            <span className="text-sm font-semibold tabular-nums text-styvia-gold/95">
                              Worn {item.wearCount}×
                            </span>
                            <span className="text-[11px] md:text-xs text-white/70 flex items-center gap-1 shrink-0">
                              {formatLastWorn(item.lastWornAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2.5 flex items-center justify-between bg-black/35 backdrop-blur-md border-t border-white/10 transition-colors duration-300 group-hover:bg-black/45">
                        <span className="text-[10px] uppercase tracking-wider text-white/55 font-medium truncate pr-2 group-hover:text-white/80">
                          {item.size} · {item.color}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Sheet open={panelOpen} onOpenChange={onSheetOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l border-border/60 bg-card p-0 gap-0">
          {activeItem && (
            <>
              <SheetDescription className="sr-only">
                Details for {activeItem.productName}.
              </SheetDescription>
              <div className="relative aspect-[5/4] bg-muted shrink-0">
                {panelImageUrls.length > 0 ? (
                  <SafeProductImage urls={panelImageUrls} alt="" className="absolute inset-0" />
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
                  <Button
                    size="sm"
                    variant={activeItem.lifecycleState === 'REPAIR_NEEDED' ? 'destructive' : 'outline'}
                    className="rounded-full"
                    title={
                      activeItem.lifecycleState === 'REPAIR_NEEDED'
                        ? 'Mark this piece as washed and back in rotation'
                        : 'Mark as needs wash'
                    }
                    onClick={() => handleRepair(activeItem)}
                  >
                    <Wrench className="w-3.5 h-3.5 mr-1.5" />
                    {activeItem.lifecycleState === 'REPAIR_NEEDED' ? 'Dress Washed' : 'Needs wash'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                    disabled={
                      activeItem.localOnly || !!activePickupForWardrobeItem(userPickups, activeItem.id)
                    }
                    title={
                      activePickupForWardrobeItem(userPickups, activeItem.id)
                        ? 'Disabled while a donation pickup is in progress for this item.'
                        : 'Mark as donated — hides this piece from your closet (no pickup request on file).'
                    }
                    onClick={onIDonatedClick}
                  >
                    I donated
                  </Button>
                  {!activeItem.localOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-emerald-600/40 text-emerald-800 dark:text-emerald-300"
                      disabled={!!activePickupForWardrobeItem(userPickups, activeItem.id)}
                      title={
                        activePickupForWardrobeItem(userPickups, activeItem.id)
                          ? 'A pickup request already exists for this item.'
                          : 'Schedule a donation pickup for this piece'
                      }
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
                {activeItem.localOnly && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Donation status is tracked on your account for shop orders. This device-only row cannot be marked as
                    donated on the server.
                  </p>
                )}
                {!activeItem.localOnly && activePickupForWardrobeItem(userPickups, activeItem.id) && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A pickup request is already created for this item. Scheduling again is disabled until that request is
                    completed or cancelled. It will disappear from your wardrobe when the pickup is completed — you do not
                    need to tap “I donated”.
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={donatedDialogOpen} onOpenChange={setDonatedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this piece from your wardrobe?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm only if you have already donated this item. It will be hidden from your closet and will not be added
              again when you import missing order lines.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmMarkDonated();
              }}
            >
              Yes, remove it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Wardrobe;
