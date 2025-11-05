import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { extractaClient, azureClient } from '@/lib/api';
import { CONTRACTS } from '@/lib/contracts';
import { getCachedResponse } from '@/lib/cache';
import { getExtractaFieldDefinitions } from '@/lib/contract-schema';
import { evaluateExtraction, type AllMetrics } from '@/lib/evaluation';
import type { ExtractaResponse } from '@/types/services/extracta';
import type { AzureResponse } from '@/types/services/azure';
import type { ServiceProvider } from '@/types/api';
import {
  normalizeExtractaResponse,
  normalizeAzureResponse,
} from '@/lib/normalize-extraction';
import goldData from '@/public/data/dataset/gold.json';

interface EvaluationResult {
  contractId: string;
  service: ServiceProvider;
  extracted: Record<string, string | null>;
  gold: Record<string, string | null>;
  metrics: AllMetrics;
}

interface EvaluationReport {
  timestamp: string;
  contracts: EvaluationResult[];
  aggregateScores: {
    extracta: {
      accuracy: number;
      latencyP50?: number;
      latencyP90?: number;
    };
    azure: {
      accuracy: number;
      latencyP50?: number;
      latencyP90?: number;
    };
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const selectedIds = body.contractIds || CONTRACTS.map((c) => c.id);

    const results: EvaluationResult[] = [];
    const contractsToProcess = CONTRACTS.filter((c) => selectedIds.includes(c.id));

    // Process each contract
    for (const contract of contractsToProcess) {
      const filePath = join(process.cwd(), 'public', 'data', 'contracts', 'pdf', contract.filename);
      const fileBuffer = await readFile(filePath);

      const goldLabel = goldData.goldLabels.find((g) => g.contractId === contract.id);
      if (!goldLabel) {
        console.warn(`No gold label for contract ${contract.id}`);
        continue;
      }

      // Process Extracta
      try {
        const cached = await getCachedResponse<{ data: ExtractaResponse; latencyMs: number }>('extracta', contract.id);
        
        let result: ExtractaResponse;
        let latencyMs: number;

        if (cached) {
          result = cached.data;
          latencyMs = cached.latencyMs;
        } else {
          const startTime = Date.now();
          const extractionResponse: { extractionId: string } = await extractaClient.createExtraction({
            name: `Contract ${contract.id}`,
            description: 'Contract Q&A extraction for evaluation pipeline',
            language: 'English',
            fields: getExtractaFieldDefinitions(),
          });

          const uploadResponse: { batchId: string } = await extractaClient.uploadFileBuffer(
            extractionResponse.extractionId,
            '',
            fileBuffer,
            contract.filename
          );

          let polledResult: ExtractaResponse | undefined;
          let attempts = 0;
          while (attempts < 20) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            polledResult = await extractaClient.getBatchResults(extractionResponse.extractionId, uploadResponse.batchId);
            const allProcessed = polledResult.files?.every((file) => file.status === 'processed' || file.status === 'error');
            if (allProcessed) break;
            attempts++;
          }

          if (!polledResult) throw new Error('Extracta failed');
          result = polledResult;
          latencyMs = Date.now() - startTime;
        }

        const normalized = normalizeExtractaResponse(result);
        const metrics = await evaluateExtraction(normalized.answers, goldLabel.fields, latencyMs);

        results.push({
          contractId: contract.id,
          service: 'extracta',
          extracted: normalized.answers,
          gold: goldLabel.fields,
          metrics,
        });
      } catch (error) {
        console.error(`Extracta error for ${contract.id}:`, error);
      }

      // Process Azure
      try {
        const cached = await getCachedResponse<{ data: AzureResponse; latencyMs: number }>('azure', contract.id);
        
        let result: AzureResponse;
        let latencyMs: number;

        if (cached) {
          result = cached.data;
          latencyMs = cached.latencyMs;
        } else {
          const startTime = Date.now();
          const { operationLocation } = await azureClient.analyzeContractFromBuffer(fileBuffer);
          result = await azureClient.waitForAnalysis(operationLocation);
          latencyMs = Date.now() - startTime;
        }

        const normalized = normalizeAzureResponse(result);
        const metrics = await evaluateExtraction(normalized.answers, goldLabel.fields, latencyMs);

        results.push({
          contractId: contract.id,
          service: 'azure',
          extracted: normalized.answers,
          gold: goldLabel.fields,
          metrics,
        });
      } catch (error) {
        console.error(`Azure error for ${contract.id}:`, error);
      }
    }

    // Calculate aggregate scores
    const extractaResults = results.filter((r) => r.service === 'extracta');
    const azureResults = results.filter((r) => r.service === 'azure');

    const aggregateScores = {
      extracta: calculateAggregateScores(extractaResults),
      azure: calculateAggregateScores(azureResults),
    };

    const report: EvaluationReport = {
      timestamp: new Date().toISOString(),
      contracts: results,
      aggregateScores,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function calculateAggregateScores(results: EvaluationResult[]) {
  if (results.length === 0) {
    return {
      accuracy: 0,
    };
  }

  const latencies = results.map((r) => r.metrics.latency?.latencyMs).filter((l): l is number => l !== undefined);

  return {
    accuracy: results.reduce((sum, r) => sum + r.metrics.accuracy.score, 0) / results.length,
    latencyP50: latencies.length > 0 ? latencies.sort()[Math.floor(latencies.length * 0.5)] : undefined,
    latencyP90: latencies.length > 0 ? latencies.sort()[Math.floor(latencies.length * 0.9)] : undefined,
  };
}
