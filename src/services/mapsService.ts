import api from './api';

/** Reverse geocode via backend (Geocoding REST key on server; avoids browser CORS). */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await api.get<{ success?: boolean; data?: string }>('/maps/reverse-geocode', {
    params: { lat, lng },
  });
  const addr = res.data?.data;
  if (typeof addr === 'string' && addr.trim()) return addr.trim();
  return `Map point (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
}
