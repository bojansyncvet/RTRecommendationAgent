import { Species, WeightAssessment } from '../types/patientNotification';

// ── Size categories drive growth curve selection ─────────────────────────────
type BreedSizeCategory = 'toy' | 'small' | 'medium' | 'large' | 'giant';

interface BreedBenchmark {
  /** Fully-grown healthy weight range (kg). */
  adultMinKg: number;
  adultMaxKg: number;
  sizeCategory: BreedSizeCategory;
}

// ── Adult weight benchmarks ──────────────────────────────────────────────────
// Sources: WSAVA body condition score guidelines, AAHA weight management guidelines,
// AKC & GCCF breed standards.

const CANINE_BENCHMARKS: Record<string, BreedBenchmark> = {
  'labrador retriever':              { adultMinKg: 25,  adultMaxKg: 36,  sizeCategory: 'large'  },
  'golden retriever':                { adultMinKg: 25,  adultMaxKg: 34,  sizeCategory: 'large'  },
  'german shepherd':                 { adultMinKg: 22,  adultMaxKg: 40,  sizeCategory: 'large'  },
  'beagle':                          { adultMinKg: 9,   adultMaxKg: 11,  sizeCategory: 'small'  },
  'chihuahua':                       { adultMinKg: 1.5, adultMaxKg: 3,   sizeCategory: 'toy'    },
  'poodle':                          { adultMinKg: 20,  adultMaxKg: 32,  sizeCategory: 'large'  },
  'miniature poodle':                { adultMinKg: 4.5, adultMaxKg: 7,   sizeCategory: 'small'  },
  'toy poodle':                      { adultMinKg: 2,   adultMaxKg: 4,   sizeCategory: 'toy'    },
  'bulldog':                         { adultMinKg: 18,  adultMaxKg: 25,  sizeCategory: 'medium' },
  'french bulldog':                  { adultMinKg: 8,   adultMaxKg: 13,  sizeCategory: 'small'  },
  'yorkshire terrier':               { adultMinKg: 2,   adultMaxKg: 3.2, sizeCategory: 'toy'    },
  'dachshund':                       { adultMinKg: 7,   adultMaxKg: 15,  sizeCategory: 'small'  },
  'boxer':                           { adultMinKg: 25,  adultMaxKg: 32,  sizeCategory: 'large'  },
  'shih tzu':                        { adultMinKg: 4,   adultMaxKg: 7.5, sizeCategory: 'small'  },
  'rottweiler':                      { adultMinKg: 35,  adultMaxKg: 60,  sizeCategory: 'giant'  },
  'great dane':                      { adultMinKg: 45,  adultMaxKg: 90,  sizeCategory: 'giant'  },
  'saint bernard':                   { adultMinKg: 54,  adultMaxKg: 82,  sizeCategory: 'giant'  },
  'doberman pinscher':               { adultMinKg: 27,  adultMaxKg: 45,  sizeCategory: 'large'  },
  'border collie':                   { adultMinKg: 14,  adultMaxKg: 20,  sizeCategory: 'medium' },
  'australian shepherd':             { adultMinKg: 16,  adultMaxKg: 32,  sizeCategory: 'medium' },
  'cavalier king charles spaniel':   { adultMinKg: 5.9, adultMaxKg: 8.2, sizeCategory: 'small'  },
  'cocker spaniel':                  { adultMinKg: 10,  adultMaxKg: 14,  sizeCategory: 'medium' },
  // Pitbull-type breeds (APBT / AmStaff / Staffordshire Bull Terrier).
  // Female range used as upper bound since payload gender is available but not yet wired in.
  'pitbull':                         { adultMinKg: 14,  adultMaxKg: 27,  sizeCategory: 'medium' },
  'american pit bull terrier':       { adultMinKg: 14,  adultMaxKg: 27,  sizeCategory: 'medium' },
  'american staffordshire terrier':  { adultMinKg: 18,  adultMaxKg: 32,  sizeCategory: 'medium' },
  'staffordshire bull terrier':      { adultMinKg: 11,  adultMaxKg: 17,  sizeCategory: 'medium' },
  'mixed breed':                     { adultMinKg: 10,  adultMaxKg: 25,  sizeCategory: 'medium' },
};

const FELINE_BENCHMARKS: Record<string, BreedBenchmark> = {
  'domestic shorthair':  { adultMinKg: 3.5, adultMaxKg: 5,   sizeCategory: 'small'  },
  'domestic longhair':   { adultMinKg: 3.5, adultMaxKg: 5,   sizeCategory: 'small'  },
  'domestic mediumhair': { adultMinKg: 3.5, adultMaxKg: 5,   sizeCategory: 'small'  },
  // Maine Coon is classified 'large' — it also has its own slower growth curve below
  'maine coon':          { adultMinKg: 4,   adultMaxKg: 8,   sizeCategory: 'large'  },
  'persian':             { adultMinKg: 3,   adultMaxKg: 5.5, sizeCategory: 'small'  },
  'siamese':             { adultMinKg: 3,   adultMaxKg: 4.5, sizeCategory: 'small'  },
  'ragdoll':             { adultMinKg: 4.5, adultMaxKg: 9,   sizeCategory: 'large'  },
  'bengal':              { adultMinKg: 3.5, adultMaxKg: 7,   sizeCategory: 'small'  },
  'british shorthair':   { adultMinKg: 4,   adultMaxKg: 8,   sizeCategory: 'medium' },
  'sphynx':              { adultMinKg: 3.5, adultMaxKg: 5,   sizeCategory: 'small'  },
  'mixed breed':         { adultMinKg: 3.5, adultMaxKg: 5,   sizeCategory: 'small'  },
};

const SPECIES_DEFAULTS: Record<Species, BreedBenchmark> = {
  canine: { adultMinKg: 10,  adultMaxKg: 25, sizeCategory: 'medium' },
  feline: { adultMinKg: 3.5, adultMaxKg: 5,  sizeCategory: 'small'  },
  other:  { adultMinKg: 1,   adultMaxKg: 10, sizeCategory: 'small'  },
};

// ── Growth curves ─────────────────────────────────────────────────────────────
// Each curve is a list of [ageMonths, fractionOfAdultWeight] control points.
// Values between points are linearly interpolated.
// Sources: Metzger et al. (2006) canine growth charts; IAMS / Hills feline growth data.

type GrowthPoint = [ageMonths: number, fractionOfAdult: number];

// Canine curves by size category
const CANINE_GROWTH_CURVES: Record<BreedSizeCategory, GrowthPoint[]> = {
  // Toy breeds (< 5 kg): fully grown by ~10–12 months
  toy:   [[0, 0.06], [1, 0.18], [2, 0.35], [3, 0.52], [4, 0.65], [6, 0.82], [8, 0.93], [10, 0.98], [12, 1.0]],
  // Small breeds (5–10 kg): fully grown by ~12 months
  small: [[0, 0.05], [1, 0.15], [2, 0.28], [3, 0.42], [4, 0.54], [6, 0.70], [8, 0.84], [10, 0.93], [12, 0.98], [15, 1.0]],
  // Medium breeds (10–25 kg): fully grown by ~15–18 months
  medium:[[0, 0.05], [2, 0.22], [3, 0.35], [4, 0.46], [6, 0.62], [8, 0.75], [10, 0.85], [12, 0.92], [15, 0.97], [18, 1.0]],
  // Large breeds (25–45 kg): fully grown by ~18–24 months
  large: [[0, 0.04], [2, 0.17], [3, 0.27], [4, 0.37], [6, 0.51], [8, 0.63], [10, 0.73], [12, 0.81], [15, 0.89], [18, 0.95], [24, 1.0]],
  // Giant breeds (> 45 kg): fully grown by ~24–30 months
  giant: [[0, 0.03], [2, 0.13], [3, 0.20], [4, 0.28], [6, 0.40], [8, 0.52], [10, 0.62], [12, 0.70], [15, 0.79], [18, 0.87], [24, 0.95], [30, 1.0]],
};

// Standard feline growth curve (most breeds): fully grown by ~18–24 months
const FELINE_GROWTH_CURVE: GrowthPoint[] = [
  [0, 0.08], [1, 0.13], [2, 0.20], [3, 0.30], [4, 0.40], [5, 0.50],
  [6, 0.58], [8, 0.68], [10, 0.76], [12, 0.84], [15, 0.91], [18, 0.96], [24, 1.0],
];

// Maine Coon and Ragdoll mature slowly — full size at 3–4 years
const FELINE_LARGE_GROWTH_CURVE: GrowthPoint[] = [
  [0, 0.06], [2, 0.15], [4, 0.28], [6, 0.40], [8, 0.52],
  [12, 0.65], [18, 0.78], [24, 0.88], [36, 0.96], [48, 1.0],
];

const SLOW_MATURING_FELINE_BREEDS = new Set(['maine coon', 'ragdoll']);

/** Piecewise linear interpolation over a growth curve. */
function interpolateGrowthFraction(ageMonths: number, curve: GrowthPoint[]): number {
  if (ageMonths <= curve[0][0]) return curve[0][1];
  if (ageMonths >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];

  for (let i = 0; i < curve.length - 1; i++) {
    const [t0, f0] = curve[i];
    const [t1, f1] = curve[i + 1];
    if (ageMonths >= t0 && ageMonths <= t1) {
      const t = (ageMonths - t0) / (t1 - t0);
      return f0 + t * (f1 - f0);
    }
  }
  return 1.0;
}

/** Fraction of adult ideal weight expected at this age. */
function growthFractionForAge(
  species: Species,
  breedKey: string,
  sizeCategory: BreedSizeCategory,
  ageMonths: number
): number {
  if (species === 'feline') {
    const curve = SLOW_MATURING_FELINE_BREEDS.has(breedKey)
      ? FELINE_LARGE_GROWTH_CURVE
      : FELINE_GROWTH_CURVE;
    return interpolateGrowthFraction(ageMonths, curve);
  }
  return interpolateGrowthFraction(ageMonths, CANINE_GROWTH_CURVES[sizeCategory]);
}

/** Seniors have slightly lower energy needs; trim ideal max by 5%. */
function isSenior(species: Species, ageYears: number): boolean {
  return (species === 'canine' && ageYears >= 7) || (species === 'feline' && ageYears >= 10);
}

// ── BCS estimation ────────────────────────────────────────────────────────────

function estimateBCS(percentOverIdeal: number): number {
  if (percentOverIdeal <= 0)  return 5;
  if (percentOverIdeal <= 10) return 6;
  if (percentOverIdeal <= 20) return 7;
  if (percentOverIdeal <= 30) return 8;
  return 9;
}

// ── Public API ────────────────────────────────────────────────────────────────

function ageYearsFromDOB(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  return (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

export function assessWeight(params: {
  weightKg: number;
  /** ISO-8601 date string from the webhook payload (DateOfBirth). */
  dateOfBirth: string;
  species: Species;
  breed: string;
}): WeightAssessment {
  const { weightKg, dateOfBirth, species, breed } = params;
  const breedKey = breed.toLowerCase().trim();
  const ageYears = ageYearsFromDOB(dateOfBirth);
  const ageMonths = ageYears * 12;

  const table = species === 'canine' ? CANINE_BENCHMARKS : FELINE_BENCHMARKS;
  const benchmark = table[breedKey] ?? SPECIES_DEFAULTS[species];

  // Scale adult range down to what's expected at this age
  const growthFraction = growthFractionForAge(species, breedKey, benchmark.sizeCategory, ageMonths);

  // Senior pets carry slightly less ideal weight
  const seniorFactor = isSenior(species, ageYears) ? 0.95 : 1.0;
  const combinedFactor = growthFraction * seniorFactor;

  const idealRangeKg = {
    min: benchmark.adultMinKg * combinedFactor,
    max: benchmark.adultMaxKg * combinedFactor,
  };

  // Young growing animals should never be flagged overweight on their low end alone
  const isGrowing = growthFraction < 1.0;
  const percentOverIdeal = ((weightKg - idealRangeKg.max) / idealRangeKg.max) * 100;

  // Growing animals get a wider tolerance — 25% over age-expected max before flagging
  const overweightThreshold = isGrowing ? 25 : 15;
  const isOverweight = percentOverIdeal > overweightThreshold;

  const ageLabel = ageMonths < 24
    ? `${Math.round(ageMonths)}-month-old`
    : `${ageYears.toFixed(1)}-year-old`;

  return {
    isOverweight,
    currentWeightKg: weightKg,
    idealRangeKg: {
      min: Math.round(idealRangeKg.min * 100) / 100,
      max: Math.round(idealRangeKg.max * 100) / 100,
    },
    percentOverIdeal: Math.max(0, Math.round(percentOverIdeal * 10) / 10),
    bcsEstimate: estimateBCS(percentOverIdeal),
    note: isOverweight
      ? `${ageLabel} ${breed} is ~${Math.round(percentOverIdeal)}% above age-expected ideal maximum (BCS ${estimateBCS(percentOverIdeal)}/9)`
      : `${ageLabel} ${breed} is within healthy weight range for its age`,
  };
}
