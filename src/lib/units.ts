/**
 * Unit conversion helpers and metric normalization.
 *
 * All internal math (BMI, BRI, BAI) works in metric units. These helpers exist
 * to keep imperial inputs from the UI out of the math layer.
 *
 * Constants follow the international yard/pound agreement (1959):
 *   1 lb ≡ 0.45359237 kg
 *   1 in ≡ 2.54 cm (exact)
 */

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

export function lbsToKg(lbs: number): number {
  return lbs * KG_PER_LB;
}

export function kgToLbs(kg: number): number {
  return kg / KG_PER_LB;
}

export function inchesToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

export function cmToInches(cm: number): number {
  return cm / CM_PER_INCH;
}

/** Convenience for UIs that split height into feet + inches. */
export function ftInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_INCH;
}

export type UnitSystem = 'metric' | 'imperial';

export type MeasurementInput =
  | {
      system: 'metric';
      heightCm: number;
      weightKg: number;
      waistCm: number;
      hipCm?: number;
    }
  | {
      system: 'imperial';
      heightIn: number;
      weightLb: number;
      waistIn: number;
      hipIn?: number;
    };

export interface MetricMeasurements {
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm?: number;
}

function requirePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number; got ${value}`);
  }
}

/** Normalize any measurement input to metric. Throws RangeError on non-positive values. */
export function toMetric(input: MeasurementInput): MetricMeasurements {
  if (input.system === 'metric') {
    requirePositive(input.heightCm, 'heightCm');
    requirePositive(input.weightKg, 'weightKg');
    requirePositive(input.waistCm, 'waistCm');
    if (input.hipCm !== undefined) requirePositive(input.hipCm, 'hipCm');
    return {
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      waistCm: input.waistCm,
      hipCm: input.hipCm,
    };
  }

  requirePositive(input.heightIn, 'heightIn');
  requirePositive(input.weightLb, 'weightLb');
  requirePositive(input.waistIn, 'waistIn');
  if (input.hipIn !== undefined) requirePositive(input.hipIn, 'hipIn');
  return {
    heightCm: inchesToCm(input.heightIn),
    weightKg: lbsToKg(input.weightLb),
    waistCm: inchesToCm(input.waistIn),
    hipCm: input.hipIn !== undefined ? inchesToCm(input.hipIn) : undefined,
  };
}
