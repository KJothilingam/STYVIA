import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CartItem, WishlistItem, Product, User, Address, Order } from '@/types';
import authService from '@/services/authService';
import cartService from '@/services/cartService';
import wishlistService from '@/services/wishlistService';
import addressService from '@/services/addressService';
import orderService from '@/services/orderService';

interface StoreContextType {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateCartQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemsCount: number;
  isLoadingCart: boolean;

  // Wishlist
  wishlist: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  isLoadingWishlist: boolean;

  // User
  user: User | null;
  setUser: (user: User | null) => void;
  isLoggedIn: boolean;
  logout: () => void;

  // Addresses
  addresses: Address[];
  addAddress: (address: Address) => Promise<void>;
  removeAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;
  isLoadingAddresses: boolean;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
  isLoadingOrders: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State - Start with empty data
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Try to load cart from localStorage on mount
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    // Try to load wishlist from localStorage on mount
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch {
      return [];
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Loading states
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const savedUser = authService.getUser();
    if (savedUser) {
      const userId = savedUser.userId.toString();
      setUser({
        id: userId,
        name: savedUser.name,
        email: savedUser.email,
        phone: '',
      });
      
      // Load user-specific cart and wishlist from localStorage
      loadUserCartWishlist(userId);
    }
  }, []);

  // When user changes (login/logout), load their cart/wishlist/addresses/orders
  useEffect(() => {
    if (user) {
      // User logged in - load their data from localStorage
      loadUserCartWishlist(user.id);
    } else {
      // User logged out - clear display (data stays in localStorage)
      setCart([]);
      setWishlist([]);
      setAddresses([]);
      setOrders([]);
    }
  }, [user?.id]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      const userCartKey = `cart_${user.id}`;
      localStorage.setItem(userCartKey, JSON.stringify(cart));
    }
  }, [cart, user]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      const userWishlistKey = `wishlist_${user.id}`;
      localStorage.setItem(userWishlistKey, JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  // Save addresses to localStorage whenever they change
  useEffect(() => {
    if (user) {
      const userAddressKey = `addresses_${user.id}`;
      localStorage.setItem(userAddressKey, JSON.stringify(addresses));
    }
  }, [addresses, user]);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (user) {
      const userOrdersKey = `orders_${user.id}`;
      localStorage.setItem(userOrdersKey, JSON.stringify(orders));
    }
  }, [orders, user]);

  const loadUserCartWishlist = (userId: string) => {
    // Load cart for specific user
    const userCartKey = `cart_${userId}`;
    const savedCart = localStorage.getItem(userCartKey);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }

    // Load wishlist for specific user
    const userWishlistKey = `wishlist_${userId}`;
    const savedWishlist = localStorage.getItem(userWishlistKey);
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Error loading wishlist:', error);
      }
    }

    // Load addresses for specific user
    const userAddressKey = `addresses_${userId}`;
    const savedAddresses = localStorage.getItem(userAddressKey);
    if (savedAddresses) {
      try {
        setAddresses(JSON.parse(savedAddresses));
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
    }

    // Load orders for specific user
    const userOrdersKey = `orders_${userId}`;
    const savedOrders = localStorage.getItem(userOrdersKey);
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    }
  };

  // Load user data when user logs in
  useEffect(() => {
    if (user && authService.isAuthenticated()) {
      loadUserData();
    } else if (!user) {
      // User logged out - clear addresses and orders only
      // Don't clear cart/wishlist as they're handled per-user
      setAddresses([]);
      setOrders([]);
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Cart and wishlist are already loaded from localStorage on mount
      setIsLoadingCart(false);
      setIsLoadingWishlist(false);

      // Load addresses - try backend first, fallback to localStorage
      setIsLoadingAddresses(true);
      try {
        const addressesData = await addressService.getAddresses();
        if (addressesData && addressesData.length > 0) {
          setAddresses(addressesData.map(addr => ({
            id: addr.id?.toString() || '',
            name: addr.name,
            phone: addr.phone,
            pincode: addr.pincode,
            locality: addr.locality || '',
            address: addr.addressLine1,
            city: addr.city,
            state: addr.state,
            type: addr.addressType.toLowerCase() as 'home' | 'work',
            isDefault: addr.isDefault || false,
          })));
        }
        // If no addresses from backend, keep localStorage addresses (already loaded)
      } catch (error) {
        console.error('Error loading addresses from backend, using localStorage:', error);
        // Addresses from localStorage are already loaded in loadUserCartWishlist
      }
      setIsLoadingAddresses(false);

      // Load orders - try backend first, fallback to localStorage
      setIsLoadingOrders(true);
      try {
        const ordersData = await orderService.getUserOrders(0, 20);
        if (ordersData && ordersData.content && ordersData.content.length > 0) {
          setOrders(ordersData.content.map(order => ({
            id: order.orderNumber,
            items: order.items,
            totalAmount: order.totalAmount,
            discount: order.discount,
            deliveryFee: order.deliveryFee,
            address: {
              id: order.address.id?.toString() || '',
              name: order.address.name,
              phone: order.address.phone,
              pincode: order.address.pincode,
              locality: order.address.locality || '',
              address: order.address.addressLine1,
              city: order.address.city,
              state: order.address.state,
              type: 'home',
              isDefault: false,
            },
            paymentMethod: order.paymentMethod.toLowerCase() as any,
            status: order.orderStatus.toLowerCase() as any,
            orderedAt: new Date(order.createdAt),
            deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
          })));
        }
        // If no orders from backend, keep localStorage orders (already loaded)
      } catch (error) {
        console.error('Error loading orders from backend, using localStorage:', error);
        // Orders from localStorage are already loaded in loadUserCartWishlist
      }
      setIsLoadingOrders(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoadingCart(false);
      setIsLoadingWishlist(false);
      setIsLoadingAddresses(false);
      setIsLoadingOrders(false);
    }
  };

  const addToCart = useCallback((product: Product, size: string, color: string) => {
    if (!authService.isAuthenticated()) {
      alert('Please login to add items to cart');
      return;
    }

    // Update local state immediately
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.size === size
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, size, color }];
    });
    
    // localStorage save happens automatically via useEffect
  }, []);

  const removeFromCart = useCallback((productId: string, size: string) => {
    setCart((prev) => prev.filter(
      (item) => !(item.product.id === productId && item.size === size)
    ));
    // localStorage save happens automatically via useEffect
  }, []);

  const updateCartQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
    // localStorage save happens automatically via useEffect
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    // localStorage save happens automatically via useEffect
  }, []);

  const addToWishlist = useCallback((product: Product) => {
    if (!authService.isAuthenticated()) {
      alert('Please login to add items to wishlist');
      return;
    }

    // Update local state immediately
    setWishlist((prev) => {
      if (prev.some((item) => item.product.id === product.id)) {
        return prev;
      }
      return [...prev, { product, addedAt: new Date() }];
    });
    
    // localStorage save happens automatically via useEffect
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.product.id !== productId));
    // localStorage save happens automatically via useEffect
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.some((item) => item.product.id === productId);
    },
    [wishlist]
  );

  const addAddress = useCallback(async (address: Address) => {
    try {
      const newAddress = await addressService.addAddress({
        name: address.name,
        phone: address.phone,
        addressLine1: address.address,
        addressLine2: address.locality,
        locality: address.locality,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: 'India',
        addressType: address.type.toUpperCase() as 'HOME' | 'WORK' | 'OTHER',
        isDefault: address.isDefault,
      });

      setAddresses((prev) => [...prev, {
        id: newAddress.id?.toString() || '',
        name: newAddress.name,
        phone: newAddress.phone,
        pincode: newAddress.pincode,
        locality: newAddress.locality || '',
        address: newAddress.addressLine1,
        city: newAddress.city,
        state: newAddress.state,
        type: newAddress.addressType.toLowerCase() as 'home' | 'work',
        isDefault: newAddress.isDefault || false,
      }]);
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  }, []);

  const removeAddress = useCallback(async (addressId: string) => {
    try {
      await addressService.deleteAddress(parseInt(addressId));
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
    } catch (error) {
      console.error('Error removing address:', error);
    }
  }, []);

  const setDefaultAddress = useCallback(async (addressId: string) => {
    try {
      await addressService.setDefaultAddress(parseInt(addressId));
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === addressId,
        }))
      );
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  }, []);

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    
    // Only clear addresses and orders (from backend)
    // Cart and wishlist stay in state - they're already saved in localStorage
    // and will be loaded again on next login
    setAddresses([]);
    setOrders([]);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartItemsCount,
        isLoadingCart,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        isLoadingWishlist,
        user,
        setUser,
        isLoggedIn: !!user,
        logout,
        addresses,
        addAddress,
        removeAddress,
        setDefaultAddress,
        isLoadingAddresses,
        orders,
        addOrder,
        isLoadingOrders,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
