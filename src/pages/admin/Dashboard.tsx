import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  eachWeekOfInterval,
  endOfWeek,
  format,
  isBefore,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns';
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
import {
  Package,
  ShoppingCart,
  Users,
  IndianRupee,
  ArrowRight,
  HeartHandshake,
  PieChart as PieChartIcon,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  adminContentClass,
  adminGlassCard,
  adminPageShell,
  AdminStudioBackdrop,
} from '@/components/layout/AdminStudioChrome';

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

/** Illustrative weekly totals for completed weeks (~6 months back). Current week uses API orders only. */
const DEMO_WEEKLY_REVENUE: number[] = [
  11800, 13250, 14100, 12800, 15600, 14900, 16750, 17200, 15900, 18400, 17800, 19200, 18650, 20100,
  19500, 20800, 21400, 19900, 22300, 21800, 23100, 22600, 23900, 24200, 25100, 24800,
];

const DEMO_WEEKLY_ORDERS: number[] = [
  42, 48, 51, 46, 56, 53, 59, 61, 57, 65, 63, 68, 66, 71, 69, 74, 77, 72, 80, 78, 83, 81, 86, 84, 89, 87,
];

function parseOrderDate(o: AdminOrderSummary): Date | null {
  if (!o.createdAt) return null;
  try {
    const d = parseISO(o.createdAt);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

type WeeklyChartRow = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  /** false = values from live orders for this week */
  isDemo: boolean;
};

/**
 * ~26 weeks (6 months): weeks that already ended before today → hardcoded demo curve.
 * The calendar week that contains today → summed from `orders` (database).
 */
function buildHybridWeeklySeries(orders: AdminOrderSummary[]): WeeklyChartRow[] {
  const startOfToday = startOfDay(new Date());
  const thisWeekMonday = startOfWeek(startOfToday, { weekStartsOn: 1 });
  const firstMonday = startOfWeek(subWeeks(thisWeekMonday, 25), { weekStartsOn: 1 });

  const weekStarts = eachWeekOfInterval({ start: firstMonday, end: thisWeekMonday });

  return weekStarts.map((ws, idx) => {
    const we = endOfWeek(ws, { weekStartsOn: 1 });
    const key = format(ws, 'yyyy-MM-dd');
    const label = format(ws, 'MMM d');
    const weekFullyBeforeToday = isBefore(we, startOfToday);

    if (weekFullyBeforeToday) {
      return {
        key,
        label,
        revenue: DEMO_WEEKLY_REVENUE[idx] ?? DEMO_WEEKLY_REVENUE[DEMO_WEEKLY_REVENUE.length - 1],
        orders: DEMO_WEEKLY_ORDERS[idx] ?? DEMO_WEEKLY_ORDERS[DEMO_WEEKLY_ORDERS.length - 1],
        isDemo: true,
      };
    }

    let revenue = 0;
    let count = 0;
    for (const o of orders) {
      const d = parseOrderDate(o);
      if (!d) continue;
      if (isWithinInterval(d, { start: ws, end: we })) {
        revenue += Number(o.totalAmount);
        count += 1;
      }
    }
    return { key, label, revenue, orders: count, isDemo: false };
  });
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

/** Demo-only: revenue share by catalog section (replace with API when available). */
const DEMO_CATEGORY_SALES = [
  { name: 'womens', label: "Women's", value: 4_280_000 },
  { name: 'mens', label: "Men's", value: 3_150_000 },
  { name: 'kids', label: "Kids'", value: 1_520_000 },
  { name: 'accessories', label: 'Accessories', value: 980_000 },
] as const;

const DEMO_CATEGORY_SALES_TOTAL = DEMO_CATEGORY_SALES.reduce((s, r) => s + r.value, 0);

const CATEGORY_PIE_COLORS = [
  'hsl(330 70% 52%)',
  'hsl(215 78% 48%)',
  'hsl(45 93% 48%)',
  'hsl(262 48% 52%)',
] as const;

const categoryPieConfig = DEMO_CATEGORY_SALES.reduce<ChartConfig>((c, row, i) => {
  c[row.name] = {
    label: row.label,
    color: CATEGORY_PIE_COLORS[i % CATEGORY_PIE_COLORS.length],
  };
  return c;
}, {});

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
          adminService.getAllOrders(undefined, 0, 500),
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

  const chartSeries = useMemo(() => buildHybridWeeklySeries(orders), [orders]);

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
      <div className={adminPageShell}>
        <AdminStudioBackdrop />
        <div className={cn(adminContentClass, 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300')}>
          <div className="h-28 rounded-[1.35rem] border border-border/40 bg-muted/50 animate-pulse dark:bg-muted/20 sm:h-32" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-[1.35rem] border border-border/40 bg-muted/50 animate-pulse dark:bg-muted/20"
              />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-12">
            <div className="h-[340px] rounded-[1.35rem] border border-border/40 bg-muted/50 animate-pulse dark:bg-muted/20 xl:col-span-7" />
            <div className="flex flex-col gap-6 xl:col-span-5">
              <div className="h-[300px] rounded-[1.35rem] border border-border/40 bg-muted/50 animate-pulse dark:bg-muted/20" />
              <div className="h-[300px] rounded-[1.35rem] border border-border/40 bg-muted/50 animate-pulse dark:bg-muted/20" />
            </div>
          </div>
          <div className="h-[260px] rounded-[1.35rem] border border-border/40 bg-muted/50 animate-pulse dark:bg-muted/20" />
          <div className="h-72 rounded-[1.35rem] border border-border/40 bg-muted/50 animate-pulse dark:bg-muted/20" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={adminPageShell}>
        <AdminStudioBackdrop />
        <div className={cn(adminContentClass, 'flex min-h-[40vh] items-center justify-center')}>
          <div
            className={cn(
              adminGlassCard,
              'max-w-md p-8 text-center motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-500',
            )}
          >
            <LayoutDashboard className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-60" />
            <p className="text-sm font-medium text-foreground">Could not load dashboard</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check your connection and that your account has admin access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={adminPageShell}>
      <AdminStudioBackdrop />
      <div className={cn(adminContentClass, 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500')}>
      <div
        className={cn(
          adminGlassCard,
          'relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7 motion-safe:animate-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500',
        )}
        style={{ animationFillMode: 'both' }}
      >
        <div
          className="pointer-events-none absolute inset-x-8 top-3 h-px rounded-full bg-[length:200%_100%] bg-gradient-to-r from-transparent via-indigo-400/38 to-transparent opacity-90 motion-safe:animate-wardrobe-rail-shine dark:via-indigo-400/28"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-violet-500/[0.07]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-200/60 dark:shadow-indigo-950/50 dark:ring-white/12 motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:scale-[1.02]">
            <LayoutDashboard className="h-8 w-8" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200/90 bg-indigo-100/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-100">
              <span>Admin</span>
              <Sparkles className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-200/80" />
              overview
            </div>
            <h1 className="font-display-hero text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              <span className="text-foreground">Command </span>
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-indigo-300 dark:via-violet-300 dark:to-cyan-300">
                center
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Orders, revenue, catalog, and customers at a glance. Charts blend sample history with live data where
              noted.
            </p>
          </div>
        </div>
      </div>

      {/* KPI row — Orders, Revenue, Users, Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          accent="bg-[hsl(var(--primary))]"
          iconClass="bg-primary/15 text-primary"
        />
        <MetricCard
          title="Revenue"
          value={formatInr(stats.totalRevenue)}
          icon={IndianRupee}
          accent="bg-emerald-500"
          iconClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          title="Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          accent="bg-[hsl(262_45%_48%)]"
          iconClass="bg-[hsl(262_45%_48%)]/15 text-[hsl(262_45%_48%)]"
        />
        <MetricCard
          title="Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          accent="bg-amber-500"
          iconClass="bg-amber-500/15 text-amber-700 dark:text-amber-400"
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
          <Card
            className={cn(
              adminGlassCard,
              'border-amber-200/90 bg-amber-50/95 shadow-amber-500/10 dark:border-amber-800/50 dark:bg-amber-950/30 dark:shadow-none',
            )}
          >
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

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analytics</h2>
        <div className="grid gap-6 xl:grid-cols-12">
          <Card className={cn(adminGlassCard, 'overflow-hidden xl:col-span-7')}>
            <CardHeader className="space-y-1 pb-2 px-5 sm:px-6 pt-5">
              <CardTitle className="text-lg">Revenue</CardTitle>
              <CardDescription>
                ~6 months by week — sample trend for past weeks; this week from live orders
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-0 pr-2 pt-0 pb-5">
              <p className="text-[11px] text-muted-foreground px-4 sm:px-6 pb-2">
                Completed weeks show illustrative values. The week that includes today uses your database.
              </p>
              <ChartContainer config={revenueChartConfig} className="h-[280px] w-full aspect-auto">
              <AreaChart data={chartSeries} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={2}
                  tick={{ fontSize: 10 }}
                />
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

          <div className="flex flex-col gap-6 xl:col-span-5">
            <Card className={cn(adminGlassCard, 'flex flex-1 flex-col overflow-hidden')}>
              <CardHeader className="space-y-1 pb-2 px-5 pt-5">
                <CardTitle className="text-base">Orders by status</CardTitle>
                <CardDescription>Live share from all orders</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-0 pb-5 px-3 flex-1 justify-center">
                {statusPieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center px-4">No order data yet.</p>
                ) : (
                  <ChartContainer config={pieConfig} className="h-[240px] w-full max-w-[260px] aspect-square mx-auto">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={2}
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartLegend
                        content={<ChartLegendContent nameKey="name" className="flex-wrap gap-x-3 gap-y-1" />}
                      />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className={cn(adminGlassCard, 'flex flex-1 flex-col overflow-hidden')}>
              <CardHeader className="space-y-1 pb-2 px-5 pt-5">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <CardTitle className="text-base">Sales by category</CardTitle>
                </div>
                <CardDescription>Revenue mix by section — sample data for now</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-0 pb-5 px-3 flex-1 justify-center">
                <ChartContainer
                  config={categoryPieConfig}
                  className="h-[240px] w-full max-w-[260px] aspect-square mx-auto"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, _item, _idx, payload) => {
                            const p = (payload ?? {}) as { label?: string };
                            const v = Number(value);
                            const pct = ((v / DEMO_CATEGORY_SALES_TOTAL) * 100).toFixed(1);
                            return (
                              <div className="flex w-full min-w-[11rem] flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="text-muted-foreground">{p.label ?? '—'}</span>
                                <span className="font-mono font-medium tabular-nums text-foreground">
                                  {formatInr(v)}{' '}
                                  <span className="font-normal text-muted-foreground">({pct}%)</span>
                                </span>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <Pie
                      data={[...DEMO_CATEGORY_SALES]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={2}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {DEMO_CATEGORY_SALES.map((entry, index) => (
                        <Cell key={entry.name} fill={CATEGORY_PIE_COLORS[index % CATEGORY_PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" className="flex-wrap gap-x-3 gap-y-1" />}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Card className={cn(adminGlassCard, 'overflow-hidden')}>
        <CardHeader className="space-y-1 pb-2 px-5 pt-5 sm:px-6">
          <CardTitle className="text-lg">Order volume</CardTitle>
          <CardDescription>Orders per week — same demo / live split as revenue</CardDescription>
        </CardHeader>
        <CardContent className="pl-0 pr-2 pb-5">
          <ChartContainer config={ordersBarConfig} className="h-[220px] w-full aspect-auto">
            <BarChart data={chartSeries} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={2}
                tick={{ fontSize: 10 }}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="orders" fill="var(--color-orders)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card className={adminGlassCard}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-5 pt-5 sm:px-6">
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
    </div>
  );
};

function MetricCard({
  title,
  value,
  icon: Icon,
  accent,
  iconClass,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconClass: string;
}) {
  return (
    <Card
      className={cn(
        adminGlassCard,
        'relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200/50 hover:shadow-xl hover:shadow-indigo-500/[0.06] dark:hover:border-indigo-500/25',
      )}
    >
      <div className={cn('absolute bottom-0 left-0 top-0 w-1 rounded-l-[inherit]', accent)} aria-hidden />
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
          </div>
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&_svg]:shrink-0',
              iconClass,
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
