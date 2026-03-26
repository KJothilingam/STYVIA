/** Map fit confidence 0–100 to shopper-friendly copy. */
export function fitConfidenceLabel(score: number): string {
  if (score >= 85) return 'Best fit';
  if (score >= 70) return 'Good fit';
  if (score >= 55) return 'OK';
  if (score >= 40) return 'Tight';
  return 'Likely tight';
}
