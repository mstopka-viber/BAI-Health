import { describe, it, expect } from 'vitest';
import { bmi, bri, alignment, computeBai, tierForScore, BAI_WEIGHTS } from '../indices';
import { UNIVERSAL_PROFILE, resolveProfile } from '../references';

describe('bmi', () => {
  it('matches hand-computed value for 175 cm / 70 kg', () => {
    expect(bmi(175, 70)).toBeCloseTo(22.857, 3);
  });

  it('scales linearly with weight', () => {
    const a = bmi(180, 70);
    const b = bmi(180, 140);
    expect(b / a).toBeCloseTo(2, 9);
  });
});

describe('bri', () => {
  it('hand-computed: 175 cm tall, 82 cm waist ≈ 2.79', () => {
    expect(bri(175, 82)).toBeCloseTo(2.79, 2);
  });

  it('hand-computed: 175 cm tall, 90 cm waist ≈ 3.63', () => {
    expect(bri(175, 90)).toBeCloseTo(3.63, 2);
  });

  it('clamps domain when waist exceeds π × height', () => {
    // Absurd waist input: the sqrt argument would go negative; should not NaN.
    const value = bri(100, 1000);
    expect(Number.isFinite(value)).toBe(true);
  });
});

describe('alignment', () => {
  const ref = UNIVERSAL_PROFILE.bmi; // mid 21.7, halfWidth 3.2, concernDist 8.3

  it('scores 100 exactly at midpoint', () => {
    expect(alignment(ref.mid, ref)).toBe(100);
  });

  it('scores 85 at both edges of the healthy range', () => {
    expect(alignment(ref.mid + ref.healthyHalfWidth, ref)).toBeCloseTo(85, 9);
    expect(alignment(ref.mid - ref.healthyHalfWidth, ref)).toBeCloseTo(85, 9);
  });

  it('scores 40 at the clinical-concern distance', () => {
    expect(alignment(ref.mid + ref.concernDist, ref)).toBeCloseTo(40, 9);
    expect(alignment(ref.mid - ref.concernDist, ref)).toBeCloseTo(40, 9);
  });

  it('clamps to 0 far from midpoint', () => {
    expect(alignment(ref.mid + 100, ref)).toBe(0);
    expect(alignment(ref.mid - 100, ref)).toBe(0);
  });

  it('is monotonically non-increasing as distance grows', () => {
    const distances = [0, 0.5, 1, 2, 3, 5, 8, 12];
    const scores = distances.map(d => alignment(ref.mid + d, ref));
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });
});

describe('tierForScore', () => {
  const cases: Array<[number, string]> = [
    [100, 'Aligned'],
    [90, 'Aligned'],
    [85, 'Aligned'], // boundary goes to higher tier
    [84.99, 'Centered'],
    [70, 'Centered'],
    [65, 'Centered'],
    [64.99, 'Building'],
    [50, 'Building'],
    [45, 'Building'],
    [44.99, 'Exploring'],
    [30, 'Exploring'],
    [25, 'Exploring'],
    [24.99, 'Awakening'],
    [10, 'Awakening'],
    [0, 'Awakening'],
  ];
  it.each(cases)('score %f → tier %s', (score, tier) => {
    expect(tierForScore(score)).toBe(tier);
  });
});

describe('computeBai', () => {
  it('returns a consistent result with the universal profile', () => {
    const r = computeBai(175, 70, 82, UNIVERSAL_PROFILE);
    expect(r.bmi).toBeCloseTo(22.857, 3);
    expect(r.bri).toBeCloseTo(2.79, 2);
    expect(r.bmiAlign).toBeGreaterThan(90);
    expect(r.bmiAlign).toBeLessThanOrEqual(100);
    expect(r.briAlign).toBeLessThan(85); // 2.77 is >halfWidth away from 3.93
    expect(r.bai).toBe(BAI_WEIGHTS.bmi * r.bmiAlign + BAI_WEIGHTS.bri * r.briAlign);
    expect(r.bai).toBeGreaterThan(0);
    expect(r.bai).toBeLessThanOrEqual(100);
    expect(r.tier).toMatch(/^(Aligned|Centered|Building|Exploring|Awakening)$/);
  });

  it('yields different raw scores for universal vs. male_40-64 cohorts', () => {
    const universal = computeBai(175, 70, 82, UNIVERSAL_PROFILE);
    const male4064 = computeBai(
      175,
      70,
      82,
      resolveProfile({ sex: 'male', ageBand: '40-64' }),
    );
    expect(Math.abs(universal.bai - male4064.bai)).toBeGreaterThan(0.5);
  });

  it('BAI at cohort-midpoint measurements is ~100 and maps to Aligned', () => {
    // Construct a body whose BMI == mid and BRI == mid for the universal profile.
    // Pick height 175 cm. Weight for BMI 21.7: 21.7 * 1.75² = 66.45625 kg.
    // Waist for BRI 3.93 (inverting Thomas 2013):
    //   sqrt(1 - r²) = (364.2 - 3.93) / 365.5 = 0.98569
    //   1 - r² = 0.97159 → r = sqrt(0.02841) = 0.16857
    //   waist_m = 0.16857 * π * 1.75 ≈ 0.92683 → 92.68 cm
    const r = computeBai(175, 66.45625, 92.68, UNIVERSAL_PROFILE);
    expect(r.bmiAlign).toBeCloseTo(100, 1);
    expect(r.briAlign).toBeCloseTo(100, 0);
    expect(r.bai).toBeCloseTo(100, 0);
    expect(r.tier).toBe('Aligned');
  });
});
