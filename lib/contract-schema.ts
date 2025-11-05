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

export type ContractFields = {
  [K in ContractFieldKey]?: string | null;
};

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

export function getAzureQueryFields(): string {
  return CONTRACT_FIELD_KEYS.map((key) => AZURE_FIELD_NAMES[key]).join(',');
}

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
