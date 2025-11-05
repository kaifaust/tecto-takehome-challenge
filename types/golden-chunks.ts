/**
 * Types for metric-tagged golden evaluation chunks
 * Each chunk tests a specific metric: Correctness or Latency
 */

// ============================================
// Evaluation Metrics
// ============================================

export type TectoMetric = 'Correctness' | 'Latency';

// ============================================
// Evaluation Types
// ============================================

export type Difficulty = 'easy' | 'medium' | 'hard';

// ============================================
// Golden Chunk
// ============================================

export interface GoldenChunk {
  /** Unique identifier (format: GC-{contractId}-{metricCode}-{number}) */
  id: string;

  /** Contract ID this chunk is from (e.g., "01", "02", "03") */
  contractId: string;

  /** Which metric this chunk tests (Correctness or Latency) */
  metric: TectoMetric;

  /** The evaluation question or extraction task */
  question: string;

  /** Optional: Specific text snippet from contract relevant to this question */
  contextChunk?: string;

  /** The golden/correct answer to the question */
  expectedAnswer: string | string[] | number | Record<string, any>;

  /** Difficulty level of this extraction task */
  difficulty?: Difficulty;

  /** Optional notes about why this tests the specific metric or edge cases */
  notes?: string;

  /** Optional tags for categorization */
  tags?: string[];
}

// ============================================
// Golden Chunks Dataset
// ============================================

export interface GoldenChunksDataset {
  version: string;
  description: string;
  totalChunks: number;
  chunksByMetric: Record<TectoMetric, number>;
  chunks: GoldenChunk[];
}

// ============================================
// Evaluation Result for a Single Chunk
// ============================================

export interface ChunkEvaluationResult {
  chunkId: string;
  metric: TectoMetric;
  contractId: string;
  question: string;
  expectedAnswer: string | string[] | number | Record<string, any>;
  extractedAnswer?: string | string[] | number | Record<string, any>;
  passed: boolean;
  score: number; // 0.0 to 1.0
  reasoning?: string;
  latencyMs?: number; // Only for latency-tagged chunks
}

// ============================================
// Aggregated Results by Metric
// ============================================

export interface MetricAggregateResult {
  metric: TectoMetric;
  totalChunks: number;
  passedChunks: number;
  failedChunks: number;
  averageScore: number; // 0.0 to 1.0
  status: 'good' | 'moderate' | 'poor'; // >=0.85, 0.65-0.84, <0.65
  chunkResults: ChunkEvaluationResult[];
}

// ============================================
// Full Evaluation Results
// ============================================

export interface GoldenChunkEvaluationResults {
  timestamp: string;
  serviceProvider: 'extracta' | 'azure';
  contractId: string;
  totalChunks: number;
  totalPassed: number;
  totalFailed: number;
  overallScore: number; // Weighted average across all metrics
  metricResults: Record<TectoMetric, MetricAggregateResult>;
  averageLatencyMs?: number;
}
