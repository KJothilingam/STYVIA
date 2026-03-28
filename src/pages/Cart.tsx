import { Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, Sparkles, Tag, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useStore } from '@/context/StoreContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const tone = 'emerald' as const;

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, cartTotal } = useStore();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const discount = appliedCoupon ? Math.round(cartTotal * 0.1) : 0;
  const deliveryFee = cartTotal > 799 ? 0 : 99;
  const finalTotal = cartTotal - discount + deliveryFee;

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'styvia100') {
      setAppliedCoupon(couponCode);
    }
  };

  if (cart.length === 0) {
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
              <span className="font-medium text-foreground">Bag</span>
            </>
          }
          chip={
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-100/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-100">
              <ShoppingBag className="h-3 w-3 shrink-0 text-emerald-700 dark:text-emerald-300" />
              Bag
              <Sparkles className="h-3 w-3 shrink-0 text-amber-600/90 dark:text-amber-200/80" />
            </div>
          }
          title={
            <>
              <span className="text-foreground">Shopping </span>
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-emerald-200 dark:via-teal-200 dark:to-cyan-200">
                bag
              </span>
            </>
          }
          subtitle="Review sizes, apply a coupon, and head to checkout when you’re set."
          heroIcon={<ShoppingBag className="h-8 w-8" aria-hidden />}
        >
          <div
            className={cn(glassCardClass, 'p-10 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500')}
            style={{ animationFillMode: 'both', animationDelay: '80ms' }}
          >
            <div className={glassCardInnerShine(tone)} aria-hidden />
            <ShoppingBag className="mx-auto mb-5 h-16 w-16 text-emerald-500/80 dark:text-emerald-400/70" />
            <h2 className="text-xl font-semibold text-foreground">Your bag is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Add items to your bag to see them here.</p>
            <Link to="/products" className="mt-8 inline-block">
              <Button size="lg">Continue shopping</Button>
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
            <span className="font-medium text-foreground">Bag</span>
          </>
        }
        chip={
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-100/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-100">
            <ShoppingBag className="h-3 w-3 shrink-0 text-emerald-700 dark:text-emerald-300" />
            Bag
            <Sparkles className="h-3 w-3 shrink-0 text-amber-600/90 dark:text-amber-200/80" />
          </div>
        }
        title={
          <>
            <span className="text-foreground">My bag </span>
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-emerald-200 dark:via-teal-200 dark:to-cyan-200">
              ({cart.length} {cart.length === 1 ? 'item' : 'items'})
            </span>
          </>
        }
        subtitle="Review line items on the left — totals and checkout on the right."
        heroIcon={<ShoppingBag className="h-8 w-8" aria-hidden />}
      >
        <div className="grid gap-8 lg:grid-cols-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
          <div className="space-y-4 lg:col-span-2">
            {cart.map((item, i) => {
              const p = withLocalListingImages(item.product);
              return (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className={cn(glassCardClass, 'p-4 md:p-5')}
                  style={{ animationFillMode: 'both', animationDelay: `${60 + i * 45}ms` }}
                >
                  <div className={glassCardInnerShine(tone)} aria-hidden />
                  <div className="relative flex gap-4">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="relative block h-32 w-24 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-sm"
                    >
                      <SafeProductImage
                        urls={p.images ?? []}
                        alt={p.name}
                        className="absolute inset-0"
                        classNameImg="transition-transform duration-300 hover:scale-105"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">{item.product.brand}</h3>
                          <p className="text-sm text-muted-foreground">{item.product.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id, item.size)}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Remove from bag"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>Size: {item.size}</span>
                        {item.color ? <span>Color: {item.color}</span> : null}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center overflow-hidden rounded-xl border border-border/80 bg-muted/30 shadow-inner">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.product.id, item.size, item.quantity - 1)
                            }
                            className="p-2.5 transition-colors hover:bg-muted/80 disabled:opacity-40"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-[2.5rem] px-2 text-center font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.product.id, item.size, item.quantity + 1)
                            }
                            className="p-2.5 transition-colors hover:bg-muted/80"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold tabular-nums text-foreground">
                            ₹{(item.product.price * item.quantity).toLocaleString()}
                          </p>
                          {item.product.discount > 0 ? (
                            <p className="text-xs text-muted-foreground line-through">
                              ₹{(item.product.originalPrice * item.quantity).toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className={cn(glassCardClass, 'p-5')}>
                <div className={glassCardInnerShine(tone)} aria-hidden />
                <div className="relative mb-4 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-foreground">Apply coupon</h3>
                </div>
                <div className="relative flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="bg-background/80"
                  />
                  <Button type="button" variant="outline" onClick={handleApplyCoupon}>
                    Apply
                  </Button>
                </div>
                {appliedCoupon ? (
                  <p className="relative mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Coupon applied — you save ₹{discount}
                  </p>
                ) : null}
                <p className="relative mt-2 text-xs text-muted-foreground">Try STYVIA100 for 10% off</p>
              </div>

              <div className={cn(glassCardClass, 'p-5')}>
                <div className={glassCardInnerShine(tone)} aria-hidden />
                <h3 className="relative mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Price details ({cart.length} items)
                </h3>
                <div className="relative space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total MRP</span>
                    <span className="tabular-nums">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400">
                      <span>Coupon discount</span>
                      <span className="tabular-nums">−₹{discount.toLocaleString()}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    {deliveryFee > 0 ? (
                      <span className="tabular-nums">₹{deliveryFee}</span>
                    ) : (
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">Free</span>
                    )}
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-3 text-base font-bold">
                    <span>Total</span>
                    <span className="tabular-nums">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
                <Link to="/checkout" className="relative mt-6 block">
                  <Button className="h-12 w-full font-bold">Place order</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ShoppingPageShell>
    </Layout>
  );
};

export default Cart;
