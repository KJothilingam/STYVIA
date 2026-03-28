import type { WardrobeItemDTO } from '@/services/wardrobeService';
import { normalizeListingTitleKey } from '@/lib/localListingImages';

function outfitDedupeKey(item: WardrobeItemDTO): string {
  return `${normalizeListingTitleKey(item.productName)}|${String(item.size).trim().toLowerCase()}|${String(item.color).trim().toLowerCase()}`;
}

function isDonatedState(state: string | undefined | null): boolean {
  return String(state ?? '').toUpperCase() === 'DONATED';
}

/**
 * If any row for an outfit slot (name + size + color) is donated, remove every row for that slot.
 * Prevents a fresh order-import row from appearing next to (or instead of) a donated line for the same outfit.
 */
export function excludeOutfitsAnyDonated(items: WardrobeItemDTO[]): WardrobeItemDTO[] {
  const slots = new Set<string>();
  for (const item of items) {
    if (isDonatedState(item.lifecycleState)) {
      slots.add(outfitDedupeKey(item));
    }
  }
  if (slots.size === 0) return items;
  return items.filter((i) => !slots.has(outfitDedupeKey(i)));
}

/** Prefer account / order-backed rows over same outfit saved only on this device. */
function preferenceScore(item: WardrobeItemDTO): number {
  return (item.localOnly ? 2 : 0) + (item.fromOrder ? 0 : 1);
}

/** One visible row per outfit (name + size + color), merging order vs device duplicates. */
export function dedupeWardrobeByOutfit(items: WardrobeItemDTO[]): WardrobeItemDTO[] {
  const sorted = [...items].sort((a, b) => {
    const sa = preferenceScore(a);
    const sb = preferenceScore(b);
    if (sa !== sb) return sa - sb;
    return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
  });
  const seen = new Set<string>();
  const out: WardrobeItemDTO[] = [];
  for (const item of sorted) {
    const key = outfitDedupeKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  out.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
  return out;
}
