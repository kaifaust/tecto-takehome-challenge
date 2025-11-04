/**
 * Generic API wrapper types for contract extraction services
 */

import type { ContractFields, ContractFieldKey } from '@/lib/contract-schema';

// Re-export for convenience
export type { ContractFields, ContractFieldKey };

// ============================================
// Service Provider
// ============================================

export type ServiceProvider = 'extracta' | 'azure';

// ============================================
// API Response Wrapper Types
// ============================================

export interface APIContractResult {
  contractId: string;
  filename: string;
  services: Record<ServiceProvider, APIServiceResult<any>>;
}

export interface APIServiceResult<T> {
  status: 'success' | 'error';
  latencyMs?: number;
  data?: T;
  error?: string;
}

export interface APIBatchResponse {
  timestamp: string;
  contracts: APIContractResult[];
}
