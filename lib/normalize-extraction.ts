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
 * Extract string value from Azure field (handles different field types)
 */
function extractAzureFieldValue(
  field: { valueString?: string; valueDate?: string; content?: string } | undefined
): string | undefined {
  if (!field) return undefined;
  return field.valueString || field.valueDate || field.content;
}

/**
 * Extract parties from Azure array field
 */
function extractAzureParties(
  field:
    | {
        type: string;
        valueArray?: Array<{
          valueObject?: Record<
            string,
            { valueString?: string; content?: string }
          >;
        }>;
      }
    | undefined
): string | undefined {
  if (!field || field.type !== 'array' || !field.valueArray) return undefined;
  const names = field.valueArray
    .map(
      (p) => p.valueObject?.Name?.valueString || p.valueObject?.Name?.content
    )
    .filter(Boolean);
  return names.length > 0 ? names.join(', ') : undefined;
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

    // Special handling for Parties (array field)
    if (key === 'parties') {
      answers[key] = extractAzureParties(azureField as never);
    } else {
      answers[key] = extractAzureFieldValue(azureField as never);
    }
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
    answers[key] = data[extractaFieldName];
  });

  return {
    source: 'extracta',
    answers,
  };
}

