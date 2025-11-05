/**
 * Normalize Q&A extraction results from both APIs into a unified schema for eval
 */

import type { ContractFields, ServiceProvider } from '@/types/api';
import type { AzureResponse } from '@/types/services/azure';
import type { ExtractaResponse } from '@/types/services/extracta';
import {
  CONTRACT_FIELD_KEYS,
  AZURE_FIELD_NAMES,
  EXTRACTA_FIELD_NAMES,
  type ContractFieldKey,
} from '@/lib/contract-schema';

// ============================================
// Unified Q&A Schema for Eval Pipeline
// ============================================

export interface NormalizedQA {
  source: ServiceProvider;
  answers: ContractFields;
}

// ============================================
// Normalization Functions
// ============================================

/**
 * Extract string value from Azure field
 */
function extractAzureFieldValue(field: any): string | undefined {
  if (!field) return undefined;

  // Handle array types (Parties, Jurisdictions)
  if (field.type === 'array' && field.valueArray) {
    const items: string[] = [];
    for (const item of field.valueArray) {
      if (item.type === 'object' && item.valueObject) {
        // For Parties: extract Name field
        if (item.valueObject.Name?.content) {
          items.push(item.valueObject.Name.content);
        }
        // For Jurisdictions: extract Region field
        if (item.valueObject.Region?.content) {
          items.push(item.valueObject.Region.content);
        }
      }
    }
    return items.length > 0 ? items.join(', ') : undefined;
  }

  // Handle simple string/date fields
  return field.content || field.valueString || field.valueDate;
}

/**
 * Normalize Azure Document Intelligence response to Q&A format
 */
export function normalizeAzureResponse(response: AzureResponse): NormalizedQA {
  const doc = response.analyzeResult.documents[0];
  if (!doc) {
    return { source: 'azure', answers: {} };
  }

  const fields = doc.fields;
  const answers: ContractFields = {};

  // Map each standard field using the centralized schema
  CONTRACT_FIELD_KEYS.forEach((key: ContractFieldKey) => {
    const azureFieldName = AZURE_FIELD_NAMES[key];
    const azureField = fields[azureFieldName];

    // Just extract the value - Azure already did the hard work
    const value = extractAzureFieldValue(azureField as never);

    // Convert undefined to null for consistent JSON serialization
    answers[key] = value === undefined ? null : value;
  });

  return {
    source: 'azure',
    answers,
  };
}

/**
 * Normalize Extracta.ai response to Q&A format
 */
export function normalizeExtractaResponse(
  response: ExtractaResponse
): NormalizedQA {
  const file = response.files[0];
  if (!file || file.status !== 'processed') {
    return { source: 'extracta', answers: {} };
  }

  const data = file.result;
  const answers: ContractFields = {};

  // Map each standard field using the centralized schema
  CONTRACT_FIELD_KEYS.forEach((key: ContractFieldKey) => {
    const extractaFieldName = EXTRACTA_FIELD_NAMES[key];
    const value = data[extractaFieldName];

    // Convert undefined to null for consistent JSON serialization
    answers[key] = value === undefined ? null : value;
  });

  return {
    source: 'extracta',
    answers,
  };
}

