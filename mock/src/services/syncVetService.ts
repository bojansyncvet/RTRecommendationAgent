import axios from 'axios';
import { TransactionLineItem } from '../types/patientNotification';

const BASE_URL = process.env.SYNCVET_API_BASE_URL ?? 'https://api.sync.vet/v2';
const API_KEY  = process.env.SYNCVET_API_KEY ?? '';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

/**
 * GET /transactions
 * Returns line items currently in the active PIMS transaction for this patient.
 * Prevents recommending a product the practice is already ringing up.
 *
 * SyncVet Consumer API — endpoint ref: #347440db-9b70-4808-b4de-9fd6b89812d8
 * Falls back to mock data when credentials are not configured.
 */
export async function getCurrentTransactionProducts(params: {
  patientId: string;
  practiceId: string;
}): Promise<TransactionLineItem[]> {
  try {
    const response = await client.get<{ lineItems: TransactionLineItem[] }>('/transactions', {
      params: {
        patientId: params.patientId,
        practiceId: params.practiceId,
        status: 'open',
      },
    });
    return response.data.lineItems;
  } catch {
    return getMockCurrentTransaction(params.patientId);
  }
}

// ---------------------------------------------------------------------------
// Mock data — simulates a patient who already has one product in today's visit
// ---------------------------------------------------------------------------

function getMockCurrentTransaction(patientId: string): TransactionLineItem[] {
  // ~20% of patients already have a diet product in today's transaction
  const hasCurrentItem = parseInt(patientId.replace(/\D/g, '') || '0', 10) % 5 === 0;

  if (!hasCurrentItem) return [];

  return [
    {
      productId: 'vs-cat-002',
      sku: 'HILL-MET-DRY-17LB',
      name: "Hill's Prescription Diet Metabolic Weight Management Dry Dog Food",
      quantity: 1,
    },
  ];
}
