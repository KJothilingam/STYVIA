import api from './api';

export type LifecycleState =
  | 'NEW'
  | 'FREQUENTLY_USED'
  | 'RARELY_USED'
  | 'REPAIR_NEEDED'
  | 'DONATE_RECOMMENDED'
  | 'DONATED';

export type WardrobeLogEvent = 'WORN' | 'REPAIRED' | 'DONATED';

export interface WardrobeItemDTO {
  id: number;
  productId: number;
  productName: string;
  size: string;
  color: string;
  imageUrl: string | null;
  purchasedAt: string;
  wearCount: number;
  lastWornAt: string | null;
  lifecycleState: LifecycleState;
  fitConfidenceAtPurchase: number | null;
  notes: string | null;
  recommendation: string;
}

const wardrobeService = {
  async getWardrobe(): Promise<WardrobeItemDTO[]> {
    const res = await api.get<{ data: WardrobeItemDTO[] }>('/wardrobe');
    return res.data.data ?? [];
  },

  async syncFromOrders(): Promise<WardrobeItemDTO[]> {
    const res = await api.post<{ data: WardrobeItemDTO[] }>('/wardrobe/sync');
    return res.data.data ?? [];
  },

  async addFromOrderItem(orderItemId: number, fitConfidence?: number): Promise<WardrobeItemDTO> {
    const res = await api.post<{ data: WardrobeItemDTO }>(`/wardrobe/from-order-item/${orderItemId}`, {
      fitConfidence,
    });
    return res.data.data;
  },

  async logWorn(wardrobeItemId: number): Promise<void> {
    await api.post(`/wardrobe/${wardrobeItemId}/worn`);
  },

  async logRepair(wardrobeItemId: number, notes?: string): Promise<void> {
    await api.post(`/wardrobe/${wardrobeItemId}/repair`, { notes });
  },

  async logDonate(wardrobeItemId: number, notes?: string): Promise<void> {
    await api.post(`/wardrobe/${wardrobeItemId}/donate`, { notes });
  },

  /** Unified lifecycle log (Body Intelligence wardrobe module). */
  async logEvent(wardrobeItemId: number, event: WardrobeLogEvent, notes?: string): Promise<void> {
    await api.post('/wardrobe/log', { wardrobeItemId, event, notes });
  },
};

export default wardrobeService;
