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

/** Convert API product to frontend Product type */
export function apiProductToProduct(dto: ApiProduct): Product {
  const category = dto.categories?.[0]?.slug ?? (dto.gender ? genderToCategory(dto.gender) : 'men');
  return {
    id: String(dto.id),
    name: dto.name,
    brand: dto.brand,
    category,
    subcategory: dto.categories?.[0]?.name ?? '',
    price: Number(dto.price),
    originalPrice: dto.originalPrice != null ? Number(dto.originalPrice) : Number(dto.price),
    discount: dto.discountPercentage ?? 0,
    images: dto.images?.length ? dto.images : ['https://via.placeholder.com/400x500?text=No+Image'],
    sizes: dto.sizes ?? [],
    colors: (dto.colors ?? []).map((c) => ({ name: c.name, hex: c.hex ?? '#999' })),
    description: dto.description ?? '',
    material: dto.material ?? '',
    rating: dto.rating ?? 0,
    reviewCount: dto.reviewCount ?? 0,
    inStock: (dto.sizes?.length ?? 0) > 0,
    stretchLevel: dto.stretchLevel ?? null,
  };
}
