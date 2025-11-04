/**
 * Azure Document Intelligence API Client
 */

import { env } from '@/lib/env';
import { getAzureQueryFields } from '@/lib/contract-schema';
import type { AzureResponse } from '@/types/services/azure';

export class AzureDocumentIntelligenceClient {
  private readonly key: string;
  private readonly endpoint: string;
  private readonly apiVersion = '2024-11-30';
  private readonly queryFields = getAzureQueryFields();

  constructor() {
    this.key = env.azure.key;
    this.endpoint = env.azure.endpoint.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Analyze a contract document from file buffer with query fields for Q&A
   */
  async analyzeContractFromBuffer(
    fileBuffer: Buffer
  ): Promise<{ operationId: string; operationLocation: string }> {
    const path = `/documentintelligence/documentModels/prebuilt-contract:analyze?api-version=${this.apiVersion}&features=queryFields&queryFields=${this.queryFields}`;

    const response = await fetch(`${this.endpoint}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'Ocp-Apim-Subscription-Key': this.key,
      },
      body: fileBuffer as unknown as BodyInit,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Azure API error: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    // Azure returns the operation location in the headers
    const operationLocation = response.headers.get('Operation-Location');
    if (!operationLocation) {
      throw new Error('No Operation-Location header in response');
    }

    // Extract operation ID from the location URL
    const operationId = operationLocation.split('/').pop()?.split('?')[0] || '';

    return {
      operationId,
      operationLocation,
    };
  }

  /**
   * Get analysis result by operation location
   */
  async getAnalysisResult(operationLocation: string): Promise<AzureResponse> {
    const response = await fetch(operationLocation, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': this.key,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Azure API error: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Poll for analysis completion
   */
  async waitForAnalysis(
    operationLocation: string,
    maxAttempts = 30,
    delayMs = 2000
  ): Promise<AzureResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.getAnalysisResult(operationLocation);

      if (result.status === 'succeeded') {
        return result;
      }

      if (result.status === 'failed') {
        throw new Error('Azure analysis failed');
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error('Azure analysis timed out');
  }
}

export const azureClient = new AzureDocumentIntelligenceClient();
