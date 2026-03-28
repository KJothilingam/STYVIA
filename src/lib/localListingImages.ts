import type { Product } from '@/types';
import { normalizeProductImageUrl } from '@/lib/productAdapter';

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
  'Casual Sneakers': 'Casual Sneakers.jpg',
  'Classic Polo T-Shirt': 'Classic Polo T-Shirt.jpg',
  'Crop Top': 'Crop Top.jpg',
  'Designer Handbag': 'Designer Handbag.jpg',
  'Digital Smart Watch': 'Digital Smart Watch.jpg',
  'Embroidered Kurti': 'Embroidered Kurti.webp',
  /** File title differs from catalog `name`. */
  'Floral Print Maxi Dress': 'Floral Summer Dress.jpg',
  /** Same file; some API rows use this title (e.g. home preview). */
  'Floral Summer Dress': 'Floral Summer Dress.jpg',
  'Formal Blazer': 'Formal Blazer.jpg',
  'Girls Casual Top': 'Girls Casual Top.jpg',
  'Girls Lehenga Set': 'Girls Lehenga Set.jpg',
  /** Admin seed / women’s ethnic title; file matches kids lehenga visual. */
  'Lehenga Choli Set': 'Girls Lehenga Set.jpg',
  'Girls Party Dress': 'Girls Party Dress.jpg',
  'High-Rise Skinny Jeans': 'High-Rise Skinny Jeans.jpg',
  'Kids Backpack': 'Kids Backpack.jpg',
  'Kids Sports Shoes': 'Kids Sports Shoes.jpg',
  'Laptop Bag': 'Laptop Bag.jpg',
  'Leather Belt': 'Leather Belt.jpg',
  'Leather Wallet': 'Leather Wallet.jpg',
  'Pearl Necklace Set': 'Pearl Necklace Set.jpg',
  'Printed Round Neck T-Shirt': 'Printed Round Neck T-Shirt.jpg',
  'Printed Scarf': 'Printed Scarf.jpg',
  'Silk Saree': 'Silk Saree.jpg',
  'Slim Fit Casual Shirt': 'Slim Fit Casual Shirt.jpg',
  'Slim Fit Jeans': 'Slim Fit Jeans.jpg',
  'Sports Cap': 'Sports Cap.jpg',
  'Sports Running Shoes': 'Sports Running Shoes.jpg',
  'Sterling Silver Bracelet': 'Sterling Silver Bracelet.jpg',
  'Stiletto Heels': 'Stiletto Heels.jpg',
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

/** API rows often store "Brand Product Name" in `name` while local files map to catalog titles only. */
function stripLeadingBrandFromTitle(name: string, brand: string | undefined | null): string {
  const n = name.trim();
  const b = (brand ?? '').trim();
  if (!n || !b) return n;
  const escaped = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escaped}\\s+`, 'i');
  return n.replace(re, '').trim() || n;
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

/** Same as {@link getLocalListingImageUrl} but also tries the title with a leading `brand` removed (common API shape). */
export function getLocalListingImageUrlForProduct(product: Pick<Product, 'name' | 'brand'>): string | null {
  const primary = getLocalListingImageUrl(product.name);
  if (primary) return primary;
  return getLocalListingImageUrl(stripLeadingBrandFromTitle(product.name, product.brand));
}

/**
 * Prefer `public/images/*` first for any grid or PDP, then keep remaining URLs (e.g. extra carousel shots).
 */
export function withLocalListingImages(product: Product): Product {
  const local = getLocalListingImageUrlForProduct(product);
  if (!local) return product;
  const rest = (product.images ?? []).filter((u) => {
    const n = normalizeProductImageUrl(String(u ?? '').trim());
    return n.length > 0 && n !== local;
  });
  return { ...product, images: [local, ...rest] };
}

/**
 * Wardrobe rows often carry a single API `imageUrl` that may 404; prefer `public/images` when the title matches catalog.
 */
/**
 * Admin catalog rows: prefer `public/images` when the title matches the storefront catalog, then API URLs.
 */
export function getAdminProductThumbnailUrls(
  name: string,
  brand: string,
  apiUrls: Array<string | null | undefined> | undefined | null,
): string[] {
  const local = getLocalListingImageUrlForProduct({ name, brand });
  const normalizedApi = (apiUrls ?? [])
    .map((u) => normalizeProductImageUrl(String(u ?? '').trim()))
    .filter((u) => u.length > 0);
  if (!local) return normalizedApi;
  const rest = normalizedApi.filter((u) => u !== local);
  return [local, ...rest];
}

export function getWardrobeDisplayImageUrls(
  productName: string | null | undefined,
  imageUrl: string | null | undefined
): string[] {
  const name = (productName ?? '').trim();
  let local: string | null = getLocalListingImageUrlForProduct({ name, brand: '' });
  if (!local && name) {
    const parts = name.split(/\s+/);
    for (let drop = 1; drop <= Math.min(3, parts.length - 1); drop++) {
      const rest = parts.slice(drop).join(' ');
      local = getLocalListingImageUrl(rest);
      if (local) break;
    }
  }
  const raw = imageUrl?.trim();
  const remote = raw ? normalizeProductImageUrl(raw) : '';
  const urls: string[] = [];
  if (local) urls.push(local);
  if (remote && remote !== local) urls.push(remote);
  return urls;
}
