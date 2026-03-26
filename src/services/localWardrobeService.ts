import type { LifecycleState, WardrobeItemDTO } from './wardrobeService';

const STORAGE_PREFIX = 'styvia_local_wardrobe_v1:';

type LocalWardrobeEntry = {
  localId: number;
  routeKey: string;
  productName: string;
  size: string;
  color: string;
  imageUrl: string | null;
  quantity: number;
  wearCount: number;
  lastWornAt: string | null;
  purchasedAt: string;
  lifecycleState: LifecycleState;
  notes: string | null;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function slotKey(routeKey: string, size: string, color: string) {
  return `${norm(routeKey)}|${norm(size)}|${norm(color)}`;
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadEntries(userId: string): LocalWardrobeEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalWardrobeEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(userId: string, entries: LocalWardrobeEntry[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(entries));
}

function nextLocalId(entries: LocalWardrobeEntry[]): number {
  let min = 0;
  for (const e of entries) {
    if (e.localId < min) min = e.localId;
  }
  return min - 1;
}

function toDto(e: LocalWardrobeEntry): WardrobeItemDTO {
  return {
    id: e.localId,
    productId: 0,
    productName: e.productName,
    size: e.size,
    color: e.color,
    quantity: e.quantity,
    fromOrder: false,
    localOnly: true,
    imageUrl: e.imageUrl,
    purchasedAt: e.purchasedAt,
    wearCount: e.wearCount,
    lastWornAt: e.lastWornAt,
    lifecycleState: e.lifecycleState,
    fitConfidenceAtPurchase: null,
    notes: e.notes,
    recommendation:
      'Saved on this device for this browse/demo product. Items from Shop use your account and sync everywhere.',
  };
}

/** Merge server wardrobe with local demo entries, newest first. */
export function mergeWardrobeLists(remote: WardrobeItemDTO[], local: WardrobeItemDTO[]): WardrobeItemDTO[] {
  const merged = [...remote, ...local];
  merged.sort((a, b) => {
    const ta = new Date(a.purchasedAt).getTime();
    const tb = new Date(b.purchasedAt).getTime();
    return tb - ta;
  });
  return merged;
}

const localWardrobeService = {
  listAsDtos(userId: string): WardrobeItemDTO[] {
    return loadEntries(userId).map(toDto);
  },

  findMatch(
    userId: string,
    routeKey: string | undefined,
    size: string,
    color: string
  ): WardrobeItemDTO | null {
    if (!userId || !routeKey) return null;
    const sk = slotKey(routeKey, size, color);
    const entry = loadEntries(userId).find((e) => slotKey(e.routeKey, e.size, e.color) === sk);
    return entry ? toDto(entry) : null;
  },

  addOrMerge(
    userId: string,
    params: {
      routeKey: string;
      productName: string;
      size: string;
      color: string;
      imageUrl: string | null;
      quantity?: number;
    }
  ): WardrobeItemDTO {
    const entries = loadEntries(userId);
    const sk = slotKey(params.routeKey, params.size, params.color);
    const idx = entries.findIndex((e) => slotKey(e.routeKey, e.size, e.color) === sk);
    const addQ = params.quantity && params.quantity > 0 ? params.quantity : 1;
    if (idx >= 0) {
      const e = entries[idx];
      e.quantity = (e.quantity ?? 1) + addQ;
      saveEntries(userId, entries);
      return toDto(e);
    }
    const entry: LocalWardrobeEntry = {
      localId: nextLocalId(entries),
      routeKey: params.routeKey.trim(),
      productName: params.productName,
      size: params.size.trim(),
      color: params.color.trim(),
      imageUrl: params.imageUrl,
      quantity: addQ,
      wearCount: 0,
      lastWornAt: null,
      purchasedAt: new Date().toISOString(),
      lifecycleState: 'NEW',
      notes: null,
    };
    entries.push(entry);
    saveEntries(userId, entries);
    return toDto(entry);
  },

  logWorn(userId: string, localId: number): void {
    const entries = loadEntries(userId);
    const e = entries.find((x) => x.localId === localId);
    if (!e) return;
    e.wearCount = (e.wearCount ?? 0) + 1;
    e.lastWornAt = new Date().toISOString();
    if (e.wearCount >= 6) e.lifecycleState = 'FREQUENTLY_USED';
    saveEntries(userId, entries);
  },

  logRepair(userId: string, localId: number, notes?: string): void {
    const entries = loadEntries(userId);
    const e = entries.find((x) => x.localId === localId);
    if (!e) return;
    e.lifecycleState = 'REPAIR_NEEDED';
    e.notes = notes ?? e.notes;
    saveEntries(userId, entries);
  },

  logDonate(userId: string, localId: number, notes?: string): void {
    const entries = loadEntries(userId);
    const e = entries.find((x) => x.localId === localId);
    if (!e) return;
    e.lifecycleState = 'DONATE_RECOMMENDED';
    e.notes = notes ?? e.notes;
    saveEntries(userId, entries);
  },

  logDonated(userId: string, localId: number, notes?: string): void {
    const entries = loadEntries(userId);
    const e = entries.find((x) => x.localId === localId);
    if (!e) return;
    e.lifecycleState = 'DONATED';
    e.notes = notes ?? e.notes;
    saveEntries(userId, entries);
  },
};

export default localWardrobeService;
