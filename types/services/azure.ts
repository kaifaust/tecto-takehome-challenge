export interface AzureResponse {
  status: 'succeeded' | 'running' | 'failed';
  createdDateTime: string;
  lastUpdatedDateTime: string;
  analyzeResult: AzureAnalyzeResult;
}

export interface AzureAnalyzeResult {
  apiVersion: string;
  modelId: string;
  stringIndexType: string;
  content: string;
  pages: AzurePage[];
  paragraphs?: AzureParagraph[];
  documents: AzureDocument[];
  contentFormat: string;
}

export interface AzurePage {
  pageNumber: number;
  angle: number;
  width: number;
  height: number;
  unit: string;
  words: AzureWord[];
  lines: AzureLine[];
  spans: AzureSpan[];
}

export interface AzureWord {
  content: string;
  polygon: number[];
  confidence: number;
  span: AzureSpan;
}

export interface AzureLine {
  content: string;
  polygon: number[];
  spans: AzureSpan[];
}

export interface AzureParagraph {
  spans: AzureSpan[];
  boundingRegions: AzureBoundingRegion[];
  role?: string;
  content: string;
}

export interface AzureSpan {
  offset: number;
  length: number;
}

export interface AzureBoundingRegion {
  pageNumber: number;
  polygon: number[];
}

export interface AzureDocument {
  docType: string;
  boundingRegions: AzureBoundingRegion[];
  fields: AzureContractFields;
  confidence: number;
  spans: AzureSpan[];
}

export type AzureContractFields = {
  [key: string]: AzureFieldTypes | undefined;
};

export type AzureFieldTypes =
  | AzureField<string>
  | AzureDateField
  | AzureArrayField
  | AzureObjectField;

export interface AzureField<T> {
  type: string;
  valueString?: T;
  content: string;
  boundingRegions: AzureBoundingRegion[];
  confidence: number;
  spans: AzureSpan[];
}

export interface AzureDateField {
  type: 'date';
  valueDate: string; // ISO date string
  content: string;
  boundingRegions: AzureBoundingRegion[];
  confidence: number;
  spans: AzureSpan[];
}

export interface AzureArrayField {
  type: 'array';
  valueArray: AzureObjectField[];
}

export interface AzureObjectField {
  type: 'object';
  valueObject: Record<string, AzureField<string> | AzureAddressField>;
}

export interface AzureAddressField {
  type: 'address';
  content: string;
  boundingRegions: AzureBoundingRegion[];
  spans: AzureSpan[];
  valueAddress: {
    houseNumber?: string;
    road?: string;
    postalCode?: string;
    city?: string;
    state?: string;
    countryRegion?: string;
    streetAddress?: string;
    unit?: string;
  };
}

export interface AzureParty {
  Name?: AzureField<string>;
  Address?: AzureAddressField;
  ReferenceName?: AzureField<string>;
  Clause?: AzureField<string>;
}

export interface AzureJurisdiction {
  Clause?: AzureField<string>;
  Region?: AzureField<string>;
}
