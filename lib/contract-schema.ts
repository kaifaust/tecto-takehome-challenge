/**
 * Centralized contract field schema
 * Single source of truth for all contract data extraction fields
 */

// ============================================
// Contract Field Definitions
// ============================================

/**
 * Contract field keys used across all services
 * LIMITED TO AZURE'S NATIVE FIELDS ONLY (for fair comparison)
 * Azure prebuilt-contract supports these 9 fields (as of 2024-11-30 GA)
 */
export const CONTRACT_FIELD_KEYS = [
  'contractId',
  'title',
  'parties',
  'effectiveDate',
  'executionDate',
  'expirationDate',
  'contractDuration',
  'renewalDate',
  'jurisdictions',
] as const;

export type ContractFieldKey = (typeof CONTRACT_FIELD_KEYS)[number];

/**
 * Unified contract field values (camelCase for TS)
 * Fields can be string, null (explicitly absent in source), or undefined (not yet processed)
 */
export type ContractFields = {
  [K in ContractFieldKey]?: string | null;
};

// ============================================
// Service-Specific Field Mappings
// ============================================

/**
 * Azure Document Intelligence prebuilt-contract field names (PascalCase)
 * These are the ONLY fields that Azure's prebuilt contract model returns
 */
export const AZURE_FIELD_NAMES: Record<ContractFieldKey, string> = {
  contractId: 'ContractId',
  title: 'Title',
  parties: 'Parties',
  effectiveDate: 'EffectiveDate',
  executionDate: 'ExecutionDate',
  expirationDate: 'ExpirationDate',
  contractDuration: 'ContractDuration',
  renewalDate: 'RenewalDate',
  jurisdictions: 'Jurisdictions',
} as const;

/**
 * Extracta.ai field names to request
 * We use simple PascalCase names matching Azure to keep them aligned
 * Extracta will convert these to snake_case in responses (e.g., "Parties" → "parties")
 */
export const EXTRACTA_FIELD_NAMES: Record<ContractFieldKey, string> = {
  contractId: 'ContractId',
  title: 'Title',
  parties: 'Parties',
  effectiveDate: 'EffectiveDate',
  executionDate: 'ExecutionDate',
  expirationDate: 'ExpirationDate',
  contractDuration: 'ContractDuration',
  renewalDate: 'RenewalDate',
  jurisdictions: 'Jurisdictions',
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Get Azure query fields as comma-separated string for API
 */
export function getAzureQueryFields(): string {
  return CONTRACT_FIELD_KEYS.map((key) => AZURE_FIELD_NAMES[key]).join(',');
}

/**
 * Get Extracta field definitions for extraction creation
 * Descriptions must be simple and match Azure's field semantics
 */
export function getExtractaFieldDefinitions(): Array<{
  key: string;
  type: string;
  description: string;
}> {
  const descriptions: Record<ContractFieldKey, string> = {
    contractId: 'What is the contract ID?',
    title: 'What is the contract title?',
    parties: 'Who are the parties to this contract?',
    effectiveDate: 'What is the effective date?',
    executionDate: 'What is the execution date?',
    expirationDate: 'What is the expiration date?',
    contractDuration: 'What is the contract duration?',
    renewalDate: 'What is the renewal date?',
    jurisdictions: 'What are the jurisdictions?',
  };

  return CONTRACT_FIELD_KEYS.map((key) => ({
    key: EXTRACTA_FIELD_NAMES[key],
    type: 'string',
    description: descriptions[key],
  }));
}
