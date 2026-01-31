import api from './api';
import { Product } from '@/types';

export interface ProductFilters {
  gender?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class ProductService {
  async getAllProducts(params?: ProductFilters): Promise<PageResponse<Product>> {
    const response = await api.get('/products', { params });
    return response.data.data;
  }

  async getProductById(id: number): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data.data;
  }

  async searchProducts(keyword: string, page = 0, size = 20): Promise<PageResponse<Product>> {
    const response = await api.get('/products/search', {
      params: { keyword, page, size },
    });
    return response.data.data;
  }

  async filterProducts(filters: ProductFilters): Promise<PageResponse<Product>> {
    const response = await api.get('/products/filter', { params: filters });
    return response.data.data;
  }

  async getAllBrands(): Promise<string[]> {
    const response = await api.get('/products/brands');
    return response.data.data;
  }
}

export default new ProductService();

