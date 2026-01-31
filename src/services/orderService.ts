import api from './api';

export interface PlaceOrderData {
  addressId: number;
  paymentMethod: 'COD' | 'CARD' | 'UPI' | 'NET_BANKING';
  couponCode?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  items: any[];
  address: any;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class OrderService {
  async placeOrder(data: PlaceOrderData): Promise<Order> {
    const response = await api.post('/orders/place', data);
    return response.data.data;
  }

  async getUserOrders(page = 0, size = 10): Promise<PageResponse<Order>> {
    const response = await api.get('/orders', {
      params: { page, size },
    });
    return response.data.data;
  }

  async getOrderById(orderId: number): Promise<Order> {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.data;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await api.get(`/orders/number/${orderNumber}`);
    return response.data.data;
  }

  async cancelOrder(orderId: number): Promise<Order> {
    const response = await api.put(`/orders/${orderId}/cancel`);
    return response.data.data;
  }
}

export default new OrderService();

