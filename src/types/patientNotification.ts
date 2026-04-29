// Matches the actual SyncVet webhook payload shape (EntityName: "Patient")

export type Species = 'canine' | 'feline' | 'other';

export interface ClientPatientRelationship {
  Type: string;
  ClientId: string;
  ClientPimsId: string;
  PatientId: string;
  PatientPimsId: string;
  IsPrimary: boolean;
  Percentage: number;
  StartDate: string | null;
  EndDate: string | null;
  Id: string;
  IsDeleted: boolean | null;
}

export interface PatientIdentifier {
  PatientId: string;
  Type: string;
  SubType: string | null;
  Date: string | null;
  Identifier: string;
  Id: string;
  IsDeleted: boolean | null;
}

export interface PatientData {
  PimsId: string;
  PrimaryClientId: string;
  Name: string;
  SpeciesCode: string;          // e.g. "CANINE", "FELINE"
  SpeciesDescription: string;
  BreedCode: string;            // e.g. "PIT"
  BreedDescription: string;     // e.g. "Pitbull" — used for weight benchmarks
  ColorCode: string | null;
  ColorDescription: string | null;
  GenderCode: string;
  GenderDescription: string;
  DateOfBirth: string;          // ISO-8601, e.g. "2023-06-26T00:00:00"
  DateOfDeath: string | null;
  PimsIsDeceased: boolean | null;
  IsDeceased: boolean;
  FlaggedInactive: boolean;
  EnteredDate: string;
  /** Weight value — unit given by CurrentWeightUnit; defaults to lbs when empty (US PIMS) */
  CurrentWeight: number;
  /** "lbs", "kg", or "" (treated as lbs for US practices) */
  CurrentWeightUnit: string;
  SuspendReminders: boolean;
  Notes: string;
  SoftDeleted: boolean;
  ClientPatientRelationships: ClientPatientRelationship[];
  PatientIdentifiers: PatientIdentifier[];
  PatientAlerts: unknown[];
  PatientAttributes: unknown[];
  SiteId: string;
  Id: string;
  IsDeleted: boolean;
}

export interface PatientNotification {
  Data: PatientData;
  EntityName: string;
  VetSourcePracticeId: string;  // Vetsource practice ID — used for catalog / order history calls
  PracticeId: string;           // PIMS-native practice ID
  SyncVetId: string;            // SyncVet practice GUID — used for real-time transaction calls
  DataSourceName: string;
  OriginalDataSourceName: string | null;
  UtcOffset: string;
  WebhookNotificationId: string;
  ExternalPracticeId: string;
}

// ── Downstream types ──────────────────────────────────────────────────────────

export interface CatalogProduct {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  species: Species[];
  prescriptionRequired: boolean;
  autoshipEligible: boolean;
  priceUsd: number;
}

export interface OrderHistoryItem {
  productId: string;
  sku: string;
  name: string;
  lastOrderedDate: string;
  quantity: number;
}

export interface TransactionLineItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface WeightAssessment {
  isOverweight: boolean;
  currentWeightKg: number;
  idealRangeKg: { min: number; max: number };
  percentOverIdeal: number;
  bcsEstimate: number;
  note: string;
}

export interface RecommendationResponse {
  data?: { url: string };
  error?: string | null;
  recommended: boolean;
  reason?: string;
  assessment?: WeightAssessment;
  products?: CatalogProduct[];
  filteredOut?: {
    previouslyPurchased: number;
    inCurrentTransaction: number;
  };
}
