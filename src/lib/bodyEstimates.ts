import type { BodyShape, ChestType, ShoulderWidth, WaistType } from '@/services/bodyProfileService';

/** Mirrors backend BodyMeasurementEstimator (cm). */
export function estimateMeasurements(
  heightCm: number,
  weightKg: number,
  bodyShape: BodyShape,
  shoulderWidth: ShoulderWidth
): { chestCm: number; waistCm: number; shoulderCm: number; lengthCm: number } {
  let chest = weightKg * 0.45 + heightCm * 0.25;
  let waist = weightKg * 0.4 + heightCm * 0.2;
  let shoulder = heightCm * 0.18;
  const length = heightCm * 0.4;

  switch (bodyShape) {
    case 'SLIM':
      chest *= 0.97;
      waist *= 0.95;
      break;
    case 'ATHLETIC':
      chest *= 1.05;
      shoulder *= 1.04;
      break;
    case 'HEAVY':
      waist *= 1.08;
      chest *= 1.04;
      break;
    default:
      break;
  }

  switch (shoulderWidth) {
    case 'NARROW':
      shoulder *= 0.97;
      break;
    case 'BROAD':
      shoulder *= 1.05;
      break;
    default:
      break;
  }

  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    chestCm: round1(chest),
    waistCm: round1(waist),
    shoulderCm: round1(shoulder),
    lengthCm: round1(length),
  };
}

/** Derive API enums from numeric measurements vs formula baseline (shoulder width = NORMAL for baseline). */
export function deriveMeasurementEnums(
  heightCm: number,
  weightKg: number,
  bodyShape: BodyShape,
  actual: { chestCm: number; waistCm: number; shoulderCm: number }
): { chestType: ChestType; waistType: WaistType; shoulderWidth: ShoulderWidth } {
  const base = estimateMeasurements(heightCm, weightKg, bodyShape, 'NORMAL');

  let chestType: ChestType = 'AVERAGE';
  if (actual.chestCm < base.chestCm * 0.97) chestType = 'SLIM';
  else if (actual.chestCm > base.chestCm * 1.03) chestType = 'BROAD';

  let waistType: WaistType = 'AVERAGE';
  if (actual.waistCm < base.waistCm * 0.97) waistType = 'SLIM';
  else if (actual.waistCm > base.waistCm * 1.03) waistType = 'WIDE';

  const baseShoulder = base.shoulderCm;
  let shoulderWidth: ShoulderWidth = 'NORMAL';
  if (actual.shoulderCm < baseShoulder * 0.97) shoulderWidth = 'NARROW';
  else if (actual.shoulderCm > baseShoulder * 1.03) shoulderWidth = 'BROAD';

  return { chestType, waistType, shoulderWidth };
}
