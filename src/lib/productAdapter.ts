import { Product } from '@/types';

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
  if (dto.gender != null && String(dto.gender).trim() !== '') {
    return genderToCategory(String(dto.gender));
  }
  const cg = dto.categories?.[0]?.gender;
  if (cg != null && String(cg).trim() !== '') {
    return genderToCategory(String(cg));
  }
  const slug = (dto.categories?.[0]?.slug ?? '').toLowerCase();
  if (slug.includes('women') || slug === 'women') return 'women';
  if (slug.includes('kid')) return 'kids';
  if (slug.includes('accessor')) return 'accessories';
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
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
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
