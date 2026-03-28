import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingBag, Sparkles, X } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const tone = 'rose' as const;

const Wishlist = () => {
  const { wishlist, removeFromWishlist, addToCart } = useStore();
  const { toast } = useToast();

  const handleMoveToBag = async (productId: string) => {
    const item = wishlist.find((w) => w.product.id === productId);
    if (!item) return;
    const ok = await addToCart(item.product, item.product.sizes[0] || 'M', item.product.colors[0]?.name || '');
    if (!ok) return;
    removeFromWishlist(productId);
    toast({
      title: 'Moved to bag!',
      description: 'Select size in bag if needed.',
    });
  };

  if (wishlist.length === 0) {
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
              <span className="font-medium text-foreground">Wishlist</span>
            </>
          }
          chip={
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-200/90 bg-rose-100/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-950 dark:border-rose-400/25 dark:bg-rose-500/15 dark:text-rose-100">
              <Heart className="h-3 w-3 shrink-0 fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-300" />
              Saved
              <Sparkles className="h-3 w-3 shrink-0 text-amber-600/90 dark:text-amber-200/80" />
            </div>
          }
          title={
            <>
              <span className="text-foreground">Your </span>
              <span className="bg-gradient-to-r from-rose-600 via-fuchsia-600 to-violet-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-rose-200 dark:via-fuchsia-200 dark:to-violet-200">
                wishlist
              </span>
            </>
          }
          subtitle="Save pieces you love, then move them to your bag when you’re ready."
          heroIcon={<Heart className="h-8 w-8 fill-current" aria-hidden />}
        >
          <div
            className={cn(glassCardClass, 'p-10 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500')}
            style={{ animationFillMode: 'both', animationDelay: '80ms' }}
          >
            <div className={glassCardInnerShine(tone)} aria-hidden />
            <Heart className="mx-auto mb-5 h-16 w-16 text-rose-400/80 dark:text-rose-400/60" />
            <h2 className="text-xl font-semibold text-foreground">Your wishlist is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Save items you love and review them anytime.
            </p>
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
            <span className="font-medium text-foreground">Wishlist</span>
          </>
        }
        chip={
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-200/90 bg-rose-100/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-950 dark:border-rose-400/25 dark:bg-rose-500/15 dark:text-rose-100">
            <Heart className="h-3 w-3 shrink-0 fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-300" />
            Saved
            <Sparkles className="h-3 w-3 shrink-0 text-amber-600/90 dark:text-amber-200/80" />
          </div>
        }
        title={
          <>
            <span className="text-foreground">Wishlist </span>
            <span className="bg-gradient-to-r from-rose-600 via-fuchsia-600 to-violet-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-rose-200 dark:via-fuchsia-200 dark:to-violet-200">
              ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
            </span>
          </>
        }
        subtitle="Tap a card to open the product, or move straight to your bag."
        heroIcon={<Heart className="h-8 w-8 fill-current" aria-hidden />}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
          {wishlist.map((item, i) => {
            const p = withLocalListingImages(item.product);
            return (
              <div
                key={item.product.id}
                className={cn(
                  glassCardClass,
                  'group overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                )}
                style={{ animationFillMode: 'both', animationDelay: `${60 + i * 35}ms` }}
              >
                <div className={cn(glassCardInnerShine(tone), 'top-2')} aria-hidden />
                <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
                  <Link to={`/product/${item.product.id}`} className="absolute inset-0 block">
                    <SafeProductImage
                      urls={p.images ?? []}
                      alt={p.name}
                      className="absolute inset-0"
                      classNameImg="transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.product.id)}
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/95 shadow-md backdrop-blur-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove from wishlist"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {item.product.discount > 0 ? (
                    <div className="absolute bottom-2 left-2 rounded-md bg-rose-600 px-2 py-1 text-xs font-bold text-white shadow-sm dark:bg-rose-500">
                      {item.product.discount}% OFF
                    </div>
                  ) : null}
                </div>

                <div className="relative p-3">
                  <h3 className="line-clamp-1 font-semibold text-foreground">{item.product.brand}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{item.product.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-semibold tabular-nums text-foreground">₹{item.product.price.toLocaleString()}</span>
                    {item.product.discount > 0 ? (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{item.product.originalPrice.toLocaleString()}
                      </span>
                    ) : null}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full border-rose-200/80 bg-rose-50/50 text-foreground hover:bg-rose-100/80 dark:border-rose-500/30 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
                    onClick={() => handleMoveToBag(item.product.id)}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Move to bag
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ShoppingPageShell>
    </Layout>
  );
};

export default Wishlist;
