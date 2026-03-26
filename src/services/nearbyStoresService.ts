import api from './api';

export interface NearbyStore {
  name: string;
  lat: number;
  lng: number;
  rating?: number | null;
  openNow: boolean;
  address: string;
  placeId: string;
}

export interface NearbyStoresQuery {
  radius?: number;
  openNow?: boolean;
}

export async function fetchNearbyStores(
  lat: number,
  lng: number,
  opts: NearbyStoresQuery = {},
): Promise<NearbyStore[]> {
  const radius = opts.radius ?? 5000;
  const openNow = opts.openNow ?? false;
  const res = await api.get<{ data: NearbyStore[] }>('/nearby-stores', {
    params: { lat, lng, radius, openNow },
  });
  return res.data.data ?? [];
}
