import api from './api';

export interface ShopPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number | null;
  placeId?: string | null;
  openNow: boolean;
}

const shopService = {
  async nearby(lat: number, lng: number, radiusMeters = 5000, openNow = false): Promise<ShopPlace[]> {
    const res = await api.get<{ data: ShopPlace[] }>('/shops/nearby', {
      params: { lat, lng, radiusMeters, openNow },
    });
    return res.data.data ?? [];
  },
};

export default shopService;
