import axios from 'axios';
import { CatalogProduct, Species, WeightAssessment } from '../types/patientNotification';

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
 * GET /catalog/products
 * Returns weight-management diet products filtered by species.
 * Falls back to mock data so the demo works without live credentials.
 */
export async function getRecommendedProducts(params: {
  species: Species;
  breed: string;
  weightAssessment: WeightAssessment;
}): Promise<CatalogProduct[]> {
  try {
    const response = await client.get<{ products: CatalogProduct[] }>('/catalog/products', {
      params: {
        species: params.species,
        category: 'weight-management',
        bcsMin: 6,
        limit: 10,
      },
    });
    return response.data.products;
  } catch {
    // Fall back to mock data during hackathon / when API credentials are not set
    return getMockCatalogProducts(params.species);
  }
}

// ---------------------------------------------------------------------------
// Mock data — realistic VetSource PIM catalog payload shape
// ---------------------------------------------------------------------------

function getMockCatalogProducts(species: Species): CatalogProduct[] {
  const canineProducts: CatalogProduct[] = [
    {
      productId: 'vs-cat-001',
      sku: 'HILL-RD-DRY-17LB',
      name: "Hill's Prescription Diet r/d Weight Reduction Dry Dog Food",
      brand: "Hill's",
      category: 'weight-management',
      species: ['canine'],
      prescriptionRequired: true,
      autoshipEligible: true,
      priceUsd: 72.99,
    },
    {
      productId: 'vs-cat-002',
      sku: 'HILL-MET-DRY-17LB',
      name: "Hill's Prescription Diet Metabolic Weight Management Dry Dog Food",
      brand: "Hill's",
      category: 'weight-management',
      species: ['canine'],
      prescriptionRequired: true,
      autoshipEligible: true,
      priceUsd: 79.49,
    },
    {
      productId: 'vs-cat-003',
      sku: 'RC-SAT-DOG-8LB',
      name: 'Royal Canin Veterinary Diet Satiety Support Dry Dog Food',
      brand: 'Royal Canin',
      category: 'weight-management',
      species: ['canine'],
      prescriptionRequired: true,
      autoshipEligible: true,
      priceUsd: 65.00,
    },
    {
      productId: 'vs-cat-004',
      sku: 'PURI-OM-DRY-18LB',
      name: 'Purina Pro Plan Veterinary Diets OM Overweight Management Formula',
      brand: 'Purina',
      category: 'weight-management',
      species: ['canine'],
      prescriptionRequired: true,
      autoshipEligible: true,
      priceUsd: 68.50,
    },
  ];

  const felineProducts: CatalogProduct[] = [
    {
      productId: 'vs-cat-010',
      sku: 'HILL-RD-CAT-4LB',
      name: "Hill's Prescription Diet r/d Weight Reduction Dry Cat Food",
      brand: "Hill's",
      category: 'weight-management',
      species: ['feline'],
      prescriptionRequired: true,
      autoshipEligible: true,
      priceUsd: 38.99,
    },
    {
      productId: 'vs-cat-011',
      sku: 'HILL-MET-CAT-4LB',
      name: "Hill's Prescription Diet Metabolic Weight Management Dry Cat Food",
      brand: "Hill's",
      category: 'weight-management',
      species: ['feline'],
      prescriptionRequired: true,
      autoshipEligible: true,
      priceUsd: 42.99,
    },
    {
      productId: 'vs-cat-012',
      sku: 'RC-SAT-CAT-4LB',
      name: 'Royal Canin Veterinary Diet Satiety Support Dry Cat Food',
      brand: 'Royal Canin',
      category: 'weight-management',
      species: ['feline'],
      prescriptionRequired: true,
      autoshipEligible: true,
      priceUsd: 40.00,
    },
  ];

  return species === 'canine' ? canineProducts : felineProducts;
}
