import type { Product } from '@/types';

/**
 * Listing-only images from `public/images/`. Primary keys match `product.name` in `src/data/products.ts`.
 * Lookup also matches case-insensitively and normalizes Unicode hyphens/spaces so API titles still resolve.
 */
const LOCAL_LISTING_IMAGE_FILES: Record<string, string> = {
  'Analog Watch': 'Analog Watch.jpg',
  'Aviator Sunglasses': 'Aviator Sunglasses.jpg',
  'Boys Denim Jeans': 'Boys Denim Jeans.jpg',
  'Boys Graphic T-Shirt': 'Boys Graphic T-Shirt.jpg',
  'Boys Kurta Pyjama Set': 'Boys Kurta Pyjama Set.jpg',
  'Canvas Tote Bag': 'Canvas Tote Bag.jpg',
  'Classic Polo T-Shirt': 'Classic Polo T-Shirt.jpg',
  'Digital Smart Watch': 'Digital Smart Watch.jpg',
  /** File title differs from catalog `name`. */
  'Floral Print Maxi Dress': 'Floral Summer Dress.jpg',
  /** Same file; some API rows use this title (e.g. home preview). */
  'Floral Summer Dress': 'Floral Summer Dress.jpg',
  'Formal Blazer': 'Formal Blazer.jpg',
  'Girls Casual Top': 'Girls Casual Top.jpg',
  'Girls Lehenga Set': 'Girls Lehenga Set.jpg',
  'Girls Party Dress': 'Girls Party Dress.jpg',
  'Kids Backpack': 'Kids Backpack.jpg',
  'Kids Sports Shoes': 'Kids Sports Shoes.jpg',
  'Laptop Bag': 'Laptop Bag.jpg',
  'Leather Belt': 'Leather Belt.jpg',
  'Leather Wallet': 'Leather Wallet.jpg',
  'Printed Round Neck T-Shirt': 'Printed Round Neck T-Shirt.jpg',
  'Printed Scarf': 'Printed Scarf.jpg',
  'Slim Fit Casual Shirt': 'Slim Fit Casual Shirt.jpg',
  'Slim Fit Jeans': 'Slim Fit Jeans.jpg',
  'Sports Cap': 'Sports Cap.jpg',
  'Sports Running Shoes': 'Sports Running Shoes.jpg',
  'Sterling Silver Bracelet': 'Sterling Silver Bracelet.jpg',
};

/** When the API sends brand + title in one string (listing still shows brand + name separately). */
const LOCAL_LISTING_TITLE_ALIASES: Record<string, string> = {
  'Woodland Leather Belt': 'Leather Belt.jpg',
  'Adidas Kids Sports Shoes': 'Kids Sports Shoes.jpg',
};

/** Unicode/ASCII dashes → space so "Classic Polo T-Shirt" matches "Classic Polo T Shirt" from DB. */
export function normalizeListingTitleKey(name: string): string {
  return name
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/[\u2011\u2010\u2212\u2013\u2014]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/** Dedupe home / preview rows: same outfit from API + mock should not both appear; prefer the first pushed. */
export function listingSlotDedupeKey(product: Pick<Product, 'name' | 'id'>): string {
  const k = normalizeListingTitleKey(product.name);
  return k.length > 0 ? k : String(product.id);
}

const NORMALIZED_TITLE_TO_FILE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [title, file] of Object.entries(LOCAL_LISTING_IMAGE_FILES)) {
    m[normalizeListingTitleKey(title)] = file;
  }
  for (const [title, file] of Object.entries(LOCAL_LISTING_TITLE_ALIASES)) {
    m[normalizeListingTitleKey(title)] = file;
  }
  return m;
})();

function publicImageUrl(fileName: string): string {
  return `/images/${encodeURIComponent(fileName)}`;
}

/** Resolved URL for grids, or null if this product has no local file yet. */
export function getLocalListingImageUrl(productName: string | undefined | null): string | null {
  if (productName == null) return null;
  const trimmed = productName.trim();
  const direct = LOCAL_LISTING_IMAGE_FILES[trimmed] ?? LOCAL_LISTING_TITLE_ALIASES[trimmed];
  const file = direct ?? NORMALIZED_TITLE_TO_FILE[normalizeListingTitleKey(trimmed)];
  if (!file) return null;
  return publicImageUrl(file);
}

/**
 * Home “Trending / Deals” and shop listing grids only — PDP can keep remote images unless you use this there too.
 */
export function withLocalListingImages(product: Product): Product {
  const local = getLocalListingImageUrl(product.name);
  if (!local) return product;
  return { ...product, images: [local] };
}
