/**
 * Evaluation metrics for benchmarking contract extraction AI tools
 * Simplified to measure only Accuracy and Latency
 */

import type { ContractFields } from '@/types/api';
import { evaluateAccuracyWithAI } from './ai-evaluator';

// ============================================
// Metric Score Type
// ============================================

export interface MetricScore {
  score: number; // 0.0 to 1.0
  details?: string;
  status: 'good' | 'moderate' | 'poor'; // 🟢 ≥0.85, 🟡 0.65-0.84, 🔴 <0.65
  fieldResults?: Record<string, boolean>; // AI judge pass/fail for each field
  fieldReasonings?: Record<string, string>; // Per-field reasoning
}

export interface AllMetrics {
  accuracy: MetricScore;
  latency?: {
    latencyMs: number;
    status: 'good' | 'moderate' | 'poor'; // <5s, 5-15s, >15s
  };
}

// ============================================
// Helper: Status from Score
// ============================================

function getStatus(score: number): 'good' | 'moderate' | 'poor' {
  if (score >= 0.85) return 'good';
  if (score >= 0.65) return 'moderate';
  return 'poor';
}

// ============================================
// ACCURACY
// ============================================

/**
 * Measures how well extracted values match the golden standard
 * Wrong answers and missing answers are treated the same - both count as incorrect
 * Uses AI for lenient comparison that handles variations in format and wording
 */
export async function evaluateAccuracy(
  extracted: ContractFields,
  gold: ContractFields
): Promise<MetricScore> {
  const result = await evaluateAccuracyWithAI(extracted, gold);

  // Calculate score: simple pass/fail ratio
  const allFields = Object.keys(result.fieldResults);
  const passedFields = allFields.filter((field) => result.fieldResults[field]);
  const score = allFields.length > 0 ? passedFields.length / allFields.length : 0;

  return {
    score,
    details: result.reasoning,
    status: getStatus(score),
    fieldResults: result.fieldResults,
    fieldReasonings: result.fieldReasonings,
  };
}

// ============================================
// LATENCY
// ============================================

export function evaluateLatency(latencyMs: number): {
  latencyMs: number;
  status: 'good' | 'moderate' | 'poor';
} {
  let status: 'good' | 'moderate' | 'poor';

  if (latencyMs < 5000) {
    status = 'good'; // < 5s
  } else if (latencyMs < 15000) {
    status = 'moderate'; // 5-15s
  } else {
    status = 'poor'; // > 15s
  }

  return { latencyMs, status };
}

// ============================================
// FULL EVALUATION
// ============================================

export async function evaluateExtraction(
  extracted: ContractFields,
  gold: ContractFields,
  latencyMs?: number
): Promise<AllMetrics> {
  const accuracy = await evaluateAccuracy(extracted, gold);

  return {
    accuracy,
    ...(latencyMs !== undefined && { latency: evaluateLatency(latencyMs) }),
  };
}
