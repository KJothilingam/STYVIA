import api, { API_BASE_URL } from './api';

export interface DonationPickupDTO {
  id: number;
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

export interface DonationBoxDTO {
  id: number;
  userName?: string | null;
  userEmail?: string | null;
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

export interface CreateDonationPickupPayload {
  wardrobeItemId?: number;
  productSummary?: string;
  size?: string;
  donationCenterCode: string;
  pickupAddress?: string;
  notes?: string;
}

export interface CreateDonationBoxPayload {
  addressLine1: string;
  locality?: string;
  city: string;
  pincode: string;
  phone: string;
  notes?: string;
}

export interface DropVerifyResult {
  valid: boolean;
  status: string;
  message: string;
}

const donationService = {
  async listPickups(): Promise<DonationPickupDTO[]> {
    const res = await api.get<{ data: DonationPickupDTO[] }>('/donations/pickups');
    return res.data.data ?? [];
  },

  async createPickup(body: CreateDonationPickupPayload): Promise<DonationPickupDTO> {
    const res = await api.post<{ data: DonationPickupDTO }>('/donations/pickups', body);
    return res.data.data;
  },

  async listBoxes(): Promise<DonationBoxDTO[]> {
    const res = await api.get<{ data: DonationBoxDTO[] }>('/donations/boxes');
    return res.data.data ?? [];
  },

  async requestBox(body: CreateDonationBoxPayload): Promise<DonationBoxDTO> {
    const res = await api.post<{ data: DonationBoxDTO }>('/donations/boxes', body);
    return res.data.data;
  },

  async verifyDropToken(token: string): Promise<DropVerifyResult> {
    const res = await api.get<{ data: DropVerifyResult }>(`/donations/drop-verify/${encodeURIComponent(token)}`);
    return res.data.data;
  },

  /** Avoids axios 401 refresh when opening drop-verify while logged out or with stale tokens. */
  async verifyDropTokenPublic(token: string): Promise<DropVerifyResult> {
    const r = await fetch(`${API_BASE_URL}/donations/drop-verify/${encodeURIComponent(token)}`);
    const j = (await r.json()) as { data?: DropVerifyResult };
    return j.data ?? { valid: false, status: 'UNKNOWN', message: 'Could not verify.' };
  },
};

export default donationService;
