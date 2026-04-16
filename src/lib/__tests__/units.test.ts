import { describe, it, expect } from 'vitest';
import {
  lbsToKg,
  kgToLbs,
  inchesToCm,
  cmToInches,
  ftInchesToCm,
  toMetric,
} from '../units';

describe('primitive conversions', () => {
  it('lbs to kg uses the 1959 agreement constant', () => {
    expect(lbsToKg(1)).toBeCloseTo(0.45359237, 10);
    expect(lbsToKg(150)).toBeCloseTo(68.0388555, 6);
  });

  it('lbs <-> kg round-trips', () => {
    const kg = lbsToKg(185.3);
    expect(kgToLbs(kg)).toBeCloseTo(185.3, 9);
  });

  it('inches to cm uses the exact 2.54 constant', () => {
    expect(inchesToCm(1)).toBe(2.54);
    expect(inchesToCm(70)).toBeCloseTo(177.8, 9);
  });

  it('inches <-> cm round-trips', () => {
    const cm = inchesToCm(32.5);
    expect(cmToInches(cm)).toBeCloseTo(32.5, 9);
  });

  it('ftInchesToCm combines feet and inches', () => {
    expect(ftInchesToCm(5, 10)).toBeCloseTo(177.8, 9);
    expect(ftInchesToCm(6, 0)).toBeCloseTo(182.88, 9);
  });
});

describe('toMetric', () => {
  it('passes metric values through unchanged', () => {
    const result = toMetric({
      system: 'metric',
      heightCm: 175,
      weightKg: 70,
      waistCm: 82,
      hipCm: 95,
    });
    expect(result).toEqual({ heightCm: 175, weightKg: 70, waistCm: 82, hipCm: 95 });
  });

  it('converts imperial input to metric', () => {
    const result = toMetric({
      system: 'imperial',
      heightIn: 70,
      weightLb: 154.32358,
      waistIn: 32.28346,
    });
    expect(result.heightCm).toBeCloseTo(177.8, 9);
    expect(result.weightKg).toBeCloseTo(70, 3);
    expect(result.waistCm).toBeCloseTo(82, 3);
    expect(result.hipCm).toBeUndefined();
  });

  it('converts imperial hip when provided', () => {
    const result = toMetric({
      system: 'imperial',
      heightIn: 65,
      weightLb: 140,
      waistIn: 30,
      hipIn: 38,
    });
    expect(result.hipCm).toBeCloseTo(96.52, 3);
  });

  it('rejects non-positive height in metric', () => {
    expect(() =>
      toMetric({ system: 'metric', heightCm: 0, weightKg: 70, waistCm: 80 }),
    ).toThrow(RangeError);
  });

  it('rejects negative weight in metric', () => {
    expect(() =>
      toMetric({ system: 'metric', heightCm: 170, weightKg: -5, waistCm: 80 }),
    ).toThrow(RangeError);
  });

  it('rejects NaN waist in imperial', () => {
    expect(() =>
      toMetric({ system: 'imperial', heightIn: 70, weightLb: 150, waistIn: Number.NaN }),
    ).toThrow(RangeError);
  });
});
