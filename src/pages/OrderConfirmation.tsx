import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';
import SafeProductImage from '@/components/SafeProductImage';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders } = useStore();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Link to="/orders">
            <Button>View All Orders</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <CheckCircle className="w-24 h-24 mx-auto text-styvia-green" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Thank you for shopping with us.
          </p>
          <p className="text-muted-foreground mb-8">
            Order ID: <span className="font-bold text-foreground">{order.id}</span>
          </p>

          {/* Order Progress */}
          <div className="bg-card border rounded-lg p-6 mb-8">
            <h2 className="font-bold mb-6">Order Status</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-5 h-0.5 bg-secondary" />
              <div className="absolute left-0 w-1/3 top-5 h-0.5 bg-primary" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2 font-medium">Confirmed</span>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2">Packed</span>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2">Shipped</span>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2">Delivered</span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-card border rounded-lg p-6 mb-8 text-left">
            <h2 className="font-bold mb-4">Order Details</h2>

            {/* Items */}
            <div className="space-y-3 pb-4 border-b">
              {order.items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="flex gap-3"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded">
                    <SafeProductImage
                      urls={item.product.images ?? []}
                      alt={item.product.name}
                      className="absolute inset-0"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.product.brand}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Size: {item.size} | Qty: {item.quantity}
                    </p>
                    <p className="font-bold text-sm mt-1">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Address */}
            <div className="py-4 border-b">
              <h3 className="font-bold text-sm mb-2">Delivery Address</h3>
              <p className="text-sm">{order.address.name}</p>
              <p className="text-sm text-muted-foreground">
                {order.address.address}, {order.address.locality}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
            </div>

            {/* Payment & Total */}
            <div className="pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Payment Method</span>
                <span className="capitalize">
                  {order.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : order.paymentMethod.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total Amount</span>
                <span>₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/orders">
              <Button variant="outline" className="w-full sm:w-auto">
                View All Orders
              </Button>
            </Link>
            <Link to="/products">
              <Button className="w-full sm:w-auto">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
