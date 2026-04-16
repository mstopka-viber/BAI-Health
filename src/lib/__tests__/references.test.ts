import { describe, it, expect } from 'vitest';
import {
  resolveProfile,
  allProfiles,
  UNIVERSAL_PROFILE,
  type Sex,
  type AgeBand,
} from '../references';

const SEXES: Sex[] = ['male', 'female'];
const AGE_BANDS: AgeBand[] = ['under20', '20-39', '40-64', '65plus'];
const ADULT_BANDS: AgeBand[] = ['20-39', '40-64', '65plus'];

describe('resolveProfile', () => {
  it('returns universal when selector is null, undefined, or empty', () => {
    expect(resolveProfile(null)).toBe(UNIVERSAL_PROFILE);
    expect(resolveProfile(undefined)).toBe(UNIVERSAL_PROFILE);
    expect(resolveProfile({})).toBe(UNIVERSAL_PROFILE);
  });

  it('returns universal when sex is missing', () => {
    expect(resolveProfile({ ageBand: '20-39' })).toBe(UNIVERSAL_PROFILE);
  });

  it('returns universal when ageBand is missing', () => {
    expect(resolveProfile({ sex: 'male' })).toBe(UNIVERSAL_PROFILE);
  });

  it('resolves every (sex, ageBand) pair to a matching cohort key', () => {
    for (const sex of SEXES) {
      for (const ageBand of AGE_BANDS) {
        const p = resolveProfile({ sex, ageBand });
        expect(p.cohortKey).toBe(`${sex}_${ageBand}`);
      }
    }
  });

  it('under20 cohorts have pediatricFallback true', () => {
    for (const sex of SEXES) {
      const p = resolveProfile({ sex, ageBand: 'under20' });
      expect(p.pediatricFallback).toBe(true);
    }
  });

  it('adult cohorts have pediatricFallback false', () => {
    for (const sex of SEXES) {
      for (const ageBand of ADULT_BANDS) {
        const p = resolveProfile({ sex, ageBand });
        expect(p.pediatricFallback).toBe(false);
      }
    }
  });

  it('adult non-universal cohorts are unverified in v1', () => {
    for (const sex of SEXES) {
      for (const ageBand of ADULT_BANDS) {
        const p = resolveProfile({ sex, ageBand });
        expect(p.verified).toBe(false);
      }
    }
  });

  it('universal profile is verified', () => {
    expect(UNIVERSAL_PROFILE.verified).toBe(true);
    expect(UNIVERSAL_PROFILE.cohortKey).toBe('universal');
  });

  it('all profiles have positive anchor numbers', () => {
    for (const p of allProfiles()) {
      expect(p.bmi.mid).toBeGreaterThan(0);
      expect(p.bmi.healthyHalfWidth).toBeGreaterThan(0);
      expect(p.bmi.concernDist).toBeGreaterThan(p.bmi.healthyHalfWidth);
      expect(p.bri.mid).toBeGreaterThan(0);
      expect(p.bri.healthyHalfWidth).toBeGreaterThan(0);
      expect(p.bri.concernDist).toBeGreaterThan(p.bri.healthyHalfWidth);
    }
  });
});

describe('allProfiles', () => {
  it('lists universal + 8 cohort profiles (9 total)', () => {
    expect(allProfiles()).toHaveLength(9);
  });
});
