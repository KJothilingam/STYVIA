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
  quantity?: number;
  /** Row created from an order line (including auto-import at checkout). */
  fromOrder?: boolean;
  /** Stored in the browser for demo / mock catalog URLs (no numeric DB product id). */
  localOnly?: boolean;
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

  /** Add a catalog product you already own (no order required). */
  async addFromProduct(
    productId: number,
    body: { size: string; color: string; fitConfidence?: number; quantity?: number }
  ): Promise<WardrobeItemDTO> {
    const res = await api.post<{ data: WardrobeItemDTO }>(`/wardrobe/from-product/${productId}`, {
      size: body.size,
      color: body.color,
      fitConfidence: body.fitConfidence,
      quantity: body.quantity,
    });
    return res.data.data;
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

  async clearRepairNeed(wardrobeItemId: number): Promise<void> {
    await api.post(`/wardrobe/${wardrobeItemId}/clear-repair`);
  },

  async logDonate(wardrobeItemId: number, notes?: string): Promise<void> {
    await api.post(`/wardrobe/${wardrobeItemId}/donate`, { notes });
  },

  /** Unified lifecycle log (Body Intelligence wardrobe module). */
  async logEvent(wardrobeItemId: number, event: WardrobeLogEvent, notes?: string): Promise<void> {
    await api.post('/wardrobe/log', { wardrobeItemId, event, notes });
  },

  /** Marks item donated on the server; blocked if an active donation pickup exists for this wardrobe row. */
  async markDonated(wardrobeItemId: number): Promise<void> {
    await api.post(`/wardrobe/${wardrobeItemId}/mark-donated`);
  },

  async removeItem(wardrobeItemId: number): Promise<void> {
    await api.delete(`/wardrobe/${wardrobeItemId}`);
  },
};

export default wardrobeService;
