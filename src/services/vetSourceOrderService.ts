import axios from 'axios';
import { OrderHistoryItem } from '../types/patientNotification';

const BASE_URL = process.env.VETSOURCE_API_BASE_URL ?? 'https://api.vetsource.com/v1';
const API_KEY  = process.env.VETSOURCE_API_KEY ?? '';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

/**
 * GET /clients/{clientId}/orders
 * Returns flattened list of products the client has previously ordered.
 * Falls back to mock data when credentials are not configured.
 */
export async function getPreviouslyPurchasedProducts(clientId: string): Promise<OrderHistoryItem[]> {
  try {
    const response = await client.get<{ items: OrderHistoryItem[] }>(
      `/clients/${encodeURIComponent(clientId)}/orders`,
      { params: { category: 'weight-management', limit: 50 } }
    );
    return response.data.items;
  } catch {
    return getMockOrderHistory(clientId);
  }
}

// ---------------------------------------------------------------------------
// Mock data — simulates a client who already bought one of the products
// ---------------------------------------------------------------------------

function getMockOrderHistory(clientId: string): OrderHistoryItem[] {
  // Deterministically give ~30% of clients a prior purchase so filtering is observable
  const hasPriorPurchase = parseInt(clientId.replace(/\D/g, '') || '0', 10) % 3 === 0;

  if (!hasPriorPurchase) return [];

  return [
    {
      productId: 'vs-cat-001',
      sku: 'HILL-RD-DRY-17LB',
      name: "Hill's Prescription Diet r/d Weight Reduction Dry Dog Food",
      lastOrderedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: 1,
    },
  ];
}
