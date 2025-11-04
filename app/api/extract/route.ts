import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { extractaClient, azureClient } from '@/lib/api';
import { truncateJson } from '@/lib/truncate';
import { CONTRACTS } from '@/lib/contracts';
import { getCachedResponse, setCachedResponse } from '@/lib/cache';
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
        // Create extraction with Q&A format fields
        const extractionResponse: { extractionId: string } =
          await extractaClient.createExtraction({
            name: `Contract ${contract.id}`,
            description: 'Contract Q&A extraction for evaluation pipeline',
            language: 'English',
            fields: [
              {
                key: 'contract_id',
                type: 'string',
                description: 'What is the contract number or agreement ID?',
                example: 'CSA-2025-MFG-ST-001',
              },
              {
                key: 'contract_title',
                type: 'string',
                description: 'What is the title of this contract or agreement?',
                example: 'Cloud Services Agreement',
              },
              {
                key: 'parties',
                type: 'string',
                description: 'Who are all the parties involved in this contract? List their full legal names.',
                example: 'StratusCloud Technologies Inc., Meridian Financial Group',
              },
              {
                key: 'effective_date',
                type: 'string',
                description: 'When does this contract become effective or start?',
                example: 'January 1, 2026',
              },
              {
                key: 'expiration_date',
                type: 'string',
                description: 'When does this contract expire or end?',
                example: 'December 31, 2028',
              },
              {
                key: 'contract_duration',
                type: 'string',
                description: 'What is the duration or term of this contract?',
                example: 'Three (3) Years',
              },
              {
                key: 'contract_value',
                type: 'string',
                description: 'What is the total value, price, or monetary amount of this contract?',
                example: '$25,000,000',
              },
              {
                key: 'subject_matter',
                type: 'string',
                description: 'What is the subject matter or purpose of this contract? What services or products are being provided?',
                example: 'Cloud infrastructure and platform services',
              },
              {
                key: 'governing_law',
                type: 'string',
                description: 'What jurisdiction or governing law applies to this contract?',
                example: 'State of New York',
              },
              {
                key: 'key_obligations',
                type: 'string',
                description: 'What are the key obligations or responsibilities mentioned in this contract?',
                example: 'Provider shall ensure data remains within specified geographic regions and maintain 99.9% uptime.',
              },
            ],
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
