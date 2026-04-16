/**
 * BMI, BRI, and BAI (Body Awareness Index) math.
 *
 * All inputs are metric (cm, kg). Use `toMetric` from `./units` to normalize
 * imperial inputs before calling these functions.
 *
 * The BAI is this app's original combination of BMI and BRI. It is surfaced
 * to the user as an encouraging tier word backed by a 0–100 progress score;
 * clinical terms never appear in the tier display.
 */

import type { IndexRef, ReferenceProfile } from './references';

export type BaiTier = 'Aligned' | 'Centered' | 'Building' | 'Exploring' | 'Awakening';

/** Body Mass Index: weight in kg divided by height in meters, squared. */
export function bmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Body Roundness Index per Thomas DM et al. 2013:
 *   BRI = 364.2 − 365.5 × sqrt(1 − (WC / (π × H))²)
 * with waist circumference WC and height H in the same units.
 */
export function bri(heightCm: number, waistCm: number): number {
  const waistM = waistCm / 100;
  const heightM = heightCm / 100;
  const ratio = waistM / (Math.PI * heightM);
  // Guard against domain issues from implausible waist > πH inputs.
  const inner = Math.max(0, 1 - ratio * ratio);
  return 364.2 - 365.5 * Math.sqrt(inner);
}

/**
 * Piecewise-linear alignment score for a single index value against a cohort
 * reference. See plan for anchor points: 100 at mid, 85 at healthy edge,
 * 40 at clinical-concern distance. Falls linearly past concern, clamped at 0.
 */
export function alignment(value: number, ref: IndexRef): number {
  const d = Math.abs(value - ref.mid);
  if (d === 0) return 100;

  if (d <= ref.healthyHalfWidth) {
    return 100 - (15 / ref.healthyHalfWidth) * d;
  }

  const outsideRange = ref.concernDist - ref.healthyHalfWidth;
  if (outsideRange <= 0) {
    // Defensive fallback for a degenerate cohort definition.
    return 85;
  }
  const extraSlope = 45 / outsideRange;
  const raw = 85 - extraSlope * (d - ref.healthyHalfWidth);
  return Math.max(0, raw);
}

export const BAI_WEIGHTS = { bmi: 0.5, bri: 0.5 } as const;

export interface BaiResult {
  bmi: number;
  bri: number;
  bmiAlign: number;
  briAlign: number;
  bai: number;
  tier: BaiTier;
}

export function computeBai(
  heightCm: number,
  weightKg: number,
  waistCm: number,
  profile: ReferenceProfile,
): BaiResult {
  const bmiValue = bmi(heightCm, weightKg);
  const briValue = bri(heightCm, waistCm);
  const bmiAlign = alignment(bmiValue, profile.bmi);
  const briAlign = alignment(briValue, profile.bri);
  const bai = BAI_WEIGHTS.bmi * bmiAlign + BAI_WEIGHTS.bri * briAlign;
  return {
    bmi: bmiValue,
    bri: briValue,
    bmiAlign,
    briAlign,
    bai,
    tier: tierForScore(bai),
  };
}

/** Map a 0–100 BAI score to its journey-framed tier word. */
export function tierForScore(score: number): BaiTier {
  if (score >= 85) return 'Aligned';
  if (score >= 65) return 'Centered';
  if (score >= 45) return 'Building';
  if (score >= 25) return 'Exploring';
  return 'Awakening';
}
