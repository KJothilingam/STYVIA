import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Package, Sparkles, Truck } from 'lucide-react';
import SafeProductImage from '@/components/SafeProductImage';
import Layout from '@/components/layout/Layout';
import {
  ShoppingPageShell,
  glassCardClass,
  glassCardInnerShine,
  shoppingBreadcrumbHomeClass,
} from '@/components/layout/ShoppingPageShell';
import { withLocalListingImages } from '@/lib/localListingImages';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { cn } from '@/lib/utils';

const tone = 'amber' as const;

const ORDERS_POLL_MS = 45_000;

const Orders = () => {
  const { orders, refreshOrders } = useStore();

  useEffect(() => {
    void refreshOrders();
  }, [refreshOrders]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshOrders();
    };
    document.addEventListener('visibilitychange', onVisible);
    const intervalId = window.setInterval(() => void refreshOrders(), ORDERS_POLL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(intervalId);
    };
  }, [refreshOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-emerald-800 bg-emerald-100 dark:text-emerald-100 dark:bg-emerald-500/20';
      case 'shipped':
        return 'text-sky-800 bg-sky-100 dark:text-sky-100 dark:bg-sky-500/20';
      case 'processing':
        return 'text-amber-900 bg-amber-100 dark:text-amber-100 dark:bg-amber-500/20';
      case 'cancelled':
        return 'text-destructive bg-red-100 dark:bg-red-500/15 dark:text-red-100';
      default:
        return 'text-muted-foreground bg-secondary';
    }
  };

  if (orders.length === 0) {
    return (
      <Layout>
        <ShoppingPageShell
          tone={tone}
          breadcrumb={
            <>
              <Link to="/" className={shoppingBreadcrumbHomeClass(tone)}>
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
              <span className="mx-2 opacity-50">/</span>
              <Link to="/profile" className="transition-colors hover:text-foreground">
                My account
              </Link>
              <span className="mx-2 opacity-50">/</span>
              <span className="font-medium text-foreground">My orders</span>
            </>
          }
          chip={
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200/90 bg-amber-100/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-950 dark:border-amber-400/25 dark:bg-amber-500/15 dark:text-amber-100">
              <Truck className="h-3 w-3 shrink-0 text-amber-700 dark:text-amber-300" />
              Orders
              <Sparkles className="h-3 w-3 shrink-0 text-orange-600/90 dark:text-orange-200/80" />
            </div>
          }
          title={
            <>
              <span className="text-foreground">My </span>
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-amber-200 dark:via-orange-200 dark:to-rose-200">
                orders
              </span>
            </>
          }
          subtitle="Track purchases, line items, and delivery — all in one timeline."
          heroIcon={<Package className="h-8 w-8" aria-hidden />}
        >
          <div
            className={cn(glassCardClass, 'p-10 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500')}
            style={{ animationFillMode: 'both', animationDelay: '80ms' }}
          >
            <div className={glassCardInnerShine(tone)} aria-hidden />
            <Package className="mx-auto mb-5 h-16 w-16 text-amber-500/80 dark:text-amber-400/70" />
            <h2 className="text-xl font-semibold text-foreground">No orders yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Start shopping to see your orders here.
            </p>
            <Link to="/products" className="mt-8 inline-block">
              <Button size="lg">Start shopping</Button>
            </Link>
          </div>
        </ShoppingPageShell>
      </Layout>
    );
  }

  return (
    <Layout>
      <ShoppingPageShell
        tone={tone}
        breadcrumb={
          <>
            <Link to="/" className={shoppingBreadcrumbHomeClass(tone)}>
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <Link to="/profile" className="transition-colors hover:text-foreground">
              My account
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="font-medium text-foreground">My orders</span>
          </>
        }
        chip={
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200/90 bg-amber-100/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-950 dark:border-amber-400/25 dark:bg-amber-500/15 dark:text-amber-100">
            <Truck className="h-3 w-3 shrink-0 text-amber-700 dark:text-amber-300" />
            Orders
            <Sparkles className="h-3 w-3 shrink-0 text-orange-600/90 dark:text-orange-200/80" />
          </div>
        }
        title={
          <>
            <span className="text-foreground">My orders </span>
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-amber-200 dark:via-orange-200 dark:to-rose-200">
              ({orders.length})
            </span>
          </>
        }
        subtitle="Track purchases, line items, and delivery — all in one timeline."
        heroIcon={<Package className="h-8 w-8" aria-hidden />}
      >
        <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
          {orders.map((order, i) => (
            <div
              key={order.id}
              className={cn(glassCardClass, 'p-5 md:p-6')}
              style={{ animationFillMode: 'both', animationDelay: `${80 + i * 40}ms` }}
            >
              <div className={glassCardInnerShine(tone)} aria-hidden />
              <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Order ID</p>
                  <p className="font-semibold text-foreground">{order.id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ordered on</p>
                  <p className="font-medium text-foreground">
                    {new Date(order.orderedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p>
                  <p className="font-semibold tabular-nums text-foreground">₹{order.totalAmount.toLocaleString()}</p>
                </div>
                <span className={cn('rounded-full px-3 py-1 text-xs font-bold uppercase', getStatusColor(order.status))}>
                  {order.status}
                </span>
              </div>

              <div className="relative mt-4 space-y-2">
                {order.items.map((item) => {
                  const pid = item.product.id;
                  const productForImage = withLocalListingImages(item.product);
                  const rowInner = (
                    <>
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-sm">
                        <SafeProductImage
                          urls={productForImage.images ?? []}
                          alt={productForImage.name}
                          className="absolute inset-0"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{item.product.brand}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                          Size: {item.size}
                          {item.color ? ` · ${item.color}` : ''} | Qty: {item.quantity}
                        </p>
                        <p className="mt-1 font-semibold tabular-nums text-foreground">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 self-center text-muted-foreground" />
                    </>
                  );
                  const rowClass =
                    'relative flex gap-4 rounded-xl border border-transparent p-3 transition-all duration-300 hover:border-amber-200/60 hover:bg-amber-50/40 dark:hover:border-amber-500/20 dark:hover:bg-amber-500/5';
                  return pid ? (
                    <Link
                      key={`${item.product.id}-${item.size}-${item.color}`}
                      to={`/product/${pid}`}
                      className={rowClass}
                    >
                      {rowInner}
                    </Link>
                  ) : (
                    <div key={`${item.product.name}-${item.size}`} className={rowClass}>
                      {rowInner}
                    </div>
                  );
                })}
              </div>

              {order.status === 'delivered' && order.deliveredAt && (
                <div className="relative mt-4 border-t border-border/60 pt-4">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Delivered on{' '}
                    {new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {order.status === 'processing' && (
                <div className="relative mt-4 border-t border-border/60 pt-4">
                  <p className="text-sm text-muted-foreground">Expected delivery in 5–7 business days</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </ShoppingPageShell>
    </Layout>
  );
};

export default Orders;
