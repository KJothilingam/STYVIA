import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingBag, Share2, ChevronRight, Truck, RotateCcw, Shield } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useStore } from '@/context/StoreContext';
import { getProductById, products } from '@/data/products';
import { useToast } from '@/hooks/use-toast';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { cn } from '@/lib/utils';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const product = getProductById(id || '');
  const { addToRecentlyViewed } = useRecentlyViewed();

  // Add to recently viewed when product loads
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product);
    }
  }, [product?.id]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');

  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();
  const { toast } = useToast();
  const inWishlist = product ? isInWishlist(product.id) : false;

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const similarProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 5);

  const handleAddToBag = () => {
    if (!selectedSize) {
      toast({
        title: 'Please select a size',
        variant: 'destructive',
      });
      return;
    }
    addToCart(product, selectedSize, selectedColor || product.colors[0]?.name || '');
    toast({
      title: 'Added to bag!',
      description: `${product.name} has been added to your bag.`,
    });
  };

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast({ title: 'Removed from wishlist' });
    } else {
      addToWishlist(product);
      toast({ title: 'Added to wishlist' });
    }
  };

  const checkDelivery = () => {
    if (pincode.length === 6) {
      setDeliveryInfo('Delivery available in 3-5 business days');
    } else {
      setDeliveryInfo('Please enter a valid 6-digit pincode');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products?category=${product.category}`} className="hover:text-primary capitalize">
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="hidden md:flex flex-col gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'w-16 h-20 border rounded overflow-hidden',
                    selectedImage === index ? 'border-primary border-2' : 'border-border'
                  )}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 relative">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full aspect-[3/4] object-cover rounded-lg"
              />
              <button
                onClick={handleWishlistToggle}
                className={cn(
                  'absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg',
                  inWishlist ? 'bg-primary text-primary-foreground' : 'bg-background'
                )}
              >
                <Heart className={cn('w-5 h-5', inWishlist && 'fill-current')} />
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-foreground">{product.brand}</h1>
              <p className="text-lg text-muted-foreground mt-1">{product.name}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 bg-styvia-green text-primary-foreground text-sm font-bold px-2 py-1 rounded">
                  {product.rating} ★
                </span>
                <span className="text-sm text-muted-foreground">
                  {product.reviewCount.toLocaleString()} Ratings
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="border-t border-b py-4 my-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.discount > 0 && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      MRP ₹{product.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-lg font-bold text-styvia-orange">
                      ({product.discount}% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-styvia-green font-semibold mt-1">
                inclusive of all taxes
              </p>
            </div>

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">
                  Select Color
                </h3>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={cn(
                        'w-10 h-10 rounded-full border-2 transition-all',
                        selectedColor === color.name
                          ? 'border-primary scale-110'
                          : 'border-transparent'
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  Select Size
                </h3>
                <button className="text-primary text-sm font-semibold">
                  Size Chart →
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      'min-w-[50px] h-12 px-4 border rounded-full text-sm font-semibold transition-all',
                      selectedSize === size
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <Button
                onClick={handleAddToBag}
                className="flex-1 h-14 text-lg font-bold"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                ADD TO BAG
              </Button>
              <Button
                variant="outline"
                onClick={handleWishlistToggle}
                className={cn(
                  'flex-1 h-14 text-lg font-bold',
                  inWishlist && 'border-primary text-primary'
                )}
              >
                <Heart className={cn('w-5 h-5 mr-2', inWishlist && 'fill-current')} />
                WISHLIST
              </Button>
            </div>

            {/* Delivery Check */}
            <div className="mb-6">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-3">
                Delivery Options
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                  className="max-w-[200px]"
                />
                <Button variant="outline" onClick={checkDelivery}>
                  Check
                </Button>
              </div>
              {deliveryInfo && (
                <p className="text-sm text-muted-foreground mt-2">{deliveryInfo}</p>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">14 Day Returns</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">100% Original</p>
              </div>
            </div>

            {/* Product Details Accordion */}
            <Accordion type="single" collapsible className="mt-6">
              <AccordionItem value="description">
                <AccordionTrigger className="text-sm font-bold uppercase">
                  Product Description
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="material">
                <AccordionTrigger className="text-sm font-bold uppercase">
                  Material & Care
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{product.material}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Machine wash cold with similar colors.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Share */}
            <button className="flex items-center gap-2 text-sm text-muted-foreground mt-6 hover:text-primary">
              <Share2 className="w-4 h-4" />
              Share this product
            </button>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
