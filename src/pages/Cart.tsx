import { Link } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag, Tag } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/context/StoreContext';
import { useState } from 'react';

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
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-4">Your bag is empty</h1>
          <p className="text-muted-foreground mb-8">
            Add items to your bag to see them here.
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
          <span className="text-foreground">Shopping Bag</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold">
                My Bag ({cart.length} {cart.length === 1 ? 'item' : 'items'})
              </h1>
            </div>

            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="flex gap-4 p-4 border rounded-lg"
                >
                  {/* Product Image */}
                  <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-24 h-32 object-cover rounded"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold text-foreground">
                          {item.product.brand}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.product.name}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.size)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Size: {item.size}</span>
                      {item.color && <span>Color: {item.color}</span>}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded">
                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.product.id,
                              item.size,
                              item.quantity - 1
                            )
                          }
                          className="p-2 hover:bg-secondary"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 font-semibold">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.product.id,
                              item.size,
                              item.quantity + 1
                            )
                          }
                          className="p-2 hover:bg-secondary"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-bold">
                          ₹{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                        {item.product.discount > 0 && (
                          <p className="text-xs text-muted-foreground line-through">
                            ₹{(item.product.originalPrice * item.quantity).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Coupon */}
              <div className="border rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-primary" />
                  <h3 className="font-bold">Apply Coupon</h3>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleApplyCoupon}>
                    Apply
                  </Button>
                </div>
                {appliedCoupon && (
                  <p className="text-sm text-styvia-green mt-2">
                    Coupon applied! You save ₹{discount}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Try: STYVIA100 for 10% off
                </p>
              </div>

              {/* Price Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold uppercase text-sm tracking-wide mb-4">
                  Price Details ({cart.length} Items)
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Total MRP</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-styvia-green">
                      <span>Coupon Discount</span>
                      <span>-₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    {deliveryFee > 0 ? (
                      <span>₹{deliveryFee}</span>
                    ) : (
                      <span className="text-styvia-green">FREE</span>
                    )}
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-base">
                    <span>Total Amount</span>
                    <span>₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <Link to="/checkout">
                  <Button className="w-full mt-6 h-12 font-bold">
                    PLACE ORDER
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
