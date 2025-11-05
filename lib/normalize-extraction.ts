import type { ContractFields, ServiceProvider } from '@/types/api';
import type { AzureResponse } from '@/types/services/azure';
import type { ExtractaResponse } from '@/types/services/extracta';
import {
  CONTRACT_FIELD_KEYS,
  AZURE_FIELD_NAMES,
  EXTRACTA_FIELD_NAMES,
  type ContractFieldKey,
} from '@/lib/contract-schema';

export interface NormalizedQA {
  source: ServiceProvider;
  answers: ContractFields;
}

function extractAzureFieldValue(field: unknown): string | undefined {
  if (!field || typeof field !== 'object') return undefined;

  const fieldObj = field as Record<string, unknown>;

  if (fieldObj.type === 'array' && Array.isArray(fieldObj.valueArray)) {
    const items: string[] = [];
    for (const item of fieldObj.valueArray) {
      if (typeof item === 'object' && item !== null) {
        const itemObj = item as Record<string, unknown>;
        if (itemObj.type === 'object' && typeof itemObj.valueObject === 'object' && itemObj.valueObject !== null) {
          const valueObject = itemObj.valueObject as Record<string, unknown>;
          if (typeof valueObject.Name === 'object' && valueObject.Name !== null) {
            const nameField = valueObject.Name as Record<string, unknown>;
            if (typeof nameField.content === 'string') {
              items.push(nameField.content);
            }
          }
          if (typeof valueObject.Region === 'object' && valueObject.Region !== null) {
            const regionField = valueObject.Region as Record<string, unknown>;
            if (typeof regionField.content === 'string') {
              items.push(regionField.content);
            }
          }
        }
      }
    }
    return items.length > 0 ? items.join(', ') : undefined;
  }

  const content = typeof fieldObj.content === 'string' ? fieldObj.content : undefined;
  const valueString = typeof fieldObj.valueString === 'string' ? fieldObj.valueString : undefined;
  const valueDate = typeof fieldObj.valueDate === 'string' ? fieldObj.valueDate : undefined;

  return content || valueString || valueDate;
}

export function normalizeAzureResponse(response: AzureResponse): NormalizedQA {
  const doc = response.analyzeResult.documents[0];
  if (!doc) {
    return { source: 'azure', answers: {} };
  }

  const fields = doc.fields;
  const answers: ContractFields = {};

  CONTRACT_FIELD_KEYS.forEach((key: ContractFieldKey) => {
    const azureFieldName = AZURE_FIELD_NAMES[key];
    const azureField = fields[azureFieldName];
    const value = extractAzureFieldValue(azureField as never);
    answers[key] = value === undefined ? null : value;
  });

  return {
    source: 'azure',
    answers,
  };
}

export function normalizeExtractaResponse(
  response: ExtractaResponse
): NormalizedQA {
  const file = response.files[0];
  if (!file || file.status !== 'processed') {
    return { source: 'extracta', answers: {} };
  }

  const data = file.result;
  const answers: ContractFields = {};

  CONTRACT_FIELD_KEYS.forEach((key: ContractFieldKey) => {
    const extractaFieldName = EXTRACTA_FIELD_NAMES[key];
    const value = data[extractaFieldName];
    answers[key] = value === undefined ? null : value;
  });

  return {
    source: 'extracta',
    answers,
  };
}

