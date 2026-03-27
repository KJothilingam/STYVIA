import { Product } from '@/types';
import { API_BASE_URL } from '@/config/apiBaseUrl';

/** Spring API lives on :8080; Vite is :5173 — relative `/api/v1/files/...` must target the API host or images 404. */
function apiServerOrigin(): string {
  return API_BASE_URL.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '') || '';
}

export function normalizeProductImageUrl(raw: string): string {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  if (s.startsWith('//')) {
    return typeof window !== 'undefined' && window.location?.protocol
      ? `${window.location.protocol}${s}`
      : `https:${s}`;
  }
  const origin = apiServerOrigin();
  if (!origin) return s;
  /** Vite `public/images/*` — must stay on the app origin, not the API server. */
  if (s.startsWith('/images/')) return s;
  if (s.startsWith('/')) return `${origin}${s}`;
  if (/^(api\/v1\/|files\/)/i.test(s)) return `${origin}/${s}`;
  return s;
}

/** API product (ProductDTO) shape from backend */
export interface ApiProduct {
  id: number;
  name: string;
  slug?: string;
  brand: string;
  gender?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  description?: string;
  material?: string;
  images?: string[];
  sizes?: string[];
  colors?: { name: string; hex?: string }[];
  categories?: { id: number; name: string; slug: string; gender?: string }[];
  rating?: number;
  reviewCount?: number;
  status?: string;
  stretchLevel?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | null;
}

const genderToCategory = (g: string): Product['category'] => {
  if (g === 'WOMEN') return 'women';
  if (g === 'KIDS') return 'kids';
  if (g === 'MEN' || g === 'UNISEX') return 'men';
  return 'men';
};

function categoryFromApi(dto: ApiProduct): Product['category'] {
  /** Shop navigation uses merchandising categories; gender alone mis-labels e.g. men’s bags as "men". */
  const cats = dto.categories ?? [];
  for (const c of cats) {
    const slug = (c.slug ?? '').toLowerCase();
    const name = (c.name ?? '').toLowerCase();
    if (slug.includes('accessor') || name.includes('accessor')) return 'accessories';
    if (slug.includes('kid') || name.includes('kid')) return 'kids';
    if (slug.includes('women')) return 'women';
    if (slug.includes('men') && !slug.includes('women')) return 'men';
  }
  if (dto.gender != null && String(dto.gender).trim() !== '') {
    return genderToCategory(String(dto.gender));
  }
  const cg = cats[0]?.gender;
  if (cg != null && String(cg).trim() !== '') {
    return genderToCategory(String(cg));
  }
  const slug0 = (cats[0]?.slug ?? '').toLowerCase();
  if (slug0.includes('women')) return 'women';
  if (slug0.includes('kid')) return 'kids';
  if (slug0.includes('accessor')) return 'accessories';
  return 'men';
}

/** Convert API product to frontend Product type */
export function apiProductToProduct(dto: ApiProduct): Product {
  const category = categoryFromApi(dto);
  return {
    id: String(dto.id),
    name: dto.name,
    brand: dto.brand,
    category,
    subcategory: dto.categories?.[0]?.name ?? '',
    price: Number(dto.price),
    originalPrice: dto.originalPrice != null ? Number(dto.originalPrice) : Number(dto.price),
    discount: dto.discountPercentage ?? 0,
    images: (dto.images ?? [])
      .map((s) => normalizeProductImageUrl(typeof s === 'string' ? s : String(s ?? '')))
      .filter((s) => s.length > 0),
    sizes: dto.sizes ?? [],
    colors: (dto.colors ?? []).map((c) => ({ name: c.name, hex: c.hex ?? '#999' })),
    description: dto.description ?? '',
    material: dto.material ?? '',
    rating: Number(dto.rating ?? 0) || 0,
    reviewCount: Number(dto.reviewCount ?? 0) || 0,
    inStock: (dto.sizes?.length ?? 0) > 0,
    stretchLevel: dto.stretchLevel ?? null,
  };
}
