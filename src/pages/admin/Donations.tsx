import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  HeartHandshake,
  Loader2,
  User,
  Mail,
  MapPin,
  Package,
  CalendarClock,
  MessageCircle,
  Hash,
  ChevronRight,
  Inbox,
  Box,
  Phone,
  ArrowLeft,
  Leaf,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import adminService, { type AdminDonationBoxRow, type AdminDonationPickupRow } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { donationQueryKeys } from '@/lib/donationQueryKeys';
import {
  DonationsPageBackdrop,
  donationsAmbientPageClass,
  donationsMainGlassPanelClass,
  donationsPageContentClass,
} from '@/components/donations/DonationsPageChrome';

const REFETCH_MS = 12_000;

type StatusFilter = 'ALL' | AdminDonationPickupRow['status'];

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    REQ_ACCEPTED: 'Request accepted',
    EXPECTED_PICK_DATE: 'Pickup scheduled',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
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

function errMessage(e: unknown) {
  if (axios.isAxiosError(e) && e.response?.data && typeof (e.response.data as { message?: string }).message === 'string') {
    return (e.response.data as { message: string }).message;
  }
  return 'Something went wrong';
}

function boxStatusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    REQ_ACCEPTED: 'Approved',
    EXPECTED_DELIVERY: 'Delivery scheduled',
    COMPLETED: 'Delivered',
    CANCELLED: 'Cancelled',
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

type BoxStatusFilter = 'ALL' | AdminDonationBoxRow['status'];

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

function PickupRowCard({
  row,
  onInvalidate,
  staggerIndex = 0,
}: {
  row: AdminDonationPickupRow;
  onInvalidate: () => void;
  staggerIndex?: number;
}) {
  const { toast } = useToast();
  const [pendingNote, setPendingNote] = useState('');
  const [pickAt, setPickAt] = useState('');
  const [scheduleReply, setScheduleReply] = useState('');
  const [completeReply, setCompleteReply] = useState('');
  const [busy, setBusy] = useState(false);

  const st = statusStyles(row.status);
  const centerDisplay = row.donationCenterCode.replace(/_/g, ' ');

  const doAccept = async () => {
    setBusy(true);
    try {
      await adminService.acceptDonationPickup(row.id, pendingNote.trim() || undefined);
      toast({ title: 'Pickup accepted', description: 'User will see the update on their Donations page.' });
      onInvalidate();
      setPendingNote('');
    } catch (e) {
      toast({ title: 'Could not accept', description: errMessage(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    setBusy(true);
    try {
      await adminService.rejectDonationPickup(row.id, pendingNote.trim() || undefined);
      toast({ title: 'Pickup request rejected', description: 'The customer will see this as cancelled on Donations.' });
      onInvalidate();
      setPendingNote('');
    } catch (e) {
      toast({ title: 'Could not reject', description: errMessage(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const doSchedule = async () => {
    if (!pickAt) {
      toast({ title: 'Pick date required', variant: 'destructive' });
      return;
    }
    const iso = pickAt.length === 16 ? `${pickAt}:00` : pickAt;
    setBusy(true);
    try {
      await adminService.scheduleDonationPickup(row.id, iso, scheduleReply.trim() || undefined);
      toast({ title: 'Pick date saved' });
      onInvalidate();
      setScheduleReply('');
    } catch (e) {
      toast({ title: 'Could not schedule', description: errMessage(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const doComplete = async () => {
    setBusy(true);
    try {
      await adminService.completeDonationPickup(row.id, completeReply.trim() || undefined);
      toast({ title: 'Marked completed' });
      onInvalidate();
      setCompleteReply('');
    } catch (e) {
      toast({ title: 'Could not complete', description: errMessage(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

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
      <CardHeader className="space-y-0 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-mono tabular-nums">#{row.id}</span>
            </div>
            <CardTitle className="text-lg font-semibold leading-tight tracking-tight">{centerDisplay}</CardTitle>
          </div>
          <Badge variant="outline" className={cn('shrink-0 border font-semibold', st.badge)}>
            {statusLabel(row.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 text-sm">
        <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/25 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
          <p className="flex min-w-0 items-center gap-2 text-sm">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{row.userName}</span>
          </p>
          <p className="flex min-w-0 items-center gap-2 text-sm">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{row.userEmail}</span>
          </p>
        </div>
        {row.productSummary && (
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background shadow-sm">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Items described</p>
              <p className="text-foreground/90 leading-relaxed mt-0.5">{row.productSummary}</p>
            </div>
          </div>
        )}
        {row.size && (
          <p>
            <span className="text-muted-foreground font-medium">Size: </span>
            {row.size}
          </p>
        )}
        {row.pickupAddress && (
          <div className="flex gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{row.pickupAddress}</span>
          </div>
        )}
        {row.notes && (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground mb-1">User notes</p>
            <p className="text-foreground/90">{row.notes}</p>
          </div>
        )}
        {row.expectedPickAt && (
          <div className="flex items-start gap-3 rounded-xl bg-muted/50 border border-border/60 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm border border-border/50">
              <CalendarClock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Expected pickup</p>
              <p className="text-sm font-semibold tabular-nums">{new Date(row.expectedPickAt).toLocaleString()}</p>
            </div>
          </div>
        )}
        {row.adminReply && (
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Message from us</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{row.adminReply}</p>
          </div>
        )}

        <Separator className="opacity-60" />
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
          Submitted {new Date(row.createdAt).toLocaleString()}
        </p>

        {row.status === 'PENDING' && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 space-y-3">
            <p className="text-sm font-medium text-amber-950 dark:text-amber-100">Accept or reject this pickup</p>
            <div className="space-y-2">
              <Label htmlFor={`accept-reply-${row.id}`}>Message to user (optional)</Label>
              <Textarea
                id={`accept-reply-${row.id}`}
                rows={2}
                value={pendingNote}
                onChange={(e) => setPendingNote(e.target.value)}
                placeholder="Shown on the customer Donations page — e.g. acceptance note or reason if you reject…"
                className="bg-background"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={doAccept} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Accept pickup
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={doReject}
                disabled={busy}
                className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reject request
              </Button>
            </div>
          </div>
        )}

        {row.status === 'REQ_ACCEPTED' && (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] dark:bg-sky-500/[0.08] p-4 space-y-3">
            <p className="text-sm font-medium text-sky-950 dark:text-sky-100">Set expected pickup</p>
            <div className="space-y-2">
              <Label htmlFor={`pick-at-${row.id}`}>Date & time</Label>
              <Input
                id={`pick-at-${row.id}`}
                type="datetime-local"
                value={pickAt}
                onChange={(e) => setPickAt(e.target.value)}
                className="bg-background max-w-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`sched-reply-${row.id}`}>Message to user (optional)</Label>
              <Textarea
                id={`sched-reply-${row.id}`}
                rows={2}
                value={scheduleReply}
                onChange={(e) => setScheduleReply(e.target.value)}
                placeholder="Our team will arrive…"
                className="bg-background"
              />
            </div>
            <Button size="sm" onClick={doSchedule} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save expected pick date
            </Button>
          </div>
        )}

        {row.status === 'EXPECTED_PICK_DATE' && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] dark:bg-violet-500/[0.08] p-4 space-y-3">
            <p className="text-sm font-medium text-violet-950 dark:text-violet-100">Complete pickup</p>
            <div className="space-y-2">
              <Label htmlFor={`done-reply-${row.id}`}>Closing note (optional)</Label>
              <Textarea
                id={`done-reply-${row.id}`}
                rows={2}
                value={completeReply}
                onChange={(e) => setCompleteReply(e.target.value)}
                placeholder="Pickup completed. Thank you!"
                className="bg-background"
              />
            </div>
            <Button size="sm" onClick={doComplete} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Mark completed
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PICKUP_WORKFLOW_STEPS = ['Pending', 'Accepted', 'Pickup scheduled', 'Done'] as const;
const BOX_WORKFLOW_STEPS = ['Pending', 'Approved', 'Delivery set', 'Delivered'] as const;

function BoxRowCard({
  row,
  onInvalidate,
  staggerIndex = 0,
}: {
  row: AdminDonationBoxRow;
  onInvalidate: () => void;
  staggerIndex?: number;
}) {
  const { toast } = useToast();
  const [pendingNote, setPendingNote] = useState('');
  const [deliveryAt, setDeliveryAt] = useState('');
  const [schedReply, setSchedReply] = useState('');
  const [completeReply, setCompleteReply] = useState('');
  const [busy, setBusy] = useState(false);

  const st = boxStatusStyles(row.status);

  const doAccept = async () => {
    setBusy(true);
    try {
      await adminService.acceptDonationBox(row.id, pendingNote.trim() || undefined);
      toast({ title: 'Box request approved', description: 'The customer will see this on Donation box.' });
      onInvalidate();
      setPendingNote('');
    } catch (e) {
      toast({ title: 'Could not approve', description: errMessage(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    setBusy(true);
    try {
      await adminService.rejectDonationBox(row.id, pendingNote.trim() || undefined);
      toast({ title: 'Box request rejected', description: 'The customer will see this as cancelled.' });
      onInvalidate();
      setPendingNote('');
    } catch (e) {
      toast({ title: 'Could not reject', description: errMessage(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const doSchedule = async () => {
    if (!deliveryAt) {
      toast({ title: 'Delivery date required', variant: 'destructive' });
      return;
    }
    const iso = deliveryAt.length === 16 ? `${deliveryAt}:00` : deliveryAt;
    setBusy(true);
    try {
      await adminService.scheduleDonationBox(row.id, iso, schedReply.trim() || undefined);
      toast({ title: 'Expected delivery saved' });
      onInvalidate();
      setSchedReply('');
    } catch (e) {
      toast({ title: 'Could not save delivery', description: errMessage(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const doComplete = async () => {
    setBusy(true);
    try {
      await adminService.completeDonationBox(row.id, completeReply.trim() || undefined);
      toast({ title: 'Marked as delivered' });
      onInvalidate();
      setCompleteReply('');
    } catch (e) {
      toast({ title: 'Could not complete', description: errMessage(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const addressLine = `${row.addressLine1}${row.locality ? `, ${row.locality}` : ''}, ${row.city} — ${row.pincode}`;

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
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Box className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono tabular-nums">#{row.id}</span>
            </div>
            <CardTitle className="text-base font-semibold leading-tight">Empty box request</CardTitle>
          </div>
          <Badge variant="outline" className={cn('shrink-0 border font-semibold', st.badge)}>
            {boxStatusLabel(row.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 text-sm">
        <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/25 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer details</p>
          {row.userName ? (
            <p className="flex min-w-0 items-center gap-2 text-sm">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{row.userName}</span>
            </p>
          ) : null}
          {row.userEmail ? (
            <p className="flex min-w-0 items-center gap-2 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{row.userEmail}</span>
            </p>
          ) : null}
          <p className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{row.phone}</span>
          </p>
          <p className="flex items-start gap-2 text-foreground/90">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{addressLine}</span>
          </p>
        </div>

        <p className="break-all rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 font-mono text-xs text-muted-foreground">
          Drop token: {row.dropToken}
        </p>

        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/50 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background shadow-sm">
            <CalendarClock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Expected delivery</p>
            {row.expectedDeliveryAt ? (
              <p className="text-sm font-semibold tabular-nums">{new Date(row.expectedDeliveryAt).toLocaleString()}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not scheduled yet — set a date after approval.</p>
            )}
          </div>
        </div>

        {row.notes && (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2.5">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Customer notes</p>
            <p className="text-foreground/90">{row.notes}</p>
          </div>
        )}
        {row.adminReply && (
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Message from us</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{row.adminReply}</p>
          </div>
        )}
        <Separator className="opacity-60" />
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
          Submitted {new Date(row.createdAt).toLocaleString()}
        </p>

        {row.status === 'PENDING' && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 space-y-3">
            <p className="text-sm font-medium text-amber-950 dark:text-amber-100">Approve or reject empty box request</p>
            <div className="space-y-2">
              <Label htmlFor={`box-accept-${row.id}`}>Message to customer (optional)</Label>
              <Textarea
                id={`box-accept-${row.id}`}
                rows={2}
                value={pendingNote}
                onChange={(e) => setPendingNote(e.target.value)}
                placeholder="Shown to the customer — approval note or reason if you reject…"
                className="bg-background"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={doAccept} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Approve request
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={doReject}
                disabled={busy}
                className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reject request
              </Button>
            </div>
          </div>
        )}

        {row.status === 'REQ_ACCEPTED' && (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] dark:bg-sky-500/[0.08] p-4 space-y-3">
            <p className="text-sm font-medium text-sky-950 dark:text-sky-100">Set expected delivery</p>
            <div className="space-y-2">
              <Label htmlFor={`box-del-${row.id}`}>Date & time</Label>
              <Input
                id={`box-del-${row.id}`}
                type="datetime-local"
                value={deliveryAt}
                onChange={(e) => setDeliveryAt(e.target.value)}
                className="bg-background max-w-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`box-sched-reply-${row.id}`}>Message to customer (optional)</Label>
              <Textarea
                id={`box-sched-reply-${row.id}`}
                rows={2}
                value={schedReply}
                onChange={(e) => setSchedReply(e.target.value)}
                placeholder="Your box will arrive…"
                className="bg-background"
              />
            </div>
            <Button size="sm" onClick={doSchedule} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save expected delivery
            </Button>
          </div>
        )}

        {row.status === 'EXPECTED_DELIVERY' && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] dark:bg-violet-500/[0.08] p-4 space-y-3">
            <p className="text-sm font-medium text-violet-950 dark:text-violet-100">Confirm box delivered</p>
            <div className="space-y-2">
              <Label htmlFor={`box-done-${row.id}`}>Closing note (optional)</Label>
              <Textarea
                id={`box-done-${row.id}`}
                rows={2}
                value={completeReply}
                onChange={(e) => setCompleteReply(e.target.value)}
                placeholder="Box delivered. Thank you!"
                className="bg-background"
              />
            </div>
            <Button size="sm" onClick={doComplete} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Mark delivered
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PickupsTabPanel({ onInvalidate }: { onInvalidate: () => void }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: donationQueryKeys.adminPickups(),
    queryFn: () => adminService.getDonationPickups(),
    refetchInterval: REFETCH_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 4_000,
  });

  const counts = useMemo(() => {
    return {
      total: rows.length,
      PENDING: rows.filter((r) => r.status === 'PENDING').length,
      REQ_ACCEPTED: rows.filter((r) => r.status === 'REQ_ACCEPTED').length,
      EXPECTED_PICK_DATE: rows.filter((r) => r.status === 'EXPECTED_PICK_DATE').length,
      COMPLETED: rows.filter((r) => r.status === 'COMPLETED').length,
      CANCELLED: rows.filter((r) => r.status === 'CANCELLED').length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  if (isLoading) {
    return (
      <div className="relative flex flex-col items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        Loading pickups…
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.07] via-muted/35 to-muted/15 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-emerald-400/5 to-transparent motion-safe:animate-pulse"
          aria-hidden
        />
        <p className="relative text-sm font-semibold text-foreground">Dress pickup workflow</p>
        <div className="relative mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
          {PICKUP_WORKFLOW_STEPS.map((step, i) => (
            <span key={step} className="inline-flex items-center gap-1.5">
              {i > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 opacity-40 motion-safe:transition-transform motion-safe:duration-300" />
              ) : null}
              <span className="rounded-full border border-border/70 bg-background/95 px-2.5 py-1 font-medium text-foreground/90 shadow-sm ring-1 ring-emerald-500/10 transition-all duration-300 hover:shadow-md hover:ring-emerald-500/30">
                {step}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatChip label="Total" value={counts.total} staggerIndex={0} />
        <StatChip
          label="Pending"
          value={counts.PENDING}
          staggerIndex={1}
          className="border-amber-500/25 bg-amber-500/[0.06]"
        />
        <StatChip
          label="Accepted"
          value={counts.REQ_ACCEPTED}
          staggerIndex={2}
          className="border-sky-500/25 bg-sky-500/[0.06]"
        />
        <StatChip
          label="Scheduled"
          value={counts.EXPECTED_PICK_DATE}
          staggerIndex={3}
          className="border-violet-500/25 bg-violet-500/[0.06]"
        />
        <StatChip
          label="Done"
          value={counts.COMPLETED}
          staggerIndex={4}
          className="border-emerald-500/25 bg-emerald-500/[0.06]"
        />
        <StatChip
          label="Rejected"
          value={counts.CANCELLED}
          staggerIndex={5}
          className="border-red-500/25 bg-red-500/[0.06]"
        />
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-b from-muted/50 via-muted/20 to-background p-5 shadow-md md:p-7">
        <div
          className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl motion-safe:animate-body-zone-float"
          aria-hidden
        />
        <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Pickup requests</h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length === rows.length ? `${rows.length} total` : `Showing ${filtered.length} of ${rows.length}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && !isLoading ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Syncing…
              </span>
            ) : null}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full bg-background sm:w-[200px]">
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

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-500/25 bg-muted/20 px-6 py-14 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-2 ring-emerald-500/20 motion-safe:animate-pulse">
              <Inbox className="h-7 w-7 text-emerald-600/70" />
            </div>
            <p className="text-sm font-medium">No pickup requests yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Customers submit these from the storefront Donations page.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No requests match this filter.</p>
        ) : (
          <ul className="space-y-4">
            {filtered.map((r, idx) => (
              <li key={r.id}>
                <PickupRowCard row={r} onInvalidate={onInvalidate} staggerIndex={idx} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BoxesTabPanel({ onInvalidate }: { onInvalidate: () => void }) {
  const [statusFilter, setStatusFilter] = useState<BoxStatusFilter>('ALL');
  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: donationQueryKeys.adminBoxes(),
    queryFn: () => adminService.getDonationBoxes(),
    refetchInterval: REFETCH_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 4_000,
  });

  const counts = useMemo(() => {
    return {
      total: rows.length,
      PENDING: rows.filter((r) => r.status === 'PENDING').length,
      REQ_ACCEPTED: rows.filter((r) => r.status === 'REQ_ACCEPTED').length,
      EXPECTED_DELIVERY: rows.filter((r) => r.status === 'EXPECTED_DELIVERY').length,
      COMPLETED: rows.filter((r) => r.status === 'COMPLETED').length,
      CANCELLED: rows.filter((r) => r.status === 'CANCELLED').length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  if (isLoading) {
    return (
      <div className="relative flex flex-col items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
        Loading box requests…
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.08] via-muted/35 to-muted/15 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-violet-400/8 to-transparent motion-safe:animate-pulse"
          aria-hidden
        />
        <p className="relative text-sm font-semibold text-foreground">Empty box workflow</p>
        <div className="relative mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
          {BOX_WORKFLOW_STEPS.map((step, i) => (
            <span key={step} className="inline-flex items-center gap-1.5">
              {i > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 opacity-40 motion-safe:transition-transform motion-safe:duration-300" />
              ) : null}
              <span className="rounded-full border border-border/70 bg-background/95 px-2.5 py-1 font-medium text-foreground/90 shadow-sm ring-1 ring-violet-500/10 transition-all duration-300 hover:shadow-md hover:ring-violet-500/30">
                {step}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatChip label="Total" value={counts.total} staggerIndex={0} />
        <StatChip
          label="Pending"
          value={counts.PENDING}
          staggerIndex={1}
          className="border-amber-500/25 bg-amber-500/[0.06]"
        />
        <StatChip
          label="Approved"
          value={counts.REQ_ACCEPTED}
          staggerIndex={2}
          className="border-sky-500/25 bg-sky-500/[0.06]"
        />
        <StatChip
          label="Scheduled"
          value={counts.EXPECTED_DELIVERY}
          staggerIndex={3}
          className="border-violet-500/25 bg-violet-500/[0.06]"
        />
        <StatChip
          label="Delivered"
          value={counts.COMPLETED}
          staggerIndex={4}
          className="border-emerald-500/25 bg-emerald-500/[0.06]"
        />
        <StatChip
          label="Rejected"
          value={counts.CANCELLED}
          staggerIndex={5}
          className="border-red-500/25 bg-red-500/[0.06]"
        />
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-violet-500/15 bg-gradient-to-b from-violet-500/[0.08] via-muted/25 to-background p-5 shadow-md md:p-7">
        <div
          className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl motion-safe:animate-body-zone-float [animation-delay:-3s]"
          aria-hidden
        />
        <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Box requests</h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length === rows.length ? `${rows.length} total` : `Showing ${filtered.length} of ${rows.length}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && !isLoading ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Syncing…
              </span>
            ) : null}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BoxStatusFilter)}>
              <SelectTrigger className="w-full bg-background sm:w-[200px]">
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

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-violet-500/25 bg-muted/20 px-6 py-14 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-2 ring-violet-500/20 motion-safe:animate-pulse">
              <Box className="h-7 w-7 text-violet-600/70 dark:text-violet-300/70" />
            </div>
            <p className="text-sm font-medium">No box requests yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Customers book from the storefront Donations → Empty boxes tab.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No requests match this filter.</p>
        ) : (
          <ul className="space-y-4">
            {filtered.map((r, idx) => (
              <li key={r.id}>
                <BoxRowCard row={r} onInvalidate={onInvalidate} staggerIndex={idx} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const AdminDonations = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('pickups');

  const invalidateDonationQueries = () => {
    queryClient.invalidateQueries({ queryKey: donationQueryKeys.root });
  };

  const { data: pendingSummary } = useQuery({
    queryKey: donationQueryKeys.adminPendingSummary(),
    queryFn: () => adminService.getDonationPendingSummary(),
    refetchInterval: REFETCH_MS,
    staleTime: 4_000,
  });

  const pickupPending = pendingSummary?.pickupsPending ?? 0;
  const boxPending = pendingSummary?.boxesPending ?? 0;

  return (
    <div className={donationsAmbientPageClass}>
      <DonationsPageBackdrop />
      <div className={donationsPageContentClass}>
        <nav className="text-sm text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 transition-colors hover:text-emerald-700 dark:hover:text-emerald-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="font-medium text-foreground">Donations (admin)</span>
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
                    admin console
                  </span>
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Same flows shoppers see on Donations — approve pickups, schedule dates, and ship empty boxes. Updates appear on
                  their account in real time.
                </p>
                {(pickupPending > 0 || boxPending > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {pickupPending > 0 ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-950 dark:text-amber-100">
                        <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 motion-safe:animate-pulse" />
                        {pickupPending} pickup{pickupPending === 1 ? '' : 's'} need action
                      </span>
                    ) : null}
                    {boxPending > 0 ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-950 dark:text-amber-100">
                        <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 motion-safe:animate-pulse" />
                        {boxPending} box{boxPending === 1 ? '' : 'es'} need approval
                      </span>
                    ) : null}
                  </div>
                )}
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
                {pickupPending > 0 ? (
                  <span className="ml-0.5 rounded-full bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-900 dark:text-amber-100">
                    {pickupPending > 99 ? '99+' : pickupPending}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="boxes"
                className="gap-2 rounded-xl py-3 text-muted-foreground transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-violet-500/10 data-[state=active]:ring-2 data-[state=active]:ring-violet-500/25 dark:text-white/70 dark:data-[state=active]:bg-white/15 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-violet-500/20 dark:data-[state=active]:ring-violet-300/40"
              >
                <Box className="h-4 w-4 shrink-0 text-violet-600 data-[state=active]:text-violet-700 dark:text-violet-300 dark:data-[state=active]:text-violet-200" />
                Empty boxes
                {boxPending > 0 ? (
                  <span className="ml-0.5 rounded-full bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-900 dark:text-amber-100">
                    {boxPending > 99 ? '99+' : boxPending}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pickups" className="mt-0 space-y-6 outline-none">
              <PickupsTabPanel onInvalidate={invalidateDonationQueries} />
            </TabsContent>
            <TabsContent value="boxes" className="mt-0 space-y-6 outline-none">
              <BoxesTabPanel onInvalidate={invalidateDonationQueries} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDonations;
