export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'men' | 'women' | 'kids' | 'accessories';
  subcategory: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  description: string;
  material: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  /** Garment stretch; used for Fit type filter on listing */
  stretchLevel?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
  /** Backend cart item id for API update/remove */
  cartItemId?: number;
}

export interface WishlistItem {
  product: Product;
  addedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  locality: string;
  address: string;
  city: string;
  state: string;
  type: 'home' | 'work';
  isDefault: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  discount: number;
  deliveryFee: number;
  address: Address;
  paymentMethod: 'cod' | 'card' | 'upi';
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderedAt: Date;
  deliveredAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  subcategories: { name: string; slug: string }[];
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link: string;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
}
