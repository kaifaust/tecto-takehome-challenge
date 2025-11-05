import type { ContractFields, ContractFieldKey } from '@/lib/contract-schema';
import type { ExtractaResponse } from './services/extracta';
import type { AzureResponse } from './services/azure';

export type { ContractFields, ContractFieldKey };

export type ServiceProvider = 'extracta' | 'azure';

export interface APIServiceResult<T = unknown> {
  status: 'success' | 'error';
  latencyMs?: number;
  data?: T;
  error?: string;
}

export interface APIContractResult {
  contractId: string;
  filename: string;
  services: {
    extracta: APIServiceResult<ExtractaResponse>;
    azure: APIServiceResult<AzureResponse>;
  };
}

export interface APIBatchResponse {
  timestamp: string;
  contracts: APIContractResult[];
}
