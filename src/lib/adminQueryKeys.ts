export const adminQueryKeys = {
  orders: (status: string, page: number, size: number) =>
    ['admin', 'orders', status, page, size] as const,
  products: (status: string, q: string, page: number, size: number) =>
    ['admin', 'products', status, q, page, size] as const,
  users: (q: string, active: string, page: number, size: number) =>
    ['admin', 'users', q, active, page, size] as const,
  categories: () => ['admin', 'categories'] as const,
  productSizes: (productId: number) => ['admin', 'product-sizes', productId] as const,
};
