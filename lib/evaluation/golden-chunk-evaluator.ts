/**
 * Evaluator for golden chunks - determines if an AI extraction passes or fails
 * Each chunk tests a specific metric: Correctness or Latency
 */

import type {
  GoldenChunk,
  ChunkEvaluationResult,
  MetricAggregateResult,
  GoldenChunkEvaluationResults,
  TectoMetric,
} from '@/types/golden-chunks';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================
// Single Chunk Evaluation
// ============================================

/**
 * Evaluate a single golden chunk using AI
 * Returns whether the extraction passed and a score (0.0 to 1.0)
 */
export async function evaluateGoldenChunk(
  chunk: GoldenChunk,
  extractedAnswer: string | string[] | number | Record<string, any> | undefined
): Promise<ChunkEvaluationResult> {
  // Handle missing extraction
  const extractedIsEmpty = extractedAnswer === undefined || extractedAnswer === null || extractedAnswer === '';
  const expectedIsEmpty = chunk.expectedAnswer === undefined || chunk.expectedAnswer === null || chunk.expectedAnswer === '';

  // If both are empty/null, that's a correct match
  if (extractedIsEmpty && expectedIsEmpty) {
    return {
      chunkId: chunk.id,
      metric: chunk.metric,
      contractId: chunk.contractId,
      question: chunk.question,
      expectedAnswer: chunk.expectedAnswer,
      extractedAnswer: extractedAnswer,
      passed: true,
      score: 1.0,
      reasoning: 'Both expected and extracted answers are empty/null - correct match',
    };
  }

  // If only extracted is empty but expected is not, that's wrong
  if (extractedIsEmpty && !expectedIsEmpty) {
    return {
      chunkId: chunk.id,
      metric: chunk.metric,
      contractId: chunk.contractId,
      question: chunk.question,
      expectedAnswer: chunk.expectedAnswer,
      extractedAnswer: undefined,
      passed: false,
      score: 0.0,
      reasoning: 'No answer extracted',
    };
  }

  // Use AI to judge whether the extracted answer passes the test
  const prompt = `You are evaluating whether an AI extraction tool correctly answered a question about a contract.

Question: ${chunk.question}

Expected Answer (Gold Standard):
${JSON.stringify(chunk.expectedAnswer, null, 2)}

Extracted Answer (AI Tool Output):
${JSON.stringify(extractedAnswer, null, 2)}

Does the extracted answer correctly answer the question? Consider:
- Semantic equivalence (same meaning, different wording is OK)
- Correct information (factually accurate)
- Completeness (captures key points from expected answer)

Respond with JSON only:
{
  "pass": true or false,
  "reasoning": "brief explanation"
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    const passed = result.pass === true;
    const reasoning = result.reasoning || 'No reasoning provided';

    return {
      chunkId: chunk.id,
      metric: chunk.metric,
      contractId: chunk.contractId,
      question: chunk.question,
      expectedAnswer: chunk.expectedAnswer,
      extractedAnswer,
      passed,
      score: passed ? 1.0 : 0.0,
      reasoning,
    };
  } catch (error) {
    return {
      chunkId: chunk.id,
      metric: chunk.metric,
      contractId: chunk.contractId,
      question: chunk.question,
      expectedAnswer: chunk.expectedAnswer,
      extractedAnswer,
      passed: false,
      score: 0.0,
      reasoning: `AI evaluation failed: ${error}`,
    };
  }
}

// ============================================
// Aggregate Evaluation
// ============================================

export function aggregateChunkResults(
  results: ChunkEvaluationResult[]
): MetricAggregateResult {
  if (results.length === 0) {
    throw new Error('Cannot aggregate empty results');
  }

  const metric = results[0].metric;
  const totalChunks = results.length;
  const passedChunks = results.filter((r) => r.passed).length;
  const failedChunks = totalChunks - passedChunks;
  const averageScore =
    results.reduce((sum, r) => sum + r.score, 0) / totalChunks;

  let status: 'good' | 'moderate' | 'poor';
  if (averageScore >= 0.85) {
    status = 'good';
  } else if (averageScore >= 0.65) {
    status = 'moderate';
  } else {
    status = 'poor';
  }

  return {
    metric,
    totalChunks,
    passedChunks,
    failedChunks,
    averageScore,
    status,
    chunkResults: results,
  };
}

export function aggregateAllMetrics(
  resultsByMetric: Record<TectoMetric, ChunkEvaluationResult[]>,
  serviceProvider: 'extracta' | 'azure',
  contractId: string
): GoldenChunkEvaluationResults {
  const metricResults: Record<TectoMetric, MetricAggregateResult> = {} as any;
  let totalChunks = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  // Aggregate each metric
  Object.entries(resultsByMetric).forEach(([metric, results]) => {
    if (results.length === 0) return;

    const aggregated = aggregateChunkResults(results);
    metricResults[metric as TectoMetric] = aggregated;

    totalChunks += aggregated.totalChunks;
    totalPassed += aggregated.passedChunks;
    totalFailed += aggregated.failedChunks;
  });

  // Overall score is just correctness score (latency reported separately)
  const correctnessScore = metricResults.Correctness?.averageScore || 0;

  // Calculate average latency if available
  const latencyResults = resultsByMetric.Latency || [];
  const averageLatencyMs =
    latencyResults.length > 0
      ? latencyResults.reduce(
          (sum, r) => sum + (r.latencyMs || 0),
          0
        ) / latencyResults.length
      : undefined;

  return {
    timestamp: new Date().toISOString(),
    serviceProvider,
    contractId,
    totalChunks,
    totalPassed,
    totalFailed,
    overallScore: correctnessScore,
    metricResults,
    averageLatencyMs,
  };
}
