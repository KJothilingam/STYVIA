import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, MapPin, CreditCard, Truck } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, name: 'Address', icon: MapPin },
  { id: 2, name: 'Payment', icon: CreditCard },
  { id: 3, name: 'Summary', icon: Truck },
];

const Checkout = () => {
  const [currentStep, setCurrentStep] = useState(1);
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

  const { cart, addresses, addAddress, addOrder, clearCart, cartTotal } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const discount = 0;
  const deliveryFee = cartTotal > 799 ? 0 : 99;
  const finalTotal = cartTotal - discount + deliveryFee;

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleAddAddress = async () => {
    try {
      // Validate phone number
      let phone = newAddress.phone.trim().replace(/\D/g, ''); // Remove non-digits
      if (phone.startsWith('0')) {
        phone = phone.substring(1); // Remove leading zero
      }
      if (phone.length !== 10) {
        toast({
          title: 'Invalid Phone Number',
          description: 'Phone number must be exactly 10 digits (without leading 0)',
          variant: 'destructive',
        });
        return;
      }

      // Validate pincode
      const pincode = newAddress.pincode.trim().replace(/\D/g, '');
      if (pincode.length !== 6) {
        toast({
          title: 'Invalid Pincode',
          description: 'Pincode must be exactly 6 digits',
          variant: 'destructive',
        });
        return;
      }

      // Validate other required fields
      if (!newAddress.name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Name is required',
          variant: 'destructive',
        });
        return;
      }
      if (!newAddress.address.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Address is required',
          variant: 'destructive',
        });
        return;
      }
      if (!newAddress.city.trim()) {
        toast({
          title: 'Validation Error',
          description: 'City is required',
          variant: 'destructive',
        });
        return;
      }
      if (!newAddress.state.trim()) {
        toast({
          title: 'Validation Error',
          description: 'State is required',
          variant: 'destructive',
        });
        return;
      }

      const addr = {
        id: `addr-${Date.now()}`,
        ...newAddress,
        phone, // Use cleaned phone number
        pincode, // Use cleaned pincode
        isDefault: addresses.length === 0,
      };
      
      await addAddress(addr);
      
      toast({
        title: 'Address Saved',
        description: 'Address has been added successfully',
      });
      
      // Wait a moment for state to update
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
    } catch (error: any) {
      console.error('Error adding address:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to add address. Please try again.';
      toast({
        title: 'Failed to Save Address',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handlePlaceOrder = () => {
    const address = addresses.find((a) => a.id === selectedAddress);
    if (!address) return;

    const order = {
      id: `ORD${Date.now()}`,
      items: cart,
      totalAmount: finalTotal,
      discount,
      deliveryFee,
      address,
      paymentMethod: paymentMethod as 'cod' | 'card' | 'upi',
      status: 'processing' as const,
      orderedAt: new Date(),
    };

    addOrder(order);
    clearCart();
    navigate(`/order-confirmation/${order.id}`);
  };

  const selectedAddressData = addresses.find((a) => a.id === selectedAddress);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/cart" className="hover:text-primary">Bag</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Checkout</span>
        </nav>

        {/* Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full',
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
                <span className="font-medium text-sm">{step.name}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-2',
                    currentStep > step.id ? 'bg-primary' : 'bg-secondary'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Select Delivery Address</h2>

                {addresses.length > 0 && !showAddAddress && (
                  <RadioGroup
                    value={selectedAddress || ''}
                    onValueChange={setSelectedAddress}
                    className="space-y-4"
                  >
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={cn(
                          'border rounded-lg p-4 cursor-pointer',
                          selectedAddress === address.id && 'border-primary'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value={address.id} id={address.id} />
                          <label htmlFor={address.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold">{address.name}</span>
                              <span className="text-xs bg-secondary px-2 py-0.5 rounded uppercase">
                                {address.type}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {address.address}, {address.locality}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            <p className="text-sm mt-1">Mobile: {address.phone}</p>
                          </label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {!showAddAddress && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddAddress(true)}
                  >
                    + Add New Address
                  </Button>
                )}

                {showAddAddress && (
                  <div className="space-y-4 mt-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={newAddress.name}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, name: e.target.value })
                          }
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <Input
                          type="tel"
                          maxLength={11}
                          value={newAddress.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Only digits
                            setNewAddress({ ...newAddress, phone: value });
                          }}
                          placeholder="10-digit mobile number (without 0)"
                        />
                        {newAddress.phone && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {newAddress.phone.length} digits
                            {newAddress.phone.startsWith('0') && ' (Leading 0 will be removed)'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Pincode</Label>
                        <Input
                          type="tel"
                          maxLength={6}
                          value={newAddress.pincode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Only digits
                            setNewAddress({ ...newAddress, pincode: value });
                          }}
                          placeholder="6-digit pincode"
                        />
                        {newAddress.pincode && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {newAddress.pincode.length}/6 digits
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Locality</Label>
                        <Input
                          value={newAddress.locality}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, locality: e.target.value })
                          }
                          placeholder="Locality/Area"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input
                        value={newAddress.address}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, address: e.target.value })
                        }
                        placeholder="House No., Building, Street"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>City</Label>
                        <Input
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, city: e.target.value })
                          }
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          value={newAddress.state}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, state: e.target.value })
                          }
                          placeholder="State"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button onClick={handleAddAddress}>Save Address</Button>
                      <Button variant="outline" onClick={() => setShowAddAddress(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <Button
                    className="w-full"
                    disabled={!selectedAddress}
                    onClick={() => setCurrentStep(2)}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Select Payment Method</h2>

                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-4"
                >
                  <div
                    className={cn(
                      'border rounded-lg p-4 cursor-pointer',
                      paymentMethod === 'upi' && 'border-primary'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="upi" id="upi" />
                      <label htmlFor="upi" className="cursor-pointer">
                        <span className="font-bold">UPI</span>
                        <p className="text-sm text-muted-foreground">
                          Pay using UPI apps like Google Pay, PhonePe, etc.
                        </p>
                      </label>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'border rounded-lg p-4 cursor-pointer',
                      paymentMethod === 'card' && 'border-primary'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="card" id="card" />
                      <label htmlFor="card" className="cursor-pointer">
                        <span className="font-bold">Credit/Debit Card</span>
                        <p className="text-sm text-muted-foreground">
                          Visa, Mastercard, Rupay accepted
                        </p>
                      </label>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'border rounded-lg p-4 cursor-pointer',
                      paymentMethod === 'cod' && 'border-primary'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="cod" id="cod" />
                      <label htmlFor="cod" className="cursor-pointer">
                        <span className="font-bold">Cash on Delivery</span>
                        <p className="text-sm text-muted-foreground">
                          Pay when your order is delivered
                        </p>
                      </label>
                    </div>
                  </div>
                </RadioGroup>

                <div className="mt-6 pt-6 border-t flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => setCurrentStep(3)}>
                    Review Order
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Summary */}
            {currentStep === 3 && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                {/* Delivery Address */}
                <div className="mb-6 pb-6 border-b">
                  <h3 className="font-bold text-sm uppercase tracking-wide mb-3">
                    Delivery Address
                  </h3>
                  {selectedAddressData && (
                    <div>
                      <p className="font-semibold">{selectedAddressData.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAddressData.address}, {selectedAddressData.locality}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAddressData.city}, {selectedAddressData.state} -{' '}
                        {selectedAddressData.pincode}
                      </p>
                      <p className="text-sm mt-1">Mobile: {selectedAddressData.phone}</p>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="mb-6 pb-6 border-b">
                  <h3 className="font-bold text-sm uppercase tracking-wide mb-3">
                    Payment Method
                  </h3>
                  <p className="font-semibold capitalize">
                    {paymentMethod === 'cod'
                      ? 'Cash on Delivery'
                      : paymentMethod === 'upi'
                      ? 'UPI'
                      : 'Credit/Debit Card'}
                  </p>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm uppercase tracking-wide mb-3">
                    Items ({cart.length})
                  </h3>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={`${item.product.id}-${item.size}`}
                        className="flex gap-3"
                      >
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-16 h-20 object-cover rounded"
                        />
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
                </div>

                <div className="mt-6 pt-6 border-t flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handlePlaceOrder}>
                    Place Order
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border rounded-lg p-4">
              <h3 className="font-bold uppercase text-sm tracking-wide mb-4">
                Price Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Total MRP</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
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
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
