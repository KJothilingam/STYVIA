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

type NavDonationState = { wardrobeItemId?: number; productSummary?: string; size?: string };

const REFETCH_MS = 12_000;
const USER_PICKUP_STEPS = ['Pending', 'Accepted', 'Pickup scheduled', 'Done'] as const;
const USER_BOX_STEPS = ['Pending', 'Approved', 'Delivery set', 'Delivered'] as const;

const BOX_TOAST_KEY = 'styvia-donation-box-approved-notified';

function StatChip({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-background/90 px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm text-center sm:text-left',
        className
      )}
    >
      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xl sm:text-2xl font-bold tabular-nums mt-0.5">{value}</p>
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

function RequestCard({ r }: { r: DonationPickupDTO }) {
  const st = statusStyles(r.status);
  return (
    <Card
      className={cn(
        'overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md',
        'border-l-4',
        st.border
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

function BoxRequestCard({ b }: { b: DonationBoxDTO }) {
  const st = boxStatusStyles(b.status);
  const addressLine = `${b.addressLine1}${b.locality ? `, ${b.locality}` : ''}, ${b.city} — ${b.pincode}`;
  return (
    <Card
      className={cn(
        'overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md',
        'border-l-4',
        st.border
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
      <div className="container mx-auto px-4 py-8 pb-12 max-w-5xl space-y-8">
        <Button variant="ghost" size="sm" className="gap-2 -ml-1 text-muted-foreground hover:text-foreground" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </Button>

        {/* Admin-style top card */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-sm p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <HeartHandshake className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Donations</h1>
              <p className="text-muted-foreground text-sm md:text-[15px] mt-2 max-w-2xl leading-relaxed">
                Manage dress pickups and empty-box shipments. Updates appear here automatically — you don&apos;t need to refresh.
                When your empty box is approved, you&apos;ll get a clear on-screen notification.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-2 h-auto p-1 bg-muted/80">
            <TabsTrigger value="pickups" className="gap-2 py-2.5 data-[state=active]:shadow-sm">
              <Package className="h-4 w-4 shrink-0" />
              Pickups
              {pickupCounts.PENDING > 0 ? (
                <span className="ml-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                  {pickupCounts.PENDING > 99 ? '99+' : pickupCounts.PENDING}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="boxes" className="gap-2 py-2.5 data-[state=active]:shadow-sm">
              <Box className="h-4 w-4 shrink-0" />
              Empty boxes
              {boxCounts.PENDING > 0 ? (
                <span className="ml-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                  {boxCounts.PENDING > 99 ? '99+' : boxCounts.PENDING}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pickups" className="mt-0 space-y-6 outline-none">
            <div className="rounded-xl border bg-muted/30 px-4 py-3">
              <p className="text-sm font-medium text-foreground">Dress pickup workflow</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
                {USER_PICKUP_STEPS.map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-1.5">
                    {i > 0 ? <ChevronRight className="h-3.5 w-3.5 opacity-45" /> : null}
                    <span className="rounded-full bg-background border px-2.5 py-1 font-medium text-foreground/85 shadow-sm">
                      {step}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatChip label="Total" value={pickupCounts.total} />
              <StatChip label="Pending" value={pickupCounts.PENDING} className="border-amber-500/25 bg-amber-500/[0.06]" />
              <StatChip label="Accepted" value={pickupCounts.REQ_ACCEPTED} className="border-sky-500/25 bg-sky-500/[0.06]" />
              <StatChip
                label="Scheduled"
                value={pickupCounts.EXPECTED_PICK_DATE}
                className="border-violet-500/25 bg-violet-500/[0.06]"
              />
              <StatChip label="Done" value={pickupCounts.COMPLETED} className="border-emerald-500/25 bg-emerald-500/[0.06]" />
              <StatChip
                label="Rejected"
                value={pickupCounts.CANCELLED}
                className="border-red-500/25 bg-red-500/[0.06]"
              />
            </div>

            <Card className="border-border/80 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
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
                  <Button type="submit" disabled={createPickupMutation.isPending} className="w-full sm:w-auto">
                    {createPickupMutation.isPending ? 'Submitting…' : 'Request pickup'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <section className="rounded-2xl border border-border/80 bg-gradient-to-b from-muted/40 via-muted/15 to-background p-5 md:p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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
                <div className="flex items-center justify-center py-14 gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading…
                </div>
              ) : list.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No pickup requests yet</p>
                </div>
              ) : filteredPickups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No requests match this filter.</p>
              ) : (
                <ul className="space-y-4">
                  {filteredPickups.map((r) => (
                    <li key={r.id}>
                      <RequestCard r={r} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="boxes" className="mt-0 space-y-6 outline-none">
            <div className="rounded-xl border bg-muted/30 px-4 py-3">
              <p className="text-sm font-medium text-foreground">Empty box workflow</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
                {USER_BOX_STEPS.map((step, i) => (
                  <span key={step} className="inline-flex items-center gap-1.5">
                    {i > 0 ? <ChevronRight className="h-3.5 w-3.5 opacity-45" /> : null}
                    <span className="rounded-full bg-background border px-2.5 py-1 font-medium text-foreground/85 shadow-sm">
                      {step}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatChip label="Total" value={boxCounts.total} />
              <StatChip label="Pending" value={boxCounts.PENDING} className="border-amber-500/25 bg-amber-500/[0.06]" />
              <StatChip label="Approved" value={boxCounts.REQ_ACCEPTED} className="border-sky-500/25 bg-sky-500/[0.06]" />
              <StatChip
                label="Scheduled"
                value={boxCounts.EXPECTED_DELIVERY}
                className="border-violet-500/25 bg-violet-500/[0.06]"
              />
              <StatChip label="Delivered" value={boxCounts.COMPLETED} className="border-emerald-500/25 bg-emerald-500/[0.06]" />
              <StatChip
                label="Rejected"
                value={boxCounts.CANCELLED}
                className="border-red-500/25 bg-red-500/[0.06]"
              />
            </div>

            {highlight && (
              <Card className="border-primary/35 bg-gradient-to-br from-primary/[0.07] to-transparent shadow-md">
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

            <Card className="border-border/80 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
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
                  <Button type="submit" disabled={createBoxMutation.isPending}>
                    {createBoxMutation.isPending ? 'Submitting…' : 'Request donation box'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <section className="rounded-2xl border border-border/80 bg-gradient-to-b from-violet-500/[0.06] via-muted/20 to-background p-5 md:p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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
                <div className="flex items-center justify-center py-14 gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading…
                </div>
              ) : boxes.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
                  <Box className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No box requests yet</p>
                </div>
              ) : filteredBoxes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No requests match this filter.</p>
              ) : (
                <ul className="space-y-4">
                  {filteredBoxes.map((b) => (
                    <li key={b.id}>
                      <BoxRequestCard b={b} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
