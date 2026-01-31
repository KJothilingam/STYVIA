import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/hooks/use-toast';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, addToCart } = useStore();
  const { toast } = useToast();

  const handleMoveToBag = (productId: string) => {
    const item = wishlist.find((w) => w.product.id === productId);
    if (item) {
      addToCart(item.product, item.product.sizes[0] || 'M', item.product.colors[0]?.name || '');
      removeFromWishlist(productId);
      toast({
        title: 'Moved to bag!',
        description: 'Select size in bag if needed.',
      });
    }
  };

  if (wishlist.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Heart className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-4">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-8">
            Save items you love to your wishlist. Review them anytime and easily move them to bag.
          </p>
          <Link to="/products">
            <Button size="lg">Continue Shopping</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">My Wishlist</span>
        </nav>

        <h1 className="text-xl font-bold mb-6">
          My Wishlist ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {wishlist.map((item) => (
            <div
              key={item.product.id}
              className="group bg-card rounded-sm overflow-hidden border hover:shadow-lg transition-all"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                <Link to={`/product/${item.product.id}`}>
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <button
                  onClick={() => removeFromWishlist(item.product.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-background rounded-full flex items-center justify-center shadow hover:bg-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
                {item.product.discount > 0 && (
                  <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                    {item.product.discount}% OFF
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-bold text-sm text-foreground line-clamp-1">
                  {item.product.brand}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {item.product.name}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-sm text-foreground">
                    ₹{item.product.price.toLocaleString()}
                  </span>
                  {item.product.discount > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
                      ₹{item.product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Move to Bag Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => handleMoveToBag(item.product.id)}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Move to Bag
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Wishlist;
