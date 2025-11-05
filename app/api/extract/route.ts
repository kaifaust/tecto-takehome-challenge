import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { extractaClient, azureClient } from '@/lib/api';
import { truncateJson } from '@/lib/truncate';
import { CONTRACTS } from '@/lib/contracts';
import { getCachedResponse, setCachedResponse } from '@/lib/cache';
import { getExtractaFieldDefinitions } from '@/lib/contract-schema';
import type { APIBatchResponse, APIContractResult } from '@/types/api';
import type { ExtractaResponse } from '@/types/services/extracta';
import type { AzureResponse } from '@/types/services/azure';

export async function POST(request: Request) {
  const body = await request.json();
  const selectedIds = body.contractIds || CONTRACTS.map((c) => c.id);

  const results: APIBatchResponse = {
    timestamp: new Date().toISOString(),
    contracts: [],
  };

  const contractsToProcess = CONTRACTS.filter((c) =>
    selectedIds.includes(c.id)
  );

  for (const contract of contractsToProcess) {
    const contractResult: APIContractResult = {
      contractId: contract.id,
      filename: contract.filename,
      services: {
        extracta: { status: 'error', error: 'Not processed' },
        azure: { status: 'error', error: 'Not processed' },
      },
    };

    // Read the PDF file
    const filePath = join(
      process.cwd(),
      'public',
      'data',
      'contracts',
      'pdf',
      contract.filename
    );
    const fileBuffer = await readFile(filePath);

    // Run Extracta.ai
    try {
      const startExtracta = Date.now();

      // Check cache first
      const cached = await getCachedResponse<{ data: ExtractaResponse; latencyMs: number }>(
        'extracta',
        contract.id
      );

      let result: ExtractaResponse;
      let latencyMs: number;

      if (cached) {
        console.log(`Using cached Extracta response for contract ${contract.id}`);
        result = cached.data;
        latencyMs = cached.latencyMs;
      } else {
        // Create extraction with Q&A format fields from centralized schema
        const extractionResponse: { extractionId: string } =
          await extractaClient.createExtraction({
            name: `Contract ${contract.id}`,
            description: 'Contract Q&A extraction for evaluation pipeline',
            language: 'English',
            fields: getExtractaFieldDefinitions(),
          });

        const extractionId = extractionResponse.extractionId;

        // Upload the file (creates new batch automatically)
        const uploadResponse: { batchId: string } =
          await extractaClient.uploadFileBuffer(
            extractionId,
            '',
            fileBuffer,
            contract.filename
          );

        const batchId = uploadResponse.batchId;

        // Poll for results (Extracta processes asynchronously)
        let polledResult: ExtractaResponse | undefined;
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 3000));

          polledResult = await extractaClient.getBatchResults(
            extractionId,
            batchId
          );

          const allProcessed = polledResult.files?.every(
            (file) => file.status === 'processed' || file.status === 'error'
          );

          if (allProcessed) {
            break;
          }

          attempts++;
        }

        if (!polledResult) {
          throw new Error('Extracta failed to return results');
        }

        const allProcessed = polledResult.files?.every(
          (file) => file.status === 'processed' || file.status === 'error'
        );

        if (!allProcessed) {
          throw new Error('Extracta processing timed out after 60 seconds');
        }

        result = polledResult;
        latencyMs = Date.now() - startExtracta;

        // Cache the successful response with latency
        await setCachedResponse('extracta', contract.id, { data: result, latencyMs });
      }

      contractResult.services.extracta = {
        status: 'success',
        latencyMs,
        data: result,
      };
    } catch (error) {
      contractResult.services.extracta = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Run Azure Document Intelligence
    try {
      const startAzure = Date.now();

      // Check cache first
      const cached = await getCachedResponse<{ data: AzureResponse; latencyMs: number }>(
        'azure',
        contract.id
      );

      let result: AzureResponse;
      let latencyMs: number;

      if (cached) {
        console.log(`Using cached Azure response for contract ${contract.id}`);
        result = cached.data;
        latencyMs = cached.latencyMs;
      } else {
        const { operationLocation } =
          await azureClient.analyzeContractFromBuffer(fileBuffer);
        result = await azureClient.waitForAnalysis(operationLocation);
        latencyMs = Date.now() - startAzure;

        // Cache the successful response with latency
        await setCachedResponse('azure', contract.id, { data: result, latencyMs });
      }

      contractResult.services.azure = {
        status: 'success',
        latencyMs,
        data: result,
      };
    } catch (error) {
      contractResult.services.azure = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    results.contracts.push(contractResult);
  }

  // Truncate deeply before sending to client
  const truncated = truncateJson(results);

  return NextResponse.json(truncated);
}
