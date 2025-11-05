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

export type ExtractaContractData = {
  [key: string]: string | undefined;
};
