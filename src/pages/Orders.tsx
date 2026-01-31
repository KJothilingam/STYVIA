import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { cn } from '@/lib/utils';

const Orders = () => {
  const { orders } = useStore();

  if (orders.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-4">No orders yet</h1>
          <p className="text-muted-foreground mb-8">
            Start shopping to see your orders here.
          </p>
          <Link to="/products">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-styvia-green bg-green-100';
      case 'shipped':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-destructive bg-red-100';
      default:
        return 'text-muted-foreground bg-secondary';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/profile" className="hover:text-primary">My Account</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">My Orders</span>
        </nav>

        <h1 className="text-xl font-bold mb-6">
          My Orders ({orders.length})
        </h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card border rounded-lg p-4">
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-bold">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ordered On</p>
                  <p className="font-semibold">
                    {new Date(order.orderedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold">₹{order.totalAmount.toLocaleString()}</p>
                </div>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold uppercase',
                    getStatusColor(order.status)
                  )}
                >
                  {order.status}
                </span>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                {order.items.map((item) => (
                  <Link
                    key={`${item.product.id}-${item.size}`}
                    to={`/product/${item.product.id}`}
                    className="flex gap-4 hover:bg-secondary/50 rounded-lg p-2 -mx-2"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-20 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-bold">{item.product.brand}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Size: {item.size} | Qty: {item.quantity}
                      </p>
                      <p className="font-bold mt-1">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground self-center" />
                  </Link>
                ))}
              </div>

              {/* Delivery Info */}
              {order.status === 'delivered' && order.deliveredAt && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-styvia-green font-semibold">
                    ✓ Delivered on{' '}
                    {new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {order.status === 'processing' && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Expected delivery in 5-7 business days
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
