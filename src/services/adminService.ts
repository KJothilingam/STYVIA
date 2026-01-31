import api from './api';

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/admin/dashboard/stats');
    return response.data.data;
  }

  async getAllOrders(status?: string, page = 0, size = 20): Promise<any> {
    const response = await api.get('/admin/orders', {
      params: { status, page, size },
    });
    return response.data.data;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<any> {
    const response = await api.put(`/admin/orders/${orderId}/status`, null, {
      params: { status },
    });
    return response.data.data;
  }

  async getAllUsers(page = 0, size = 20): Promise<any> {
    const response = await api.get('/admin/users', {
      params: { page, size },
    });
    return response.data.data;
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<void> {
    await api.put(`/admin/users/${userId}/status`, null, {
      params: { isActive },
    });
  }
}

export default new AdminService();

