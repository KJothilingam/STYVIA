import api from './api';

export type BodyShape = 'SLIM' | 'REGULAR' | 'ATHLETIC' | 'HEAVY';
export type FitPreference = 'SLIM' | 'REGULAR' | 'LOOSE';
export type ChestType = 'SLIM' | 'AVERAGE' | 'BROAD';
export type WaistType = 'SLIM' | 'AVERAGE' | 'WIDE';
export type ShoulderWidth = 'NARROW' | 'NORMAL' | 'BROAD';

export interface BodyProfileDTO {
  id?: number;
  userId?: number;
  heightCm: number;
  weightKg: number;
  gender: 'MEN' | 'WOMEN' | 'KIDS' | 'UNISEX';
  bodyShape: BodyShape;
  shoulderWidth: ShoulderWidth;
  chestType: ChestType;
  waistType: WaistType;
  fitPreference: FitPreference;
  /** Saved cm overrides; omit/null to use height/weight estimates on the server. */
  chestCm?: number | null;
  shoulderCm?: number | null;
  waistCm?: number | null;
  lengthCm?: number | null;
  /** Sizes you usually buy — used to compare with the size you pick on a product. */
  usualShirtSize?: string | null;
  usualPantWaistInches?: number | null;
  usualShoeSize?: string | null;
  sareeStyle?: string | null;
  prefersFreeSize?: boolean | null;
}

/** Normalize legacy enum strings from older DB rows */
function normalizeDto(dto: BodyProfileDTO): BodyProfileDTO {
  const legacyShape = dto.bodyShape as string;
  const shapeMap: Record<string, BodyShape> = {
    TRIANGLE: 'SLIM',
    RECTANGLE: 'REGULAR',
    OVAL: 'REGULAR',
    INVERTED_TRIANGLE: 'ATHLETIC',
    HOURGLASS: 'REGULAR',
  };
  const bodyShape = shapeMap[legacyShape] ?? dto.bodyShape;

  let shoulderWidth = dto.shoulderWidth;
  if ((dto.shoulderWidth as string) === 'AVERAGE') {
    shoulderWidth = 'NORMAL';
  }

  let fitPreference = dto.fitPreference;
  if ((dto.fitPreference as string) === 'TIGHT') {
    fitPreference = 'SLIM';
  }

  return { ...dto, bodyShape, shoulderWidth, fitPreference };
}

const bodyProfileService = {
  async get(): Promise<BodyProfileDTO | null> {
    const res = await api.get<{ data: BodyProfileDTO | null }>('/profile/body');
    const raw = res.data.data ?? null;
    return raw ? normalizeDto(raw) : null;
  },

  async hasProfile(): Promise<boolean> {
    const res = await api.get<{ data: boolean }>('/profile/body/exists');
    return res.data.data ?? false;
  },

  /** Creates if missing (POST), otherwise updates (PUT). */
  async save(dto: BodyProfileDTO): Promise<BodyProfileDTO> {
    const exists = await this.hasProfile();
    const payload = normalizeDto(dto);
    if (exists) {
      const res = await api.put<{ data: BodyProfileDTO }>('/profile/body', payload);
      return normalizeDto(res.data.data);
    }
    const res = await api.post<{ data: BodyProfileDTO }>('/profile/body', payload);
    return normalizeDto(res.data.data);
  },
};

export default bodyProfileService;
