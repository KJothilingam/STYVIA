import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HeartHandshake,
  Package,
  ArrowLeft,
  Loader2,
  CalendarClock,
  MessageCircle,
  MapPin,
  Hash,
  ChevronRight,
  Box,
  Phone,
  User,
  Mail,
  Sparkles,
  Leaf,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast as sonnerToast } from '@/components/ui/sonner';
import donationService, { type DonationBoxDTO, type DonationPickupDTO } from '@/services/donationService';
import { DONATION_CENTERS } from '@/data/donationCenters';
import { useToast } from '@/hooks/use-toast';
import { donationQueryKeys } from '@/lib/donationQueryKeys';
import { cn } from '@/lib/utils';
import {
  DonationsPageBackdrop,
  donationsAmbientPageClass,
  donationsMainGlassPanelClass,
  donationsPageContentClass,
} from '@/components/donations/DonationsPageChrome';

type NavDonationState = { wardrobeItemId?: number; productSummary?: string; size?: string };

const REFETCH_MS = 12_000;
const USER_PICKUP_STEPS = ['Pending', 'Accepted', 'Pickup scheduled', 'Done'] as const;
const USER_BOX_STEPS = ['Pending', 'Approved', 'Delivery set', 'Delivered'] as const;

const BOX_TOAST_KEY = 'styvia-donation-box-approved-notified';

function StatChip({
  label,
  value,
  className,
  staggerIndex = 0,
}: {
  label: string;
  value: number;
  className?: string;
  staggerIndex?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${staggerIndex * 55}ms`, animationFillMode: 'both' }}
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500',
        'rounded-xl border border-border/80 bg-background/85 px-3 py-2.5 text-center shadow-sm backdrop-blur-sm sm:px-4 sm:py-3 sm:text-left',
        'transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/[0.08]',
        className,
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground sm:text-2xl">{value}</p>
    </div>
  );
}

function pickupStatusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    REQ_ACCEPTED: 'Request accepted',
    EXPECTED_PICK_DATE: 'Pickup scheduled',
    COMPLETED: 'Completed',
    CANCELLED: 'Rejected',
    SCHEDULED: 'Scheduled',
    PICKED_UP: 'Picked up',
  };
  return map[status] ?? status.replace(/_/g, ' ');
}

function statusStyles(status: string) {
  const map: Record<string, { badge: string; border: string }> = {
    PENDING: {
      badge: 'bg-amber-500/15 text-amber-900 border-amber-500/25 dark:text-amber-100 dark:bg-amber-500/10',
      border: 'border-l-amber-500',
    },
    REQ_ACCEPTED: {
      badge: 'bg-sky-500/15 text-sky-900 border-sky-500/25 dark:text-sky-100 dark:bg-sky-500/10',
      border: 'border-l-sky-500',
    },
    EXPECTED_PICK_DATE: {
      badge: 'bg-violet-500/15 text-violet-900 border-violet-500/25 dark:text-violet-100 dark:bg-violet-500/10',
      border: 'border-l-violet-500',
    },
    COMPLETED: {
      badge: 'bg-emerald-500/15 text-emerald-900 border-emerald-500/25 dark:text-emerald-100 dark:bg-emerald-500/10',
      border: 'border-l-emerald-500',
    },
    CANCELLED: {
      badge: 'bg-muted text-muted-foreground border-border',
      border: 'border-l-muted-foreground',
    },
  };
  return (
    map[status] ?? {
      badge: 'bg-muted text-muted-foreground border-border',
      border: 'border-l-border',
    }
  );
}

function boxStatusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    REQ_ACCEPTED: 'Approved',
    EXPECTED_DELIVERY: 'Delivery scheduled',
    COMPLETED: 'Delivered',
    CANCELLED: 'Rejected',
    REQUESTED: 'Pending',
    BOX_SHIPPED: 'Delivery scheduled',
    BOX_DELIVERED: 'Delivered',
    AWAITING_DROP: 'Delivery scheduled',
    COLLECTED: 'Delivered',
  };
  return map[status] ?? status.replace(/_/g, ' ');
}

function boxStatusStyles(status: string) {
  const map: Record<string, { badge: string; border: string }> = {
    PENDING: {
      badge: 'bg-amber-500/15 text-amber-900 border-amber-500/25 dark:text-amber-100 dark:bg-amber-500/10',
      border: 'border-l-amber-500',
    },
    REQ_ACCEPTED: {
      badge: 'bg-sky-500/15 text-sky-900 border-sky-500/25 dark:text-sky-100 dark:bg-sky-500/10',
      border: 'border-l-sky-500',
    },
    EXPECTED_DELIVERY: {
      badge: 'bg-violet-500/15 text-violet-900 border-violet-500/25 dark:text-violet-100 dark:bg-violet-500/10',
      border: 'border-l-violet-500',
    },
    COMPLETED: {
      badge: 'bg-emerald-500/15 text-emerald-900 border-emerald-500/25 dark:text-emerald-100 dark:bg-emerald-500/10',
      border: 'border-l-emerald-500',
    },
    CANCELLED: {
      badge: 'bg-muted text-muted-foreground border-border',
      border: 'border-l-muted-foreground',
    },
  };
  return (
    map[status] ?? {
      badge: 'bg-muted text-muted-foreground border-border',
      border: 'border-l-border',
    }
  );
}

function RequestCard({ r, staggerIndex = 0 }: { r: DonationPickupDTO; staggerIndex?: number }) {
  const st = statusStyles(r.status);
  return (
    <Card
      style={{ animationDelay: `${staggerIndex * 65}ms`, animationFillMode: 'both' }}
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500',
        'group/dcard overflow-hidden border-border/80 shadow-md transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/[0.06]',
        'border-l-4',
        st.border,
        'relative before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-400/40 before:to-transparent before:opacity-0 before:transition-opacity group-hover/dcard:before:opacity-100',
      )}
    >
      <CardHeader className="pb-3 space-y-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-mono tabular-nums">#{r.id}</span>
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight leading-tight">
              {r.donationCenterCode.replace(/_/g, ' ')}
            </CardTitle>
          </div>
          <Badge variant="outline" className={cn('shrink-0 font-semibold border', st.badge)}>
            {pickupStatusLabel(r.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {r.productSummary && <p className="text-sm text-foreground/90 leading-relaxed">{r.productSummary}</p>}
        {r.pickupAddress && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{r.pickupAddress}</span>
          </div>
        )}
        {r.expectedPickAt && (
          <div className="flex items-start gap-3 rounded-xl bg-muted/50 border border-border/60 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm border border-border/50">
              <CalendarClock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Expected pickup</p>
              <p className="text-sm font-semibold tabular-nums">{new Date(r.expectedPickAt).toLocaleString()}</p>
            </div>
          </div>
        )}
        {r.adminReply && (
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Message from us</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{r.adminReply}</p>
          </div>
        )}
        <Separator className="opacity-60" />
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
          Submitted {new Date(r.createdAt).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

function BoxRequestCard({ b, staggerIndex = 0 }: { b: DonationBoxDTO; staggerIndex?: number }) {
  const st = boxStatusStyles(b.status);
  const addressLine = `${b.addressLine1}${b.locality ? `, ${b.locality}` : ''}, ${b.city} — ${b.pincode}`;
  return (
    <Card
      style={{ animationDelay: `${staggerIndex * 65}ms`, animationFillMode: 'both' }}
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500',
        'group/dcard overflow-hidden border-border/80 shadow-md transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-500/[0.06]',
        'border-l-4',
        st.border,
        'relative before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-violet-400/35 before:to-transparent before:opacity-0 before:transition-opacity group-hover/dcard:before:opacity-100',
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
              <Box className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono tabular-nums">#{b.id}</span>
            </div>
            <CardTitle className="text-base font-semibold leading-tight">Empty box request</CardTitle>
          </div>
          <Badge variant="outline" className={cn('shrink-0 font-semibold border', st.badge)}>
            {boxStatusLabel(b.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="rounded-xl border border-border/70 bg-muted/25 px-3 py-3 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your details</p>
          {b.userName ? (
            <p className="text-sm flex items-center gap-2 min-w-0">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{b.userName}</span>
            </p>
          ) : null}
          {b.userEmail ? (
            <p className="text-sm flex items-center gap-2 min-w-0">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{b.userEmail}</span>
            </p>
          ) : null}
          <p className="text-sm flex items-center gap-2 min-w-0">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{b.phone}</span>
          </p>
          <p className="text-sm flex items-start gap-2 text-foreground/90">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <span>{addressLine}</span>
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-muted/50 border border-border/60 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm border">
            <CalendarClock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Expected delivery</p>
            {b.expectedDeliveryAt ? (
              <p className="text-sm font-semibold tabular-nums">{new Date(b.expectedDeliveryAt).toLocaleString()}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not scheduled yet — we&apos;ll add a date after approval.</p>
            )}
          </div>
        </div>

        {b.notes ? (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Your notes</p>
            <p className="text-sm text-foreground/90">{b.notes}</p>
          </div>
        ) : null}
        {b.adminReply && (
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Message from us</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{b.adminReply}</p>
          </div>
        )}
        <Separator className="opacity-60" />
        <p className="text-xs text-muted-foreground">Requested {new Date(b.createdAt).toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

type PickupFilter = 'ALL' | DonationPickupDTO['status'];
type BoxFilter = 'ALL' | DonationBoxDTO['status'];

export default function Donations() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'boxes' ? 'boxes' : 'pickups';

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [wardrobeItemId, setWardrobeItemId] = useState<number | undefined>();
  const [centerCode, setCenterCode] = useState(DONATION_CENTERS[0].code);
  const [productSummary, setProductSummary] = useState('');
  const [size, setSize] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [pickupFilter, setPickupFilter] = useState<PickupFilter>('ALL');
  const [boxFilter, setBoxFilter] = useState<BoxFilter>('ALL');

  const [addressLine1, setAddressLine1] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [boxNotes, setBoxNotes] = useState('');
  const [highlight, setHighlight] = useState<DonationBoxDTO | null>(null);

  const prevBoxStatusById = useRef<Record<number, string>>({});

  const {
    data: list = [],
    isLoading: pickupsLoading,
    isFetching: pickupsFetching,
  } = useQuery({
    queryKey: donationQueryKeys.userPickups(),
    queryFn: () => donationService.listPickups(),
    refetchInterval: REFETCH_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 4_000,
  });

  const {
    data: boxes = [],
    isLoading: boxesLoading,
    isFetching: boxesFetching,
  } = useQuery({
    queryKey: donationQueryKeys.userBoxes(),
    queryFn: () => donationService.listBoxes(),
    refetchInterval: REFETCH_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 4_000,
  });

  /** Sonner toast + session dedupe: radix toaster only shows one toast at a time, so approval was easy to miss. */
  useEffect(() => {
    for (const b of boxes) {
      const was = prevBoxStatusById.current[b.id];
      const now = b.status;
      const wasPreApproval = was === undefined || was === 'PENDING' || was === 'REQUESTED';
      const becameApproved = now === 'REQ_ACCEPTED' && was !== 'REQ_ACCEPTED' && wasPreApproval;

      if (becameApproved) {
        const sessionKey = `${BOX_TOAST_KEY}-${b.id}`;
        try {
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            sonnerToast.success('Empty box request approved', {
              description: 'Open the Empty boxes tab to see details and expected delivery when we set it.',
              duration: 12000,
            });
          }
        } catch {
          sonnerToast.success('Empty box request approved', {
            description: 'Check the Empty boxes tab for updates.',
            duration: 12000,
          });
        }
      }
      prevBoxStatusById.current[b.id] = now;
    }
  }, [boxes]);

  const pickupCounts = useMemo(() => {
    return {
      total: list.length,
      PENDING: list.filter((r) => r.status === 'PENDING').length,
      REQ_ACCEPTED: list.filter((r) => r.status === 'REQ_ACCEPTED').length,
      EXPECTED_PICK_DATE: list.filter((r) => r.status === 'EXPECTED_PICK_DATE').length,
      COMPLETED: list.filter((r) => r.status === 'COMPLETED').length,
      CANCELLED: list.filter((r) => r.status === 'CANCELLED').length,
    };
  }, [list]);

  const boxCounts = useMemo(() => {
    return {
      total: boxes.length,
      PENDING: boxes.filter((r) => r.status === 'PENDING').length,
      REQ_ACCEPTED: boxes.filter((r) => r.status === 'REQ_ACCEPTED').length,
      EXPECTED_DELIVERY: boxes.filter((r) => r.status === 'EXPECTED_DELIVERY').length,
      COMPLETED: boxes.filter((r) => r.status === 'COMPLETED').length,
      CANCELLED: boxes.filter((r) => r.status === 'CANCELLED').length,
    };
  }, [boxes]);

  const filteredPickups = useMemo(() => {
    if (pickupFilter === 'ALL') return list;
    return list.filter((r) => r.status === pickupFilter);
  }, [list, pickupFilter]);

  const filteredBoxes = useMemo(() => {
    if (boxFilter === 'ALL') return boxes;
    return boxes.filter((r) => r.status === boxFilter);
  }, [boxes, boxFilter]);

  const createPickupMutation = useMutation({
    mutationFn: donationService.createPickup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: donationQueryKeys.userPickups() });
    },
  });

  const createBoxMutation = useMutation({
    mutationFn: donationService.requestBox,
    onSuccess: (b) => {
      queryClient.invalidateQueries({ queryKey: donationQueryKeys.userBoxes() });
      setHighlight(b);
    },
  });

  useEffect(() => {
    const s = location.state as NavDonationState | null | undefined;
    if (!s) return;
    if (s.wardrobeItemId != null) setWardrobeItemId(s.wardrobeItemId);
    if (s.productSummary) setProductSummary(s.productSummary);
    if (s.size) setSize(s.size);
  }, [location.state]);

  const submitPickup = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = pickupAddress.trim();
    if (!addr) {
      toast({ title: 'Pickup address required', description: 'Enter where we should collect the items.', variant: 'destructive' });
      return;
    }
    createPickupMutation.mutate(
      {
        wardrobeItemId: wardrobeItemId,
        donationCenterCode: centerCode,
        productSummary: productSummary || undefined,
        size: size || undefined,
        pickupAddress: addr,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'Pickup requested', description: 'Our partner will contact you to confirm.' });
          setProductSummary('');
          setSize('');
          setPickupAddress('');
          setNotes('');
        },
        onError: () => toast({ title: 'Request failed', variant: 'destructive' }),
      }
    );
  };

  const submitBox = (e: React.FormEvent) => {
    e.preventDefault();
    createBoxMutation.mutate(
      {
        addressLine1,
        locality: locality || undefined,
        city,
        pincode,
        phone,
        notes: boxNotes || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Box request submitted',
            description: 'We will review it shortly. You will get a prominent notification when it is approved.',
          });
          setAddressLine1('');
          setLocality('');
          setCity('');
          setPincode('');
          setPhone('');
          setBoxNotes('');
        },
        onError: () => toast({ title: 'Request failed', variant: 'destructive' }),
      }
    );
  };

  const setTab = (v: string) => {
    if (v === 'boxes') setSearchParams({ tab: 'boxes' });
    else setSearchParams({});
  };

  return (
    <Layout>
      <div className={cn(donationsAmbientPageClass, 'min-h-[62vh]')}>
        <DonationsPageBackdrop />
        <div className={donationsPageContentClass}>
          <nav className="text-sm text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 transition-colors hover:text-emerald-700 dark:hover:text-emerald-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="font-medium text-foreground">Donations</span>
          </nav>

          <header
            className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500"
            style={{ animationFillMode: 'both' }}
          >
            <div className="min-w-0 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-100/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100">
                <Leaf className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-200" />
                Give back
                <Sparkles className="h-3 w-3 shrink-0 text-amber-600/90 dark:text-amber-200/90" />
              </div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-200/60 dark:shadow-emerald-600/35 dark:ring-white/20 motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:scale-105">
                  <HeartHandshake className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-display-hero text-3xl font-semibold tracking-tight text-foreground drop-shadow-sm md:text-4xl lg:text-5xl">
                    Donations{' '}
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-emerald-200 dark:via-teal-200 dark:to-amber-200">
                      &amp; sustainability
                    </span>
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                    Full-width studio for dress pickups and empty-box shipments — live updates, no refresh. You&apos;ll get a
                    clear notice when a box request is approved.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div
            className={cn(
              donationsMainGlassPanelClass,
              'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500',
            )}
            style={{ animationFillMode: 'both', animationDelay: '80ms' }}
          >
            <div
              className="pointer-events-none absolute inset-x-8 top-3 h-px rounded-full bg-[length:200%_100%] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent opacity-90 motion-safe:animate-wardrobe-rail-shine dark:via-emerald-300/35"
              aria-hidden
            />

            <Tabs value={tab} onValueChange={setTab} className="relative z-10 mt-4 space-y-6 md:mt-6">
          <TabsList className="relative grid h-auto w-full max-w-full grid-cols-2 gap-1.5 rounded-2xl border border-border/80 bg-muted/70 p-1.5 shadow-inner backdrop-blur-md sm:max-w-xl md:max-w-2xl lg:max-w-none lg:grid-cols-[1fr_1fr] dark:border-white/15 dark:bg-black/20">
            <TabsTrigger
              value="pickups"
              className="gap-2 rounded-xl py-3 text-muted-foreground transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-emerald-500/10 data-[state=active]:ring-2 data-[state=active]:ring-emerald-500/25 dark:text-white/70 dark:data-[state=active]:bg-white/15 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-emerald-500/15 dark:data-[state=active]:ring-emerald-400/35"
            >
              <Package className="h-4 w-4 shrink-0 text-emerald-600 data-[state=active]:text-emerald-700 dark:text-emerald-300 dark:data-[state=active]:text-emerald-200" />
              Pickups
              {pickupCounts.PENDING > 0 ? (
                <span className="ml-0.5 rounded-full bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-900 dark:text-amber-100">
                  {pickupCounts.PENDING > 99 ? '99+' : pickupCounts.PENDING}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="boxes"
              className="gap-2 rounded-xl py-3 text-muted-foreground transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-violet-500/10 data-[state=active]:ring-2 data-[state=active]:ring-violet-500/25 dark:text-white/70 dark:data-[state=active]:bg-white/15 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-violet-500/20 dark:data-[state=active]:ring-violet-300/40"
            >
              <Box className="h-4 w-4 shrink-0 text-violet-600 data-[state=active]:text-violet-700 dark:text-violet-300 dark:data-[state=active]:text-violet-200" />
              Empty boxes
              {boxCounts.PENDING > 0 ? (
                <span className="ml-0.5 rounded-full bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-900 dark:text-amber-100">
                  {boxCounts.PENDING > 99 ? '99+' : boxCounts.PENDING}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pickups" className="mt-0 space-y-6 outline-none">
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.07] via-muted/35 to-muted/15 px-4 py-3 shadow-sm backdrop-blur-sm">
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-emerald-400/5 to-transparent motion-safe:animate-pulse"
                aria-hidden
              />
              <p className="relative text-sm font-semibold text-foreground">Dress pickup workflow</p>
              <div className="relative mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
                {USER_PICKUP_STEPS.map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-1.5">
                    {i > 0 ? (
                      <ChevronRight className="h-3.5 w-3.5 opacity-40 motion-safe:transition-transform motion-safe:duration-300" />
                    ) : null}
                    <span className="rounded-full border border-border/70 bg-background/95 px-2.5 py-1 font-medium text-foreground/90 shadow-sm ring-1 ring-emerald-500/10 transition-all duration-300 hover:ring-emerald-500/30 hover:shadow-md">
                      {step}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatChip label="Total" value={pickupCounts.total} staggerIndex={0} />
              <StatChip
                label="Pending"
                value={pickupCounts.PENDING}
                staggerIndex={1}
                className="border-amber-500/25 bg-amber-500/[0.06]"
              />
              <StatChip
                label="Accepted"
                value={pickupCounts.REQ_ACCEPTED}
                staggerIndex={2}
                className="border-sky-500/25 bg-sky-500/[0.06]"
              />
              <StatChip
                label="Scheduled"
                value={pickupCounts.EXPECTED_PICK_DATE}
                staggerIndex={3}
                className="border-violet-500/25 bg-violet-500/[0.06]"
              />
              <StatChip
                label="Done"
                value={pickupCounts.COMPLETED}
                staggerIndex={4}
                className="border-emerald-500/25 bg-emerald-500/[0.06]"
              />
              <StatChip
                label="Rejected"
                value={pickupCounts.CANCELLED}
                staggerIndex={5}
                className="border-red-500/25 bg-red-500/[0.06]"
              />
            </div>

            <Card className="overflow-hidden border-border/80 shadow-lg transition-shadow duration-300 hover:shadow-xl">
              <CardHeader className="border-b border-border/60 bg-gradient-to-r from-muted/50 via-muted/25 to-transparent">
                <CardTitle className="text-lg">New pickup request</CardTitle>
                <CardDescription>
                  Link items from your wardrobe via <strong>Wardrobe → Schedule donation</strong>, or describe them here.
                  {wardrobeItemId != null && (
                    <span className="block mt-1 text-primary">Linked to wardrobe item #{wardrobeItemId}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={submitPickup} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Donation center</Label>
                    <Select value={centerCode} onValueChange={setCenterCode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DONATION_CENTERS.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Items (short description)</Label>
                    <Input
                      value={productSummary}
                      onChange={(e) => setProductSummary(e.target.value)}
                      placeholder="e.g. 2 cotton shirts, 1 pair jeans — good condition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Typical size (optional)</Label>
                      <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="M / L / 32" />
                    </div>
                    <div className="space-y-2">
                      <Label>Pickup address</Label>
                      <Input
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        required
                        placeholder="Full pickup location or area & pincode"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Pickup window…" />
                  </div>
                  <Button
                    type="submit"
                    disabled={createPickupMutation.isPending}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/20 transition-all hover:from-emerald-600 hover:to-teal-500 hover:shadow-emerald-600/30 sm:w-auto"
                  >
                    {createPickupMutation.isPending ? 'Submitting…' : 'Request pickup'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <section className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-b from-muted/50 via-muted/20 to-background p-5 shadow-md md:p-7">
              <div
                className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl motion-safe:animate-body-zone-float"
                aria-hidden
              />
              <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Pickup requests</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredPickups.length === list.length ? `${list.length} total` : `Showing ${filteredPickups.length} of ${list.length}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pickupsFetching && !pickupsLoading ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Syncing…
                    </span>
                  ) : null}
                  <Select value={pickupFilter} onValueChange={(v) => setPickupFilter(v as PickupFilter)}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-background">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REQ_ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="EXPECTED_PICK_DATE">Scheduled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {pickupsLoading ? (
                <div className="relative flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  Loading…
                </div>
              ) : list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-emerald-500/25 bg-muted/20 px-6 py-14 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-2 ring-emerald-500/20 motion-safe:animate-pulse">
                    <Package className="h-7 w-7 text-emerald-600/70" />
                  </div>
                  <p className="text-sm font-medium">No pickup requests yet</p>
                </div>
              ) : filteredPickups.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No requests match this filter.</p>
              ) : (
                <ul className="space-y-4">
                  {filteredPickups.map((r, i) => (
                    <li key={r.id}>
                      <RequestCard r={r} staggerIndex={i} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="boxes" className="mt-0 space-y-6 outline-none">
            <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.08] via-muted/35 to-muted/15 px-4 py-3 shadow-sm backdrop-blur-sm">
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-violet-400/8 to-transparent motion-safe:animate-pulse"
                aria-hidden
              />
              <p className="relative text-sm font-semibold text-foreground">Empty box workflow</p>
              <div className="relative mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
                {USER_BOX_STEPS.map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-1.5">
                    {i > 0 ? (
                      <ChevronRight className="h-3.5 w-3.5 opacity-40 motion-safe:transition-transform motion-safe:duration-300" />
                    ) : null}
                    <span className="rounded-full border border-border/70 bg-background/95 px-2.5 py-1 font-medium text-foreground/90 shadow-sm ring-1 ring-violet-500/10 transition-all duration-300 hover:ring-violet-500/30 hover:shadow-md">
                      {step}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatChip label="Total" value={boxCounts.total} staggerIndex={0} />
              <StatChip
                label="Pending"
                value={boxCounts.PENDING}
                staggerIndex={1}
                className="border-amber-500/25 bg-amber-500/[0.06]"
              />
              <StatChip
                label="Approved"
                value={boxCounts.REQ_ACCEPTED}
                staggerIndex={2}
                className="border-sky-500/25 bg-sky-500/[0.06]"
              />
              <StatChip
                label="Scheduled"
                value={boxCounts.EXPECTED_DELIVERY}
                staggerIndex={3}
                className="border-violet-500/25 bg-violet-500/[0.06]"
              />
              <StatChip
                label="Delivered"
                value={boxCounts.COMPLETED}
                staggerIndex={4}
                className="border-emerald-500/25 bg-emerald-500/[0.06]"
              />
              <StatChip
                label="Rejected"
                value={boxCounts.CANCELLED}
                staggerIndex={5}
                className="border-red-500/25 bg-red-500/[0.06]"
              />
            </div>

            {highlight && (
              <Card className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500 overflow-hidden border-primary/40 bg-gradient-to-br from-primary/[0.1] via-violet-500/[0.04] to-transparent shadow-lg ring-1 ring-primary/15">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Box className="h-5 w-5" />
                    Request submitted
                  </CardTitle>
                  <CardDescription>
                    We&apos;ll review your empty box request. Status and delivery date update here automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className={cn('font-semibold border', boxStatusStyles(highlight.status).badge)}>
                      {boxStatusLabel(highlight.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Expected delivery</span>
                    <span className="text-right font-medium text-foreground/90">
                      {highlight.expectedDeliveryAt
                        ? new Date(highlight.expectedDeliveryAt).toLocaleString()
                        : 'Not scheduled yet'}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ship to</p>
                    <p className="text-foreground/90">
                      {highlight.addressLine1}
                      {highlight.locality ? `, ${highlight.locality}` : ''}, {highlight.city} — {highlight.pincode}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {highlight.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden border-border/80 shadow-lg transition-shadow duration-300 hover:shadow-xl">
              <CardHeader className="border-b border-border/60 bg-gradient-to-r from-violet-500/[0.06] via-muted/40 to-transparent">
                <CardTitle className="text-lg">Request a box</CardTitle>
                <CardDescription>We ship to the address below. Status and messages update live.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={submitBox} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Address line</Label>
                    <Input
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      required
                      placeholder="House / flat, street"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Locality</Label>
                      <Input value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="Area" />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={boxNotes} onChange={(e) => setBoxNotes(e.target.value)} rows={2} />
                  </div>
                  <Button
                    type="submit"
                    disabled={createBoxMutation.isPending}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20 transition-all hover:from-violet-600 hover:to-indigo-500 hover:shadow-violet-600/30"
                  >
                    {createBoxMutation.isPending ? 'Submitting…' : 'Request donation box'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <section className="relative overflow-hidden rounded-2xl border border-violet-500/15 bg-gradient-to-b from-violet-500/[0.08] via-muted/25 to-background p-5 shadow-md md:p-7">
              <div
                className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl motion-safe:animate-body-zone-float [animation-delay:-3s]"
                aria-hidden
              />
              <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Box requests</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredBoxes.length === boxes.length ? `${boxes.length} total` : `Showing ${filteredBoxes.length} of ${boxes.length}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {boxesFetching && !boxesLoading ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Syncing…
                    </span>
                  ) : null}
                  <Select value={boxFilter} onValueChange={(v) => setBoxFilter(v as BoxFilter)}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-background">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REQ_ACCEPTED">Approved</SelectItem>
                      <SelectItem value="EXPECTED_DELIVERY">Scheduled</SelectItem>
                      <SelectItem value="COMPLETED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {boxesLoading ? (
                <div className="relative flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                  Loading…
                </div>
              ) : boxes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-violet-500/25 bg-muted/20 px-6 py-14 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-2 ring-violet-500/20 motion-safe:animate-pulse">
                    <Box className="h-7 w-7 text-violet-600/70" />
                  </div>
                  <p className="text-sm font-medium">No box requests yet</p>
                </div>
              ) : filteredBoxes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No requests match this filter.</p>
              ) : (
                <ul className="space-y-4">
                  {filteredBoxes.map((b, i) => (
                    <li key={b.id}>
                      <BoxRequestCard b={b} staggerIndex={i} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
