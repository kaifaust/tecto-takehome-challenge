/**
 * Extracta.ai API Response Types
 */

export interface ExtractaResponse {
  extractionId: string;
  batchId: string;
  fileId?: string;
  files: ExtractaFile[];
}

export interface ExtractaFile {
  fileId?: string;
  fileName: string;
  status: 'processed' | 'waiting' | 'error';
  result: ExtractaContractData;
  url: string;
}

/**
 * Extracta.ai contract data fields (PascalCase matching Azure's format)
 * We use an index signature to allow any field, as Extracta may return additional fields
 */
export type ExtractaContractData = {
  [key: string]: string | undefined;
};
