/**
 * Category + search URLs: phrases like "men dress" or "women clothes" are aisle-browse intent,
 * not strict product keywords. Strip these so listings match "Men / Women / Kids" only navigation.
 * (Aligned with backend AssistantIntentResolver.)
 */
const GENERIC_BROWSE_TERMS = new Set([
  'dress',
  'dresses',
  'clothe',
  'clothes',
  'clothing',
  'cloths',
  'vlothes',
  'wear',
  'wearing',
  'outfit',
  'outfits',
  'fashion',
  'styles',
  'style',
  'garments',
  'garment',
  'collection',
  'collections',
  'items',
  'looks',
  'look',
  'apparel',
]);

const URL_SEARCH_STOP = new Set([
  'a',
  'an',
  'the',
  'show',
  'me',
  'find',
  'look',
  'looking',
  'for',
  'i',
  'want',
  'need',
  'get',
  'buy',
  'some',
  'please',
  'can',
  'you',
  'to',
  'in',
  'of',
  'with',
  'go',
  'open',
  'take',
  'view',
  'browse',
  'shop',
  'section',
  'category',
  'stuff',
  'things',
  'something',
  'any',
  'where',
  'is',
  'are',
  'do',
  'does',
  'how',
  'about',
  'give',
  'see',
  'list',
  'all',
  'page',
  'navigate',
  'redirect',
  'like',
  'just',
  'only',
  'also',
  'really',
  'very',
]);

function normalizedTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter((t) => t.length >= 2 && !URL_SEARCH_STOP.has(t));
}

/** Remove generic “browse the aisle” words; return undefined if nothing specific remains. */
export function meaningfulCatalogSearch(raw: string | null | undefined): string | undefined {
  const tokens = normalizedTokens(raw ?? '');
  const specific = tokens.filter((t) => !GENERIC_BROWSE_TERMS.has(t));
  if (specific.length === 0) return undefined;
  return specific.join(' ');
}
