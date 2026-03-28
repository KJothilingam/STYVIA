import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '@/types';
import { useStore } from '@/context/StoreContext';
import { cn } from '@/lib/utils';
import SafeProductImage from '@/components/SafeProductImage';

/** Stable reference — avoids `?? []` creating a new array every render and confusing image state. */
const NO_PRODUCT_IMAGES: string[] = [];

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard = ({ product, className }: ProductCardProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useStore();
  const inWishlist = isInWishlist(product.id);
  const imageUrls = product.images ?? NO_PRODUCT_IMAGES;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className={cn(
        "group block bg-card rounded-sm overflow-hidden transition-all hover:shadow-lg",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <SafeProductImage
          urls={imageUrls}
          alt={product.name}
          className="absolute inset-0"
          classNameImg="transition-transform duration-300 group-hover:scale-105"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all",
            inWishlist
              ? "bg-primary text-primary-foreground"
              : "bg-background/80 text-muted-foreground hover:bg-background hover:text-primary"
          )}
        >
          <Heart className={cn("w-4 h-4", inWishlist && "fill-current")} />
        </button>

        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
            {product.discount}% OFF
          </div>
        )}

        {/* Rating on hover */}
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-background/90 rounded px-2 py-1 flex items-center gap-1 w-fit">
            <span className="text-xs font-bold">{product.rating}</span>
            <span className="text-yellow-500 text-xs">★</span>
            <span className="text-xs text-muted-foreground">| {product.reviewCount}</span>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-bold text-sm text-foreground line-clamp-1">
          {product.brand}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
          {product.name}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-sm text-foreground">
            ₹{product.price.toLocaleString()}
          </span>
          {product.discount > 0 && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-styvia-orange">
                ({product.discount}% OFF)
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
