/**
 * Utility for loading and working with golden chunks
 */

import type {
  GoldenChunk,
  GoldenChunksDataset,
  TectoMetric,
} from '@/types/golden-chunks';

// ============================================
// Load Golden Chunks
// ============================================

export async function loadGoldenChunks(): Promise<GoldenChunksDataset> {
  const response = await fetch('/data/dataset/golden-chunks.json');
  if (!response.ok) {
    throw new Error(`Failed to load golden chunks: ${response.statusText}`);
  }
  return response.json();
}

export async function loadGoldenChunksSync(): Promise<GoldenChunksDataset> {
  // For server-side usage
  const fs = await import('fs/promises');
  const path = await import('path');
  const filePath = path.join(
    process.cwd(),
    'public',
    'data',
    'dataset',
    'golden-chunks.json'
  );
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

// ============================================
// Filter and Query Golden Chunks
// ============================================

export function filterChunksByContract(
  chunks: GoldenChunk[],
  contractId: string
): GoldenChunk[] {
  return chunks.filter((chunk) => chunk.contractId === contractId);
}

export function filterChunksByMetric(
  chunks: GoldenChunk[],
  metric: TectoMetric
): GoldenChunk[] {
  return chunks.filter((chunk) => chunk.metric === metric);
}

export function filterChunksByContractAndMetric(
  chunks: GoldenChunk[],
  contractId: string,
  metric: TectoMetric
): GoldenChunk[] {
  return chunks.filter(
    (chunk) => chunk.contractId === contractId && chunk.metric === metric
  );
}

export function groupChunksByMetric(
  chunks: GoldenChunk[]
): Record<TectoMetric, GoldenChunk[]> {
  const grouped: Record<string, GoldenChunk[]> = {
    Correctness: [],
    Latency: [],
  };

  chunks.forEach((chunk) => {
    // Only include chunks for metrics we're tracking
    if (chunk.metric === 'Correctness' || chunk.metric === 'Latency') {
      grouped[chunk.metric].push(chunk);
    }
  });

  return grouped as Record<TectoMetric, GoldenChunk[]>;
}

export function groupChunksByContract(
  chunks: GoldenChunk[]
): Record<string, GoldenChunk[]> {
  const grouped: Record<string, GoldenChunk[]> = {};

  chunks.forEach((chunk) => {
    if (!grouped[chunk.contractId]) {
      grouped[chunk.contractId] = [];
    }
    grouped[chunk.contractId].push(chunk);
  });

  return grouped;
}

// ============================================
// Statistics
// ============================================

export function getChunkStatistics(chunks: GoldenChunk[]) {
  const byMetric = groupChunksByMetric(chunks);
  const byContract = groupChunksByContract(chunks);

  return {
    total: chunks.length,
    byMetric: Object.entries(byMetric).map(([metric, chunks]) => ({
      metric: metric as TectoMetric,
      count: chunks.length,
    })),
    byContract: Object.entries(byContract).map(([contractId, chunks]) => ({
      contractId,
      count: chunks.length,
    })),
  };
}
