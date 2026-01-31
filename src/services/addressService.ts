import api from './api';

export interface Address {
  id?: number;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  addressType: 'HOME' | 'WORK' | 'OTHER';
  isDefault?: boolean;
}

class AddressService {
  async getAddresses(): Promise<Address[]> {
    const response = await api.get('/addresses');
    return response.data.data;
  }

  async addAddress(data: Address): Promise<Address> {
    const response = await api.post('/addresses', data);
    return response.data.data;
  }

  async updateAddress(addressId: number, data: Address): Promise<Address> {
    const response = await api.put(`/addresses/${addressId}`, data);
    return response.data.data;
  }

  async deleteAddress(addressId: number): Promise<void> {
    await api.delete(`/addresses/${addressId}`);
  }

  async setDefaultAddress(addressId: number): Promise<Address> {
    const response = await api.put(`/addresses/${addressId}/default`);
    return response.data.data;
  }
}

export default new AddressService();

