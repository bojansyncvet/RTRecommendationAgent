import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { PatientNotification, RecommendationResponse, Species } from '../types/patientNotification';
import { assessWeight } from '../utils/weightAssessment';
import { getRecommendedProducts } from '../services/vetSourceCatalogService';
import { getPreviouslyPurchasedProducts } from '../services/vetSourceOrderService';
import { getCurrentTransactionProducts } from '../services/syncVetService';

export async function patientRecommendationHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('PatientRecommendation triggered');

  // ── 1. Parse request body ────────────────────────────────────────────────
  let notification: PatientNotification;
  try {
    notification = (await request.json()) as PatientNotification;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON in request body' });
  }

  // ── 2. Extract fields from the webhook payload ───────────────────────────
  const { Data: patient, VetSourcePracticeId, SyncVetId } = notification;

  if (!patient || !VetSourcePracticeId || !SyncVetId) {
    return jsonResponse(400, { error: 'Missing required top-level fields: Data, VetSourcePracticeId, SyncVetId' });
  }

  const {
    Id: patientId,
    PimsId: pimsId,
    PrimaryClientId: clientId,
    Name: patientName,
    SpeciesCode,
    BreedDescription,
    DateOfBirth,
    CurrentWeight,
    CurrentWeightUnit,
    IsDeceased,
    FlaggedInactive,
  } = patient;

  // Skip deceased or inactive patients
  if (IsDeceased) {
    return jsonResponse(200, { recommended: false, reason: 'Patient is deceased' } satisfies RecommendationResponse);
  }
  if (FlaggedInactive) {
    return jsonResponse(200, { recommended: false, reason: 'Patient is flagged inactive' } satisfies RecommendationResponse);
  }

  if (!DateOfBirth || CurrentWeight == null || !BreedDescription) {
    return jsonResponse(400, { error: 'Missing required patient fields: DateOfBirth, CurrentWeight, BreedDescription' });
  }

  // ── 3. Normalise inputs ──────────────────────────────────────────────────
  const species = mapSpeciesCode(SpeciesCode);

  // CurrentWeightUnit is often empty in US PIMS (AviMark, Cornerstone) — default to lbs
  const weightKg = resolveWeightKg(CurrentWeight, CurrentWeightUnit);

  context.log(`Patient ${patientName} (${patientId}) — ${weightKg.toFixed(1)} kg, species: ${species}, breed: ${BreedDescription}`);

  // ── 4. Assess body weight ────────────────────────────────────────────────
  const assessment = assessWeight({
    weightKg,
    dateOfBirth: DateOfBirth,
    species,
    breed: BreedDescription,
  });

  if (!assessment.isOverweight) {
    return jsonResponse(200, {
      recommended: false,
      reason: assessment.note,
      assessment,
    } satisfies RecommendationResponse);
  }

  context.log(`Overweight: ${assessment.percentOverIdeal}% above age-expected ideal — fetching catalog`);

  // ── 5. Get recommended products from VetSource catalog ───────────────────
  const catalogProducts = await getRecommendedProducts({ species, breed: BreedDescription, weightAssessment: assessment });

  if (catalogProducts.length === 0) {
    return jsonResponse(200, {
      recommended: false,
      reason: 'No weight-management products found in catalog for this species',
      assessment,
    } satisfies RecommendationResponse);
  }

  // ── 6. Filter: previously purchased + currently in transaction ───────────
  // VetSource order history uses the Vetsource client ID
  // SyncVet real-time transactions use the SyncVet practice GUID + PIMS patient ID
  const [previouslyPurchased, currentTransactionItems] = await Promise.all([
    getPreviouslyPurchasedProducts(clientId),
    getCurrentTransactionProducts({ patientId, practiceId: SyncVetId }),
  ]);

  const previouslyPurchasedIds  = new Set(previouslyPurchased.map((p) => p.productId));
  const currentTransactionIds   = new Set(currentTransactionItems.map((p) => p.productId));

  const newProducts = catalogProducts.filter(
    (p) => !previouslyPurchasedIds.has(p.productId) && !currentTransactionIds.has(p.productId)
  );

  context.log(
    `Catalog: ${catalogProducts.length} | prev purchased: ${previouslyPurchasedIds.size} | in transaction: ${currentTransactionIds.size} | net new: ${newProducts.length}`
  );

  if (newProducts.length === 0) {
    return jsonResponse(200, {
      recommended: false,
      reason: 'All suitable products have already been purchased or are in the current transaction',
      assessment,
    } satisfies RecommendationResponse);
  }

  // ── 7. Build recommendation URL ──────────────────────────────────────────
  const productIds = newProducts.map((p) => p.productId).join(',');
  const recommendationUrl = buildRecommendationUrl(pimsId);

  return jsonResponse(200, {
    data: { url: recommendationUrl },
    error: null,
    recommended: true,
    assessment,
    products: newProducts,
    filteredOut: {
      previouslyPurchased: catalogProducts.filter((p) => previouslyPurchasedIds.has(p.productId)).length,
      inCurrentTransaction: catalogProducts.filter((p) => currentTransactionIds.has(p.productId)).length,
    },
  } satisfies RecommendationResponse);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapSpeciesCode(code: string): Species {
  switch (code.toUpperCase()) {
    case 'CANINE':
    case 'DOG':
      return 'canine';
    case 'FELINE':
    case 'CAT':
      return 'feline';
    default:
      return 'other';
  }
}

function resolveWeightKg(weight: number, unit: string): number {
  // Empty unit string is common in US-based PIMS (AviMark, Cornerstone) — treat as lbs
  const normalised = unit.toLowerCase().trim();
  if (normalised === 'kg') return weight;
  return weight * 0.453592; // lbs → kg
}

function buildRecommendationUrl(pimsId: string): string {
  const base =
    process.env.RECOMMENDATION_POPUP_BASE_URL ??
    'https://app.superblocks.com/code-mode/applications/61b06cfd-b320-4a6b-8744-0bb81ccbcbd2/realtime';
  return `${base}/${pimsId}`;
}

function jsonResponse(status: number, body: unknown): HttpResponseInit {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ── Register ──────────────────────────────────────────────────────────────────
app.http('patientRecommendation', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'recommendations/patient',
  handler: patientRecommendationHandler,
});
