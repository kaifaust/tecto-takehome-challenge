/**
 * Centralized contract field schema
 * Single source of truth for all contract data extraction fields
 */

// ============================================
// Contract Field Definitions
// ============================================

/**
 * Contract field keys used across all services
 */
export const CONTRACT_FIELD_KEYS = [
  'contractId',
  'title',
  'parties',
  'effectiveDate',
  'expirationDate',
  'contractDuration',
  'contractValue',
  'subjectMatter',
  'governingLaw',
  'keyObligations',
] as const;

export type ContractFieldKey = (typeof CONTRACT_FIELD_KEYS)[number];

/**
 * Unified contract field values (camelCase for TS)
 */
export type ContractFields = {
  [K in ContractFieldKey]?: string;
};

// ============================================
// Service-Specific Field Mappings
// ============================================

/**
 * Azure Document Intelligence field names (PascalCase)
 */
export const AZURE_FIELD_NAMES: Record<ContractFieldKey, string> = {
  contractId: 'ContractId',
  title: 'Title',
  parties: 'Parties',
  effectiveDate: 'EffectiveDate',
  expirationDate: 'ExpirationDate',
  contractDuration: 'ContractDuration',
  contractValue: 'ContractValue',
  subjectMatter: 'SubjectMatter',
  governingLaw: 'GoverningLaw',
  keyObligations: 'KeyObligations',
} as const;

/**
 * Extracta.ai field names (snake_case)
 */
export const EXTRACTA_FIELD_NAMES: Record<ContractFieldKey, string> = {
  contractId: 'contract_id',
  title: 'contract_title',
  parties: 'parties',
  effectiveDate: 'effective_date',
  expirationDate: 'expiration_date',
  contractDuration: 'contract_duration',
  contractValue: 'contract_value',
  subjectMatter: 'subject_matter',
  governingLaw: 'governing_law',
  keyObligations: 'key_obligations',
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
 */
export function getExtractaFieldDefinitions(): Array<{
  key: string;
  type: string;
  description: string;
}> {
  const descriptions: Record<ContractFieldKey, string> = {
    contractId: 'Unique identifier for the contract',
    title: 'Title of the contract',
    parties: 'Names of all parties involved, comma-separated',
    effectiveDate: 'Date when the contract becomes effective',
    expirationDate: 'Date when the contract expires',
    contractDuration: 'Duration of the contract (e.g., "2 years")',
    contractValue: 'Total value or price of the contract',
    subjectMatter: 'Brief description of what the contract is about',
    governingLaw: 'Jurisdiction or law governing the contract',
    keyObligations: 'Main obligations or responsibilities',
  };

  return CONTRACT_FIELD_KEYS.map((key) => ({
    key: EXTRACTA_FIELD_NAMES[key],
    type: 'string',
    description: descriptions[key],
  }));
}
