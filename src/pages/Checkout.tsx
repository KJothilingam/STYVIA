import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SafeProductImage from '@/components/SafeProductImage';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useStore } from '@/context/StoreContext';
import { useCartFitSnapshots } from '@/hooks/useCartFitSnapshots';
import CartItemSizeFit from '@/components/cart/CartItemSizeFit';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import orderService from '@/services/orderService';

const Checkout = () => {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    pincode: '',
    locality: '',
    address: '',
    city: '',
    state: '',
    type: 'home' as const,
  });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [placing, setPlacing] = useState(false);

  const { cart, addresses, addAddress, addOrder, clearCart, syncCartToServer, cartTotal, isLoggedIn } = useStore();
  const { snapshots, loading: fitLoading, hasProfile } = useCartFitSnapshots(cart, isLoggedIn);
  const navigate = useNavigate();
  const { toast } = useToast();

  const deliveryFee = cartTotal > 799 ? 0 : 99;
  const finalTotal = cartTotal + deliveryFee;

  useEffect(() => {
    if (addresses.length === 1 && !selectedAddress) {
      setSelectedAddress(addresses[0].id);
    }
    const def = addresses.find((a) => a.isDefault);
    if (def && !selectedAddress) setSelectedAddress(def.id);
  }, [addresses, selectedAddress]);

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleAddAddress = async () => {
    try {
      let phone = newAddress.phone.trim().replace(/\D/g, '');
      if (phone.startsWith('0')) phone = phone.substring(1);
      if (phone.length !== 10) {
        toast({ title: 'Phone must be 10 digits', variant: 'destructive' });
        return;
      }
      const pincode = newAddress.pincode.trim().replace(/\D/g, '');
      if (pincode.length !== 6) {
        toast({ title: 'Pincode must be 6 digits', variant: 'destructive' });
        return;
      }
      if (!newAddress.name.trim() || !newAddress.address.trim() || !newAddress.city.trim() || !newAddress.state.trim()) {
        toast({ title: 'Fill all required fields', variant: 'destructive' });
        return;
      }

      const addr = {
        id: `addr-${Date.now()}`,
        ...newAddress,
        phone,
        pincode,
        isDefault: addresses.length === 0,
      };

      await addAddress(addr);
      toast({ title: 'Address saved' });
      setTimeout(() => {
        setSelectedAddress(addr.id);
        setShowAddAddress(false);
        setNewAddress({
          name: '',
          phone: '',
          pincode: '',
          locality: '',
          address: '',
          city: '',
          state: '',
          type: 'home',
        });
      }, 100);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Could not save address',
        description: err?.response?.data?.message || 'Try again',
        variant: 'destructive',
      });
    }
  };

  const handlePlaceOrder = async () => {
    const address = addresses.find((a) => a.id === selectedAddress);
    if (!address) {
      toast({ title: 'Choose a delivery address', variant: 'destructive' });
      return;
    }
    const addressId = Number(address.id);
    if (!Number.isFinite(addressId) || addressId <= 0) {
      toast({
        title: 'Address not saved on the server',
        description: 'Add the address again so we can deliver to you.',
        variant: 'destructive',
      });
      return;
    }
    setPlacing(true);
    try {
      const synced = await syncCartToServer();
      if (!synced) {
        toast({
          title: 'Cart could not be saved',
          description:
            'Your bag is only on this device or the catalog id is invalid. Try re-adding items from the shop, or refresh and try again.',
          variant: 'destructive',
        });
        return;
      }
      const paymentMap = { cod: 'COD', card: 'CARD', upi: 'UPI', net_banking: 'NET_BANKING' } as const;
      const res = await orderService.placeOrder({
        addressId,
        paymentMethod: paymentMap[paymentMethod as keyof typeof paymentMap] || 'COD',
      });
      addOrder({
        id: res.orderNumber,
        items: cart,
        totalAmount: res.totalAmount,
        discount: res.discount,
        deliveryFee: res.deliveryFee,
        address,
        paymentMethod: paymentMethod as 'cod' | 'card' | 'upi',
        status: res.orderStatus?.toLowerCase() as 'processing' | 'shipped' | 'delivered' | 'cancelled',
        orderedAt: new Date(res.createdAt),
        deliveredAt: res.deliveredAt ? new Date(res.deliveredAt) : undefined,
      });
      clearCart();
      navigate(`/order-confirmation/${res.orderNumber}`);
    } catch (e: unknown) {
      toast({
        title: 'Order failed',
        description: (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Try again',
        variant: 'destructive',
      });
    } finally {
      setPlacing(false);
    }
  };

  const selectedAddressData = addresses.find((a) => a.id === selectedAddress);

  const paymentLabel =
    paymentMethod === 'cod' ? 'Cash on delivery' : paymentMethod === 'upi' ? 'UPI' : 'Card';

  return (
    <Layout>
      <div className="min-h-[70vh] bg-secondary/20">
        <div className="mx-auto max-w-lg px-4 py-8 md:py-12">
          <Link
            to="/cart"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to bag
          </Link>

          <h1 className="font-display-hero text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Address, payment, summary — in one place.</p>

          <div className="mt-10 space-y-12">
            {/* Address */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Address</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Where should we deliver?</p>

              <div className="mt-5 space-y-3">
                {addresses.length > 0 && !showAddAddress && (
                  <RadioGroup value={selectedAddress || ''} onValueChange={setSelectedAddress}>
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        htmlFor={`addr-${address.id}`}
                        className={cn(
                          'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
                          selectedAddress === address.id ? 'border-foreground bg-secondary/40' : 'border-border hover:bg-secondary/20'
                        )}
                      >
                        <RadioGroupItem value={address.id} id={`addr-${address.id}`} className="mt-1" />
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="font-medium text-foreground">{address.name}</p>
                          <p className="mt-1 text-muted-foreground leading-relaxed">
                            {address.address}
                            {address.locality ? `, ${address.locality}` : ''}
                            <br />
                            {address.city}, {address.state} {address.pincode}
                          </p>
                          <p className="mt-1 text-muted-foreground">{address.phone}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                )}

                {!showAddAddress && (
                  <Button type="button" variant="ghost" size="sm" className="px-0 text-intelligence-mid hover:text-intelligence-mid" onClick={() => setShowAddAddress(true)}>
                    + Add address
                  </Button>
                )}

                {showAddAddress && (
                  <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input className="mt-1" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Phone</Label>
                        <Input
                          className="mt-1"
                          inputMode="numeric"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, '') })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Pincode</Label>
                        <Input
                          className="mt-1"
                          inputMode="numeric"
                          maxLength={6}
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Area</Label>
                        <Input className="mt-1" value={newAddress.locality} onChange={(e) => setNewAddress({ ...newAddress, locality: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Street, building</Label>
                      <Input className="mt-1" value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">City</Label>
                        <Input className="mt-1" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">State</Label>
                        <Input className="mt-1" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={handleAddAddress}>
                        Save
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddAddress(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Payment</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">How you&apos;ll pay</p>

              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-5 space-y-2">
                {[
                  { id: 'upi', label: 'UPI' },
                  { id: 'card', label: 'Card' },
                  { id: 'cod', label: 'Cash on delivery' },
                ].map(({ id, label }) => (
                  <label
                    key={id}
                    htmlFor={`pay-${id}`}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                      paymentMethod === id ? 'border-foreground bg-secondary/40' : 'border-border hover:bg-secondary/20'
                    )}
                  >
                    <RadioGroupItem value={id} id={`pay-${id}`} />
                    {label}
                  </label>
                ))}
              </RadioGroup>
            </section>

            {/* Order summary */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Order summary</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>

              <ul className="mt-5 divide-y divide-border">
                {cart.map((item) => (
                  <li key={`${item.product.id}-${item.size}`} className="flex gap-3 py-4 first:pt-0">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md">
                      <SafeProductImage
                        urls={item.product.images ?? []}
                        alt={item.product.name}
                        className="absolute inset-0"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{item.product.name}</p>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <CartItemSizeFit
                          selectedSize={item.size}
                          fit={snapshots[item.product.id]}
                          loading={fitLoading}
                          isLoggedIn={isLoggedIn}
                          hasProfile={hasProfile}
                          compact
                        />
                        <span>Qty {item.quantity}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold tabular-nums">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-2 border-t border-border pt-6 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-foreground">₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-styvia-green' : 'tabular-nums text-foreground'}>
                    {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {selectedAddressData && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Deliver to <span className="font-medium text-foreground">{selectedAddressData.city}</span> · Pay with{' '}
                  <span className="font-medium text-foreground">{paymentLabel}</span>
                </p>
              )}

              <Button
                type="button"
                className="mt-6 h-12 w-full bg-foreground text-background hover:bg-foreground/90"
                disabled={!selectedAddress || placing}
                onClick={handlePlaceOrder}
              >
                {placing ? 'Placing order…' : 'Place order'}
              </Button>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
