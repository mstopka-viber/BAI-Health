/**
 * Cohort reference profiles for the BAI alignment algorithm.
 *
 * Each profile supplies three anchor numbers per index (BMI and BRI):
 *   - mid:              alignment score is 100 at this value
 *   - healthyHalfWidth: alignment score is 85 at mid ± this distance
 *   - concernDist:      alignment score is 40 at mid ± this distance
 *
 * HONEST-SEEDING POLICY (v1)
 * ---------------------------
 * Only the `universal` profile is sourced from published cutoffs we can cite
 * directly. Adult sex/age combos are seeded with conservative interpolations
 * that reflect well-documented trends but have NOT been verified against
 * primary sources in this session. Each of those is flagged `verified: false`.
 * The `/about` page surfaces this distinction to the user.
 *
 * Sources consulted (see plan for verification backlog):
 *   - Thomas DM et al. 2013, "Relationships between body roundness with body fat
 *     and visceral adipose tissue emerging from a new geometrical model", Obesity.
 *   - WHO BMI classification (adult): <18.5 underweight, 25 overweight, 30 obese.
 *   - Winter JE et al. 2014, "BMI and all-cause mortality in older adults: a
 *     meta-analysis", Am J Clin Nutr — suggests optimal BMI drifts upward with age.
 *   - Ma H et al. 2023 (BRI and mortality) — age- and sex-stratified mortality curves.
 *
 * Under-20 cohorts intentionally copy the universal anchors and set
 * `pediatricFallback: true`; adult BMI/BRI cutoffs do not apply under ~20,
 * and we do not attempt pediatric-specific math here.
 */

export type Sex = 'male' | 'female';
export type AgeBand = 'under20' | '20-39' | '40-64' | '65plus';
export type CohortKey = 'universal' | `${Sex}_${AgeBand}`;

export interface IndexRef {
  mid: number;
  healthyHalfWidth: number;
  concernDist: number;
}

export interface ReferenceProfile {
  cohortKey: CohortKey;
  bmi: IndexRef;
  bri: IndexRef;
  pediatricFallback: boolean;
  verified: boolean;
}

// Universal anchors — the only entries with directly-citable cutoffs.
// BMI: WHO healthy range 18.5–24.9 → mid 21.7, halfWidth 3.2;
//      obesity cutoff 30 → concernDist 8.3.
// BRI: Thomas 2013 healthy ~3.41–4.45 → mid 3.93, halfWidth 0.52;
//      commonly cited high-risk ≥6.9 → concernDist 2.97.
const UNIVERSAL_BMI: IndexRef = { mid: 21.7, healthyHalfWidth: 3.2, concernDist: 8.3 };
const UNIVERSAL_BRI: IndexRef = { mid: 3.93, healthyHalfWidth: 0.52, concernDist: 2.97 };

export const UNIVERSAL_PROFILE: ReferenceProfile = {
  cohortKey: 'universal',
  bmi: UNIVERSAL_BMI,
  bri: UNIVERSAL_BRI,
  pediatricFallback: false,
  verified: true,
};

// Adult cohort profiles (v1 estimates — verified: false on every entry).
// Interpolation logic:
//   - BMI mid drifts upward with age: 21.7 (20–39) → 23.0 (40–64) → 25.0 (65+).
//   - BMI halfWidth and concernDist narrow slightly with age (less room before
//     obesity at higher baselines).
//   - BRI mid runs ~0.3 higher in men than women at equivalent composition.
//   - BRI drifts upward with age due to visceral fat accumulation.
const ADULT_COHORTS: ReferenceProfile[] = [
  {
    cohortKey: 'male_20-39',
    bmi: { mid: 21.7, healthyHalfWidth: 3.2, concernDist: 8.3 },
    bri: { mid: 4.1, healthyHalfWidth: 0.55, concernDist: 2.8 }, // v1 estimate
    pediatricFallback: false,
    verified: false,
  },
  {
    cohortKey: 'female_20-39',
    bmi: { mid: 21.7, healthyHalfWidth: 3.2, concernDist: 8.3 },
    bri: { mid: 3.75, healthyHalfWidth: 0.55, concernDist: 3.15 }, // v1 estimate
    pediatricFallback: false,
    verified: false,
  },
  {
    cohortKey: 'male_40-64',
    bmi: { mid: 23.0, healthyHalfWidth: 3.3, concernDist: 7.0 }, // v1 estimate
    bri: { mid: 4.3, healthyHalfWidth: 0.55, concernDist: 2.7 }, // v1 estimate
    pediatricFallback: false,
    verified: false,
  },
  {
    cohortKey: 'female_40-64',
    bmi: { mid: 23.0, healthyHalfWidth: 3.3, concernDist: 7.0 }, // v1 estimate
    bri: { mid: 4.0, healthyHalfWidth: 0.55, concernDist: 3.0 }, // v1 estimate
    pediatricFallback: false,
    verified: false,
  },
  {
    cohortKey: 'male_65plus',
    bmi: { mid: 25.0, healthyHalfWidth: 3.0, concernDist: 5.0 }, // v1 estimate, Winter 2014
    bri: { mid: 4.6, healthyHalfWidth: 0.6, concernDist: 2.5 }, // v1 estimate
    pediatricFallback: false,
    verified: false,
  },
  {
    cohortKey: 'female_65plus',
    bmi: { mid: 25.0, healthyHalfWidth: 3.0, concernDist: 5.0 }, // v1 estimate, Winter 2014
    bri: { mid: 4.3, healthyHalfWidth: 0.6, concernDist: 2.7 }, // v1 estimate
    pediatricFallback: false,
    verified: false,
  },
];

// Pediatric cohorts — adult cutoffs do not apply; copy universal + flag.
const PEDIATRIC_COHORTS: ReferenceProfile[] = [
  {
    cohortKey: 'male_under20',
    bmi: UNIVERSAL_BMI,
    bri: UNIVERSAL_BRI,
    pediatricFallback: true,
    verified: false,
  },
  {
    cohortKey: 'female_under20',
    bmi: UNIVERSAL_BMI,
    bri: UNIVERSAL_BRI,
    pediatricFallback: true,
    verified: false,
  },
];

const REFERENCE_MAP: ReadonlyMap<CohortKey, ReferenceProfile> = new Map<CohortKey, ReferenceProfile>([
  ['universal', UNIVERSAL_PROFILE],
  ...ADULT_COHORTS.map(p => [p.cohortKey, p] as [CohortKey, ReferenceProfile]),
  ...PEDIATRIC_COHORTS.map(p => [p.cohortKey, p] as [CohortKey, ReferenceProfile]),
]);

export interface ProfileSelector {
  sex?: Sex;
  ageBand?: AgeBand;
}

/**
 * Resolve the reference profile for the given selector.
 * Falls back to the universal profile if sex or ageBand is missing,
 * or if the resulting cohort key isn't in the table.
 */
export function resolveProfile(selector?: ProfileSelector | null): ReferenceProfile {
  if (!selector || !selector.sex || !selector.ageBand) {
    return UNIVERSAL_PROFILE;
  }
  const key = `${selector.sex}_${selector.ageBand}` as CohortKey;
  return REFERENCE_MAP.get(key) ?? UNIVERSAL_PROFILE;
}

/** All profiles in the table, for admin/about-page introspection. */
export function allProfiles(): ReferenceProfile[] {
  return Array.from(REFERENCE_MAP.values());
}
