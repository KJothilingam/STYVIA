import api from './api';
import { Product } from '@/types';
import { apiProductToProduct, type ApiProduct } from '@/lib/productAdapter';

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

function asApiProduct(raw: unknown): ApiProduct {
  return raw as ApiProduct;
}

function mapPage(raw: PageResponse<unknown>): PageResponse<Product> {
  return {
    ...raw,
    content: (raw.content ?? []).map((p) => apiProductToProduct(asApiProduct(p))),
  };
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
    return mapPage(response.data.data);
  }

  /** Browse by gender — same catalog as home; PDP links use numeric ids for Check Fit. */
  async getProductsByGender(
    gender: 'MEN' | 'WOMEN' | 'KIDS' | 'UNISEX',
    page = 0,
    size = 100,
  ): Promise<PageResponse<Product>> {
    const response = await api.get(`/products/gender/${gender}`, { params: { page, size } });
    return mapPage(response.data.data);
  }

  async getProductById(id: number): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return apiProductToProduct(asApiProduct(response.data.data));
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const response = await api.get(`/products/slug/${encodeURIComponent(slug)}`);
    return apiProductToProduct(asApiProduct(response.data.data));
  }

  async searchProducts(keyword: string, page = 0, size = 20): Promise<PageResponse<Product>> {
    const response = await api.get('/products/search', {
      params: { keyword, page, size },
    });
    return mapPage(response.data.data);
  }

  async filterProducts(filters: ProductFilters): Promise<PageResponse<Product>> {
    const response = await api.get('/products/filter', { params: filters });
    return mapPage(response.data.data);
  }

  async getAllBrands(): Promise<string[]> {
    const response = await api.get('/products/brands');
    return response.data.data;
  }
}

export default new ProductService();

