import api from './api';

export interface AddToCartData {
  productId: number;
  size: string;
  color: string;
  quantity: number;
}

export interface CartItem {
  id: number;
  product: any;
  size: string;
  color: string;
  quantity: number;
  subtotal: number;
}

class CartService {
  async getCart(): Promise<CartItem[]> {
    const response = await api.get('/cart');
    return response.data.data;
  }

  async addToCart(data: AddToCartData): Promise<CartItem> {
    const response = await api.post('/cart/add', data);
    return response.data.data;
  }

  async updateQuantity(itemId: number, quantity: number): Promise<CartItem> {
    const response = await api.put(`/cart/item/${itemId}/quantity`, null, {
      params: { quantity },
    });
    return response.data.data;
  }

  async removeItem(itemId: number): Promise<void> {
    await api.delete(`/cart/item/${itemId}`);
  }

  async clearCart(): Promise<void> {
    await api.delete('/cart/clear');
  }

  async getCartTotal(): Promise<number> {
    const response = await api.get('/cart/total');
    return response.data.data;
  }
}

export default new CartService();

