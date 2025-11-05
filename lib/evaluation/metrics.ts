import type { ContractFields } from '@/types/api';
import { evaluateAccuracyWithAI } from './ai-evaluator';

export interface MetricScore {
  score: number;
  details?: string;
  status: 'good' | 'moderate' | 'poor';
  fieldResults?: Record<string, boolean>;
  fieldReasonings?: Record<string, string>;
}

export interface AllMetrics {
  accuracy: MetricScore;
  latency?: {
    latencyMs: number;
    status: 'good' | 'moderate' | 'poor';
  };
}

function getStatus(score: number): 'good' | 'moderate' | 'poor' {
  if (score >= 0.85) return 'good';
  if (score >= 0.65) return 'moderate';
  return 'poor';
}

export async function evaluateAccuracy(
  extracted: ContractFields,
  gold: ContractFields
): Promise<MetricScore> {
  const result = await evaluateAccuracyWithAI(extracted, gold);

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

export function evaluateLatency(latencyMs: number): {
  latencyMs: number;
  status: 'good' | 'moderate' | 'poor';
} {
  let status: 'good' | 'moderate' | 'poor';

  if (latencyMs < 5000) {
    status = 'good';
  } else if (latencyMs < 15000) {
    status = 'moderate';
  } else {
    status = 'poor';
  }

  return { latencyMs, status };
}

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
