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
  /** Donation pickups awaiting admin acceptance */
  pendingDonationPickups?: number;
  pendingDonationBoxes?: number;
}

export interface AdminDonationPickupRow {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  wardrobeItemId?: number | null;
  productSummary?: string | null;
  size?: string | null;
  donationCenterCode: string;
  pickupAddress?: string | null;
  notes?: string | null;
  adminReply?: string | null;
  expectedPickAt?: string | null;
  status: string;
  createdAt: string;
}

export interface AdminDonationBoxRow {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  dropToken: string;
  addressLine1: string;
  locality?: string | null;
  city: string;
  pincode: string;
  phone: string;
  notes?: string | null;
  adminReply?: string | null;
  expectedDeliveryAt?: string | null;
  status: string;
  createdAt: string;
}

export interface DonationPendingSummary {
  pickupsPending: number;
  boxesPending: number;
  totalPending: number;
}

/** Admin list row — matches backend OrderDTO JSON. */
export interface AdminOrderSummary {
  id: number;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  address?: { name?: string; phone?: string };
  items?: { id?: number; productName?: string; quantity?: number; size?: string; color?: string }[];
}

export interface AdminOrdersPage {
  content: AdminOrderSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AdminUserSummary {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  isActive?: boolean;
  createdAt: string;
}

export interface AdminUsersPage {
  content: AdminUserSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/admin/dashboard/stats');
    return response.data.data;
  }

  async getAllOrders(status?: string, page = 0, size = 20): Promise<AdminOrdersPage> {
    const response = await api.get('/admin/orders', {
      params: { status, page, size },
    });
    return response.data.data;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<unknown> {
    const response = await api.put(`/admin/orders/${orderId}/status`, null, {
      params: { status },
    });
    return response.data.data;
  }

  async getAllUsers(page = 0, size = 20): Promise<AdminUsersPage> {
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

  async createProduct(data: {
    name: string;
    brand: string;
    gender: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    description?: string;
    material?: string;
    fabricType?: string;
    stretchLevel?: string;
    categoryIds?: number[];
    imageUrls?: string[];
    inventory?: { size: string; color: string; colorHex?: string; stockQuantity: number }[];
  }): Promise<unknown> {
    const res = await api.post('/admin/products', data);
    return res.data.data;
  }

  async updateProduct(productId: number, data: Record<string, unknown>): Promise<unknown> {
    const res = await api.put(`/admin/products/${productId}`, data);
    return res.data.data;
  }

  async deleteProduct(productId: number): Promise<void> {
    await api.delete(`/admin/products/${productId}`);
  }

  async getProductSizes(productId: number): Promise<{ id?: number; size: string; chestMeasurementCm?: number; shoulderMeasurementCm?: number; waistMeasurementCm?: number; lengthCm?: number; hipMeasurementCm?: number }[]> {
    const res = await api.get(`/admin/products/${productId}/sizes`);
    return res.data.data ?? [];
  }

  async saveProductSizes(productId: number, sizes: { size: string; chestMeasurementCm?: number; shoulderMeasurementCm?: number; waistMeasurementCm?: number; lengthCm?: number; hipMeasurementCm?: number }[]): Promise<unknown> {
    const res = await api.put(`/admin/products/${productId}/sizes`, sizes);
    return res.data.data;
  }

  async getDonationPickups(): Promise<AdminDonationPickupRow[]> {
    const res = await api.get('/admin/donations/pickups');
    return res.data.data ?? [];
  }

  async getDonationPendingSummary(): Promise<DonationPendingSummary> {
    const res = await api.get('/admin/donations/pending-summary');
    const d = res.data.data as DonationPendingSummary | undefined;
    return {
      pickupsPending: d?.pickupsPending ?? 0,
      boxesPending: d?.boxesPending ?? 0,
      totalPending: d?.totalPending ?? 0,
    };
  }

  async acceptDonationPickup(id: number, reply?: string): Promise<AdminDonationPickupRow> {
    const res = await api.post(`/admin/donations/pickups/${id}/accept`, { reply: reply || undefined });
    return res.data.data;
  }

  async rejectDonationPickup(id: number, reply?: string): Promise<AdminDonationPickupRow> {
    const res = await api.post(`/admin/donations/pickups/${id}/reject`, { reply: reply || undefined });
    return res.data.data;
  }

  async scheduleDonationPickup(id: number, expectedPickAt: string, reply?: string): Promise<AdminDonationPickupRow> {
    const res = await api.post(`/admin/donations/pickups/${id}/schedule`, {
      expectedPickAt,
      reply: reply || undefined,
    });
    return res.data.data;
  }

  async completeDonationPickup(id: number, reply?: string): Promise<AdminDonationPickupRow> {
    const res = await api.post(`/admin/donations/pickups/${id}/complete`, { reply: reply || undefined });
    return res.data.data;
  }

  async getDonationBoxes(): Promise<AdminDonationBoxRow[]> {
    const res = await api.get('/admin/donations/boxes');
    return res.data.data ?? [];
  }

  async acceptDonationBox(id: number, reply?: string): Promise<AdminDonationBoxRow> {
    const res = await api.post(`/admin/donations/boxes/${id}/accept`, { reply: reply || undefined });
    return res.data.data;
  }

  async rejectDonationBox(id: number, reply?: string): Promise<AdminDonationBoxRow> {
    const res = await api.post(`/admin/donations/boxes/${id}/reject`, { reply: reply || undefined });
    return res.data.data;
  }

  async scheduleDonationBox(id: number, expectedDeliveryAt: string, reply?: string): Promise<AdminDonationBoxRow> {
    const res = await api.post(`/admin/donations/boxes/${id}/schedule`, {
      expectedPickAt: expectedDeliveryAt,
      reply: reply || undefined,
    });
    return res.data.data;
  }

  async completeDonationBox(id: number, reply?: string): Promise<AdminDonationBoxRow> {
    const res = await api.post(`/admin/donations/boxes/${id}/complete`, { reply: reply || undefined });
    return res.data.data;
  }
}

export default new AdminService();


