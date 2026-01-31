import api from './api';
import { Product } from '@/types';

class WishlistService {
  async getWishlist(): Promise<Product[]> {
    const response = await api.get('/wishlist');
    return response.data.data;
  }

  async addToWishlist(productId: number): Promise<Product> {
    const response = await api.post(`/wishlist/add/${productId}`);
    return response.data.data;
  }

  async removeFromWishlist(productId: number): Promise<void> {
    await api.delete(`/wishlist/remove/${productId}`);
  }

  async isInWishlist(productId: number): Promise<boolean> {
    const response = await api.get(`/wishlist/check/${productId}`);
    return response.data.data;
  }

  async clearWishlist(): Promise<void> {
    await api.delete('/wishlist/clear');
  }
}

export default new WishlistService();

