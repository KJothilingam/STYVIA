import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import adminService, {
  type AdminOrderSummary,
  type DashboardStats,
} from '@/services/adminService';
import { Package, ShoppingCart, Users, IndianRupee, ArrowRight, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

function buildSevenDaySeries(orders: AdminOrderSummary[]) {
  const today = new Date();
  const days: { key: string; label: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const key = format(d, 'yyyy-MM-dd');
    days.push({ key, label: format(d, 'EEE d'), revenue: 0, orders: 0 });
  }
  const map = new Map(days.map((x) => [x.key, x]));
  for (const o of orders) {
    if (!o.createdAt) continue;
    const key = o.createdAt.slice(0, 10);
    const row = map.get(key);
    if (row) {
      row.revenue += Number(o.totalAmount);
      row.orders += 1;
    }
  }
  return days;
}

const revenueChartConfig = {
  revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

const ordersBarConfig = {
  orders: { label: 'Orders', color: 'hsl(187 70% 42%)' },
} satisfies ChartConfig;

const STATUS_BADGE: Record<string, string> = {
  PLACED: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300',
  DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  RETURNED: 'bg-muted text-muted-foreground',
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ');
}

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(187 70% 42%)',
  'hsl(262 45% 48%)',
  'hsl(45 93% 48%)',
  'hsl(145 63% 42%)',
  'hsl(0 84% 60%)',
];

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [s, page] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getAllOrders(undefined, 0, 120),
        ]);
        if (!cancelled) {
          setStats(s);
          setOrders(page.content ?? []);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setStats(null);
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const series7d = useMemo(() => buildSevenDaySeries(orders), [orders]);

  const statusPieData = useMemo(() => {
    if (!stats) return [];
    const rows = [
      { name: 'placed', label: 'Placed', value: stats.pendingOrders },
      { name: 'confirmed', label: 'Confirmed', value: stats.confirmedOrders },
      { name: 'shipped', label: 'Shipped', value: stats.shippedOrders },
      { name: 'delivered', label: 'Delivered', value: stats.deliveredOrders },
      { name: 'cancelled', label: 'Cancelled', value: stats.cancelledOrders },
    ].filter((r) => r.value > 0);
    return rows;
  }, [stats]);

  const pieConfig = useMemo(() => {
    const c: ChartConfig = {};
    statusPieData.forEach((row, i) => {
      c[row.name] = { label: row.label, color: PIE_COLORS[i % PIE_COLORS.length] };
    });
    return c;
  }, [statusPieData]);

  const recentOrders = useMemo(() => orders.slice(0, 10), [orders]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-muted animate-pulse rounded-xl" />
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Could not load dashboard. Check your connection and admin access.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Orders, revenue, catalog, and customers at a glance.</p>
      </div>

      {/* KPI row — Orders, Revenue, Users, Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          accent="bg-[hsl(var(--primary))]"
        />
        <MetricCard
          title="Revenue"
          value={formatInr(stats.totalRevenue)}
          icon={IndianRupee}
          accent="bg-emerald-500"
        />
        <MetricCard
          title="Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          accent="bg-[hsl(262_45%_48%)]"
        />
        <MetricCard
          title="Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          accent="bg-[hsl(45_93%_48%)]"
        />
      </div>

      {(() => {
        const p = stats.pendingDonationPickups ?? 0;
        const b = stats.pendingDonationBoxes ?? 0;
        const total = p + b;
        if (total <= 0) return null;
        const parts: string[] = [];
        if (p > 0) parts.push(`${p} pickup${p === 1 ? '' : 's'}`);
        if (b > 0) parts.push(`${b} empty box${b === 1 ? '' : 'es'}`);
        return (
          <Card className="border-amber-200 bg-amber-50/90 dark:bg-amber-950/25 dark:border-amber-900 shadow-sm">
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-200">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-amber-950 dark:text-amber-100">
                    {parts.join(' · ')} pending admin review
                  </p>
                  <p className="text-sm text-amber-900/80 dark:text-amber-200/80 mt-0.5">
                    Use the Donations admin page — Pickups and Empty boxes tabs — to approve, schedule, and complete.
                  </p>
                </div>
              </div>
              <Button variant="default" className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white" asChild>
                <Link to="/admin/donations" className="gap-2">
                  Review donations
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })()}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Revenue</CardTitle>
            <CardDescription>Last 7 days from recent orders</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 pr-2 pt-0">
            <ChartContainer config={revenueChartConfig} className="h-[280px] w-full aspect-auto">
              <AreaChart data={series7d} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                  width={48}
                />
                <ChartTooltip
                  cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono tabular-nums">{formatInr(Number(value))}</span>
                      )}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#fillRevenue)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Orders by status</CardTitle>
            <CardDescription>Share of all orders</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-0">
            {statusPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16">No order data yet.</p>
            ) : (
              <ChartContainer config={pieConfig} className="h-[260px] w-full max-w-[280px] aspect-square mx-auto">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={2}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Order volume</CardTitle>
          <CardDescription>Count per day (last 7 days)</CardDescription>
        </CardHeader>
        <CardContent className="pl-0 pr-2">
          <ChartContainer config={ordersBarConfig} className="h-[200px] w-full aspect-auto">
            <BarChart data={series7d} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="orders" fill="var(--color-orders)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Recent orders</CardTitle>
            <CardDescription>Newest first</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/orders" className="gap-1">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 sm:px-0">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="w-[120px]">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Payment</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="border-border/60">
                      <TableCell className="font-mono text-xs sm:text-sm">{order.orderNumber}</TableCell>
                      <TableCell className="max-w-[180px]">
                        <span className="truncate block font-medium">
                          {order.address?.name || '—'}
                        </span>
                        {order.items?.[0]?.productName && (
                          <span className="text-xs text-muted-foreground truncate block">
                            {order.items[0].productName}
                            {(order.items?.length ?? 0) > 1 ? ` +${(order.items?.length ?? 1) - 1}` : ''}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatInr(Number(order.totalAmount))}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                            STATUS_BADGE[order.orderStatus] ?? 'bg-muted text-muted-foreground',
                          )}
                        >
                          {statusLabel(order.orderStatus)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {statusLabel(order.paymentStatus)} · {order.paymentMethod}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        {order.createdAt
                          ? format(new Date(order.createdAt), 'MMM d, yyyy')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function MetricCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/80 shadow-sm">
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', accent)} aria-hidden />
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight mt-1 tabular-nums">{value}</p>
          </div>
          <Icon className="h-10 w-10 text-muted-foreground/15 shrink-0" strokeWidth={1.25} />
        </div>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
