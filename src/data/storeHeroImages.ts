/** Hero images for nearby store rows (PDP-style left column). Place photos come from curated fashion retail shots. */
export const STORE_HERO_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1567401893414-76b7b1cd5b90?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1000&fit=crop',
];

export function heroImageForPlace(placeId: string): string {
  let h = 0;
  for (let i = 0; i < placeId.length; i++) {
    h = (h * 31 + placeId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % STORE_HERO_IMAGES.length;
  return STORE_HERO_IMAGES[idx]!;
}
