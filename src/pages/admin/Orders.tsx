import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import adminService, { type AdminOrderSummary } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { adminQueryKeys } from '@/lib/adminQueryKeys';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  adminContentClass,
  adminGlassCard,
  adminPageShell,
  AdminStudioBackdrop,
} from '@/components/layout/AdminStudioChrome';

const PAGE_SIZE = 12;

const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const;

type AdminOrderStatus = (typeof ORDER_STATUSES)[number];

/** Radix Select value must match a SelectItem; normalize API strings (spaces, case). */
function normalizeAdminOrderStatus(s: string | undefined | null): AdminOrderStatus {
  const u = String(s ?? 'PLACED')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '_');
  return (ORDER_STATUSES as readonly string[]).includes(u) ? (u as AdminOrderStatus) : 'PLACED';
}

function orderStatusStyles(status: string) {
  const map: Record<string, string> = {
    PLACED: 'bg-amber-500/15 text-amber-900 border-amber-500/25 dark:text-amber-100',
    CONFIRMED: 'bg-sky-500/15 text-sky-900 border-sky-500/25 dark:text-sky-100',
    SHIPPED: 'bg-violet-500/15 text-violet-900 border-violet-500/25 dark:text-violet-100',
    OUT_FOR_DELIVERY: 'bg-indigo-500/15 text-indigo-900 border-indigo-500/25 dark:text-indigo-100',
    DELIVERED: 'bg-emerald-500/15 text-emerald-900 border-emerald-500/25 dark:text-emerald-100',
    CANCELLED: 'bg-muted text-muted-foreground border-border',
    RETURNED: 'bg-zinc-500/15 text-zinc-900 border-zinc-500/25 dark:text-zinc-100',
  };
  return map[status] ?? 'bg-muted text-muted-foreground border-border';
}

function paymentBadgeClass(paymentStatus: string) {
  if (paymentStatus === 'SUCCESS') return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200';
  if (paymentStatus === 'FAILED' || paymentStatus === 'REFUNDED')
    return 'bg-destructive/10 text-destructive';
  return 'bg-amber-500/10 text-amber-900 dark:text-amber-100';
}

function formatPaymentMethod(m: string) {
  return m.replace(/_/g, ' ');
}

/** Short labels for the payment mode column (UPI, Card, COD, …). */
function formatPaymentMode(m: string | undefined | null) {
  if (m == null || !String(m).trim()) return '—';
  const u = String(m).toUpperCase().trim().replace(/\s+/g, '_');
  const map: Record<string, string> = {
    COD: 'COD',
    UPI: 'UPI',
    CARD: 'Card',
    NET_BANKING: 'Net banking',
  };
  return map[u] ?? formatPaymentMethod(m);
}

/** Aligns with backend: SUCCESS shown as Paid (online paid at checkout; COD paid on delivery). */
function paymentStatusLabel(s: string | undefined | null) {
  const u = (s ?? '').toUpperCase();
  if (u === 'SUCCESS') return 'Paid';
  if (u === 'PENDING') return 'Pending';
  if (u === 'FAILED') return 'Failed';
  if (u === 'REFUNDED') return 'Refunded';
  return s || '—';
}

function paymentModeBadgeClass(method: string | undefined | null) {
  const u = (method ?? '').toUpperCase();
  if (u === 'COD') return 'bg-amber-500/12 text-amber-900 border-amber-500/25 dark:text-amber-100';
  if (u === 'UPI' || u === 'CARD' || u === 'NET_BANKING')
    return 'bg-sky-500/12 text-sky-900 border-sky-500/25 dark:text-sky-100';
  return 'bg-muted text-muted-foreground border-border';
}

function money(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const AdminOrders = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [detailOrder, setDetailOrder] = useState<AdminOrderSummary | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: adminQueryKeys.orders(statusFilter, page, PAGE_SIZE),
    queryFn: () => adminService.getAllOrders(statusFilter, page, PAGE_SIZE),
    placeholderData: (prev) => prev,
  });

  const orders = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (!Number.isFinite(orderId) || orderId <= 0) {
      toast({
        title: 'Invalid order id',
        description: 'Refresh the page and try again.',
        variant: 'destructive',
      });
      return;
    }
    setUpdatingId(orderId);
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      toast({ title: 'Order status updated' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setDetailOrder((o) => {
        if (o?.id !== orderId) return o;
        const next: AdminOrderSummary = { ...o, orderStatus: newStatus };
        const isCod = (o.paymentMethod ?? '').toUpperCase() === 'COD';
        if (newStatus === 'DELIVERED' && isCod) {
          next.paymentStatus = 'SUCCESS';
        }
        return next;
      });
    } catch {
      toast({ title: 'Could not update status', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const onFilterChange = (v: string) => {
    setStatusFilter(v);
    setPage(0);
  };

  return (
    <div className={adminPageShell}>
      <AdminStudioBackdrop />
      <div className={cn(adminContentClass, 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500')}>
        <nav className="text-xs text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 rounded-full px-0.5 py-0.5 transition-colors hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="font-medium text-foreground">Orders</span>
        </nav>

        <div
          className={cn(
            adminGlassCard,
            'relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7 motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500',
          )}
          style={{ animationFillMode: 'both' }}
        >
          <div
            className="pointer-events-none absolute inset-x-8 top-3 h-px rounded-full bg-[length:200%_100%] bg-gradient-to-r from-transparent via-indigo-400/38 to-transparent opacity-90 motion-safe:animate-wardrobe-rail-shine dark:via-indigo-400/28"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-cyan-500/[0.05]" aria-hidden />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-200/60 dark:ring-white/12 motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:scale-[1.02]">
                <ShoppingBag className="h-8 w-8" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200/90 bg-indigo-100/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-100">
                  <span>Fulfillment</span>
                  <Sparkles className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-200/80" />
                </div>
                <h1 className="font-display-hero text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  <span className="text-foreground">Order </span>
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-indigo-300 dark:via-violet-300 dark:to-cyan-300">
                    operations
                  </span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Review fulfillment, update shipment status, and open any row for line items and delivery details.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={onFilterChange}>
                <SelectTrigger className="h-10 w-full min-w-[200px] rounded-xl border-border/70 bg-background/90 shadow-sm backdrop-blur-sm sm:w-[220px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl border-border/70 bg-background/80 shadow-sm backdrop-blur-sm"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Refresh orders"
              >
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className={cn(adminGlassCard, 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg')}>
            <CardHeader className="pb-2 pt-5">
              <CardDescription>Matching orders</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totalElements}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={cn(
              adminGlassCard,
              'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:col-span-2',
            )}
          >
            <CardHeader className="pb-2 pt-5">
              <CardDescription>Pagination</CardDescription>
              <CardTitle className="text-lg font-medium text-muted-foreground">
                {totalPages === 0 ? (
                  '—'
                ) : (
                  <>
                    {page + 1} <span className="text-muted-foreground/70">of</span> {totalPages}
                  </>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {error ? (
          <Card
            className={cn(
              adminGlassCard,
              'border-destructive/35 bg-destructive/[0.06] dark:bg-destructive/[0.08]',
            )}
          >
            <CardContent className="py-12 text-center text-sm text-destructive">
              Failed to load orders. Check your connection and use refresh.
            </CardContent>
          </Card>
        ) : (
          <Card className={cn(adminGlassCard, 'overflow-hidden p-0 shadow-md')}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="w-[120px]">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Order status</TableHead>
                    <TableHead className="whitespace-nowrap">Payment mode</TableHead>
                    <TableHead className="whitespace-nowrap">Payment status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[180px]">Update status</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && !data ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2 py-6">
                          <Package className="h-10 w-10 opacity-40" />
                          <span>No orders for this filter.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer border-border/50 transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-500/10"
                        onClick={() => setDetailOrder(order)}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">
                              {order.customerName || order.address?.name || '—'}
                            </span>
                            {order.customerEmail ? (
                              <span className="text-muted-foreground text-xs">{order.customerEmail}</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {money(order.totalAmount)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant="outline"
                            className={cn('rounded-full border font-normal', orderStatusStyles(order.orderStatus))}
                          >
                            {order.orderStatus.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant="outline"
                            className={cn('rounded-full border text-xs font-medium', paymentModeBadgeClass(order.paymentMethod))}
                          >
                            {formatPaymentMode(order.paymentMethod)}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                              paymentBadgeClass(order.paymentStatus),
                            )}
                          >
                            {paymentStatusLabel(order.paymentStatus)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={normalizeAdminOrderStatus(order.orderStatus)}
                            onValueChange={(v) => handleStatusChange(Number(order.id), v)}
                            disabled={updatingId === Number(order.id)}
                          >
                            <SelectTrigger className="h-9 rounded-lg text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-primary"
                            onClick={() => setDetailOrder(order)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/25 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between dark:bg-muted/15">
                <p className="text-sm text-muted-foreground">
                  Showing {orders.length} of {totalElements} orders
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border/70"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border/70"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        )}
      </div>

      <Sheet open={!!detailOrder} onOpenChange={(o) => !o && setDetailOrder(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto border-l border-border/60 bg-background/95 backdrop-blur-xl sm:max-w-lg">
          {detailOrder ? (
            <>
              <SheetHeader className="space-y-1 border-b border-border/60 pb-4 text-left">
                <SheetTitle className="font-mono text-lg">{detailOrder.orderNumber}</SheetTitle>
                <SheetDescription>
                  Placed {new Date(detailOrder.createdAt).toLocaleString()}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-6 py-6">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={cn('rounded-full border', orderStatusStyles(detailOrder.orderStatus))}
                  >
                    {detailOrder.orderStatus.replace(/_/g, ' ')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn('rounded-full border text-xs font-medium', paymentModeBadgeClass(detailOrder.paymentMethod))}
                  >
                    {formatPaymentMode(detailOrder.paymentMethod)}
                  </Badge>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      paymentBadgeClass(detailOrder.paymentStatus),
                    )}
                  >
                    {paymentStatusLabel(detailOrder.paymentStatus)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                    <User className="h-3.5 w-3.5" />
                    Customer
                  </div>
                  <p className="font-medium">{detailOrder.customerName || detailOrder.address?.name || '—'}</p>
                  {detailOrder.customerEmail ? (
                    <p className="text-muted-foreground text-sm">{detailOrder.customerEmail}</p>
                  ) : null}
                  {detailOrder.address?.phone ? (
                    <p className="text-muted-foreground text-sm">{detailOrder.address.phone}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Ship to
                  </div>
                  <p className="text-sm leading-relaxed">
                    {[detailOrder.address?.addressLine1, detailOrder.address?.locality, detailOrder.address?.city]
                      .filter(Boolean)
                      .join(', ')}
                    <br />
                    {[detailOrder.address?.state, detailOrder.address?.pincode].filter(Boolean).join(' ')}
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
                    Line items
                  </div>
                  <ul className="space-y-3">
                    {(detailOrder.items ?? []).map((line) => (
                      <li
                        key={line.id ?? `${line.productName}-${line.size}`}
                        className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5 text-sm backdrop-blur-sm dark:bg-muted/15"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">{line.productName}</span>
                          <span className="text-muted-foreground shrink-0">×{line.quantity}</span>
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          {[line.productBrand, line.size, line.color].filter(Boolean).join(' · ')}
                        </div>
                        {line.subtotal != null ? (
                          <div className="mt-1 text-xs font-medium tabular-nums">{money(line.subtotal)}</div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{money(detailOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="tabular-nums">{money(detailOrder.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="tabular-nums">{money(detailOrder.discount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{money(detailOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminOrders;
