import { useState } from 'react';
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
  Package,
  RefreshCw,
  ShoppingBag,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    setUpdatingId(orderId);
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      toast({ title: 'Order status updated' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setDetailOrder((o) =>
        o?.id === orderId ? { ...o, orderStatus: newStatus } : o
      );
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
    <div className="min-h-full bg-gradient-to-b from-slate-50/90 to-background dark:from-slate-950/40">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <ShoppingBag className="h-8 w-8 opacity-90" />
              <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
            </div>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
              Review fulfillment, update shipment status, and open any order for line items and delivery details.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={onFilterChange}>
              <SelectTrigger className="w-[200px] rounded-xl border-border/80 bg-background/80 shadow-sm">
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
              className="rounded-xl shrink-0"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh orders"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription>Matching orders</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totalElements}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm sm:col-span-2">
            <CardHeader className="pb-2">
              <CardDescription>Page</CardDescription>
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
          <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
            <CardContent className="py-10 text-center text-sm text-destructive">
              Failed to load orders. Check your connection and try refresh.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-2xl border-border/60 shadow-md">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="w-[120px]">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[180px]">Update status</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && !data ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
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
                        className="border-border/50 cursor-pointer transition-colors hover:bg-muted/40"
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
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                              paymentBadgeClass(order.paymentStatus)
                            )}
                          >
                            {order.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={order.orderStatus}
                            onValueChange={(v) => handleStatusChange(order.id, v)}
                            disabled={updatingId === order.id}
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
              <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-muted-foreground text-sm">
                  Showing {orders.length} of {totalElements} orders
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
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
                    className="rounded-lg"
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
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
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
                  <Badge variant="secondary" className="rounded-full">
                    {formatPaymentMethod(detailOrder.paymentMethod)}
                  </Badge>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      paymentBadgeClass(detailOrder.paymentStatus)
                    )}
                  >
                    {detailOrder.paymentStatus}
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
                        className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm"
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
