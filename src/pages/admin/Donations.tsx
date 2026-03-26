import { useMemo, useState } from 'react';
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
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-background/80 px-4 py-3 shadow-sm',
        className
      )}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function PickupRowCard({ row, onInvalidate }: { row: AdminDonationPickupRow; onInvalidate: () => void }) {
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
      className={cn(
        'overflow-hidden border-border/80 shadow-sm transition-all duration-200 hover:shadow-md',
        'border-l-4',
        st.border
      )}
    >
      <CardHeader className="pb-3 space-y-0 bg-muted/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono tabular-nums">Request #{row.id}</span>
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight leading-tight">{centerDisplay}</CardTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{row.userName}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 min-w-0 text-xs sm:text-sm">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{row.userEmail}</span>
              </span>
            </div>
          </div>
          <Badge variant="outline" className={cn('shrink-0 font-semibold border', st.badge)}>
            {statusLabel(row.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm pt-5">
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
            <div className="flex items-center gap-2 text-primary mb-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Reply thread (user-visible)</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{row.adminReply}</p>
          </div>
        )}

        <Separator className="opacity-50" />
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

const PICKUP_WORKFLOW_STEPS = ['Pending', 'Accepted', 'Scheduled', 'Done'] as const;
const BOX_WORKFLOW_STEPS = ['Pending', 'Approved', 'Delivery set', 'Delivered'] as const;

function BoxRowCard({ row, onInvalidate }: { row: AdminDonationBoxRow; onInvalidate: () => void }) {
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

  return (
    <Card
      className={cn(
        'overflow-hidden border-border/80 shadow-sm transition-all duration-200 hover:shadow-md',
        'border-l-4',
        st.border
      )}
    >
      <CardHeader className="pb-3 space-y-0 bg-muted/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
              <Box className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono tabular-nums">Box #{row.id}</span>
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight leading-tight">
              {row.addressLine1}
              {row.locality ? `, ${row.locality}` : ''} · {row.city} {row.pincode}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{row.userName}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 min-w-0 text-xs sm:text-sm">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{row.userEmail}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {row.phone}
              </span>
            </div>
          </div>
          <Badge variant="outline" className={cn('shrink-0 font-semibold border', st.badge)}>
            {boxStatusLabel(row.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm pt-5">
        <p className="text-xs font-mono break-all text-muted-foreground bg-muted/40 rounded-md px-2 py-1.5 border border-border/50">
          Drop token: {row.dropToken}
        </p>
        {row.notes && (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Customer notes</p>
            <p className="text-foreground/90">{row.notes}</p>
          </div>
        )}
        {row.expectedDeliveryAt && (
          <div className="flex items-start gap-3 rounded-xl bg-muted/50 border border-border/60 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm border border-border/50">
              <CalendarClock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Expected delivery</p>
              <p className="text-sm font-semibold tabular-nums">{new Date(row.expectedDeliveryAt).toLocaleString()}</p>
            </div>
          </div>
        )}
        {row.adminReply && (
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Reply thread (customer-visible)</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{row.adminReply}</p>
          </div>
        )}
        <Separator className="opacity-50" />
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
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading pickups…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Dress pickup workflow</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {PICKUP_WORKFLOW_STEPS.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-1.5">
                {i > 0 ? <ChevronRight className="h-3 w-3 opacity-50" /> : null}
                <span className="rounded-full bg-background border px-2 py-0.5">{step}</span>
              </span>
            ))}
          </div>
        </div>
        {isFetching && !isLoading ? (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground rounded-full border bg-background/80 px-3 py-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Syncing…
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatChip label="Total" value={counts.total} />
        <StatChip label="Pending" value={counts.PENDING} className="border-amber-500/20 bg-amber-500/[0.04]" />
        <StatChip label="Accepted" value={counts.REQ_ACCEPTED} className="border-sky-500/20 bg-sky-500/[0.04]" />
        <StatChip label="Scheduled" value={counts.EXPECTED_PICK_DATE} className="border-violet-500/20 bg-violet-500/[0.04]" />
        <StatChip label="Completed" value={counts.COMPLETED} className="border-emerald-500/20 bg-emerald-500/[0.04]" />
        <StatChip label="Rejected" value={counts.CANCELLED} className="border-border bg-muted/40" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Pickup requests</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length === rows.length ? `${rows.length} total` : `Showing ${filtered.length} of ${rows.length}`}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[220px] bg-background">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REQ_ACCEPTED">Request accepted</SelectItem>
            <SelectItem value="EXPECTED_PICK_DATE">Pickup scheduled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-8 py-16 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="font-medium text-foreground">No pickup requests yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Customers submit these from the Dress donation page.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-8 py-12 text-center text-sm text-muted-foreground">
          No requests match this filter.
        </div>
      ) : (
        <ul className="space-y-5">
          {filtered.map((r) => (
            <li key={r.id}>
              <PickupRowCard row={r} onInvalidate={onInvalidate} />
            </li>
          ))}
        </ul>
      )}
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
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading box requests…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Empty box workflow</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {BOX_WORKFLOW_STEPS.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-1.5">
                {i > 0 ? <ChevronRight className="h-3 w-3 opacity-50" /> : null}
                <span className="rounded-full bg-background border px-2 py-0.5">{step}</span>
              </span>
            ))}
          </div>
        </div>
        {isFetching && !isLoading ? (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground rounded-full border bg-background/80 px-3 py-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Syncing…
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatChip label="Total" value={counts.total} />
        <StatChip label="Pending" value={counts.PENDING} className="border-amber-500/20 bg-amber-500/[0.04]" />
        <StatChip label="Approved" value={counts.REQ_ACCEPTED} className="border-sky-500/20 bg-sky-500/[0.04]" />
        <StatChip label="Scheduled" value={counts.EXPECTED_DELIVERY} className="border-violet-500/20 bg-violet-500/[0.04]" />
        <StatChip label="Delivered" value={counts.COMPLETED} className="border-emerald-500/20 bg-emerald-500/[0.04]" />
        <StatChip label="Rejected" value={counts.CANCELLED} className="border-border bg-muted/40" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Box requests</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length === rows.length ? `${rows.length} total` : `Showing ${filtered.length} of ${rows.length}`}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BoxStatusFilter)}>
          <SelectTrigger className="w-full sm:w-[220px] bg-background">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REQ_ACCEPTED">Approved</SelectItem>
            <SelectItem value="EXPECTED_DELIVERY">Delivery scheduled</SelectItem>
            <SelectItem value="COMPLETED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-8 py-16 text-center">
          <Box className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="font-medium text-foreground">No box requests yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Customers book from the Donation box page.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-8 py-12 text-center text-sm text-muted-foreground">
          No requests match this filter.
        </div>
      ) : (
        <ul className="space-y-5">
          {filtered.map((r) => (
            <li key={r.id}>
              <BoxRowCard row={r} onInvalidate={onInvalidate} />
            </li>
          ))}
        </ul>
      )}
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
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-12">
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-primary/[0.07] via-background to-violet-500/[0.05] p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
            <HeartHandshake className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Donations</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-2xl leading-relaxed">
              Manage dress pickups and empty-box shipments. Customers see updates on their Donations and Donation box pages — no
              refresh needed.
            </p>
            {(pickupPending > 0 || boxPending > 0) && (
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mt-3 inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                {pickupPending > 0 ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    {pickupPending} pickup{pickupPending === 1 ? '' : 's'} awaiting action
                  </span>
                ) : null}
                {boxPending > 0 ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    {boxPending} box{boxPending === 1 ? '' : 'es'} awaiting approval
                  </span>
                ) : null}
              </p>
            )}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-auto p-1">
          <TabsTrigger value="pickups" className="gap-2 py-2.5">
            <Package className="h-4 w-4 shrink-0" />
            Pickups
            {pickupPending > 0 ? (
              <span className="ml-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-100 px-2 py-0.5 text-xs font-bold tabular-nums">
                {pickupPending > 99 ? '99+' : pickupPending}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="boxes" className="gap-2 py-2.5">
            <Box className="h-4 w-4 shrink-0" />
            Empty boxes
            {boxPending > 0 ? (
              <span className="ml-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-100 px-2 py-0.5 text-xs font-bold tabular-nums">
                {boxPending > 99 ? '99+' : boxPending}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pickups" className="mt-0 outline-none">
          <PickupsTabPanel onInvalidate={invalidateDonationQueries} />
        </TabsContent>
        <TabsContent value="boxes" className="mt-0 outline-none">
          <BoxesTabPanel onInvalidate={invalidateDonationQueries} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDonations;
