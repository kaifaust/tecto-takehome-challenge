/**
 * Extracta.ai API Client
 */

import { env } from '@/lib/env';
import type { ExtractaResponse } from '@/types/services/extracta';

export class ExtractaClient {
  private readonly apiKey: string;
  private readonly endpoint: string;

  constructor() {
    this.apiKey = env.extracta.apiKey;
    this.endpoint = env.extracta.endpoint;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.endpoint}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Extracta API error: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Get batch results for a specific extraction
   */
  async getBatchResults(
    extractionId: string,
    batchId: string,
    fileId?: string
  ): Promise<ExtractaResponse> {
    return this.request<ExtractaResponse>('/getBatchResults', {
      method: 'POST',
      body: JSON.stringify({
        extractionId,
        batchId,
        ...(fileId && { fileId }),
      }),
    });
  }

  /**
   * Create a new extraction
   * If fields are not provided, defaults to the standard contract fields
   */
  async createExtraction(config: {
    name: string;
    description?: string;
    language?: string;
    fields?: Array<{
      key: string;
      type?: string;
      description?: string;
      example?: string;
    }>;
  }): Promise<{ extractionId: string }> {
    // Import here to avoid circular dependencies
    const { getExtractaFieldDefinitions } = await import('@/lib/contract-schema');

    return this.request<{ extractionId: string }>('/createExtraction', {
      method: 'POST',
      body: JSON.stringify({
        extractionDetails: {
          name: config.name,
          description: config.description || '',
          language: config.language || 'English',
          fields: config.fields || getExtractaFieldDefinitions(),
        },
      }),
    });
  }

  /**
   * Upload file buffer to an extraction batch (server)
   */
  async uploadFileBuffer(
    extractionId: string,
    batchId: string,
    fileBuffer: Buffer,
    filename: string
  ): Promise<{ batchId: string }> {
    // Node.js FormData from buffer
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const FormData = require('form-data');
    const formData = new FormData();

    formData.append('extractionId', extractionId);
    // Only append batchId if it's provided (non-empty)
    if (batchId) {
      formData.append('batchId', batchId);
    }
    formData.append('files', fileBuffer, {
      filename,
      contentType: 'application/pdf',
    });

    const url = `${this.endpoint}/uploadFiles`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...formData.getHeaders(),
      },
      body: formData.getBuffer(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Extracta API error: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    return response.json();
  }
}

export const extractaClient = new ExtractaClient();
