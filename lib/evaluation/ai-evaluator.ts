/**
 * AI-powered evaluation using Claude for more lenient and intelligent comparison
 */

import { anthropicClient, ANTHROPIC_MODEL } from '@/lib/anthropic-client';
import type { ContractFields } from '@/types/api';

interface AIEvaluationResult {
  fieldResults: Record<string, boolean>; // true = pass, false = fail
  reasoning: string;
  fieldReasonings?: Record<string, string>; // Per-field reasoning
}

/**
 * Use Claude to evaluate accuracy with more lenient comparison
 * Handles variations in wording, date formats, and semantic equivalence
 * Wrong answers and missing answers are both treated as incorrect
 */
export async function evaluateAccuracyWithAI(
  extracted: ContractFields,
  gold: ContractFields
): Promise<AIEvaluationResult> {
  const prompt = `You are evaluating the accuracy of contract field extraction. Compare the EXTRACTED fields against the GOLD STANDARD (ground truth) fields.

GOLD STANDARD:
${JSON.stringify(gold, null, 2)}

EXTRACTED:
${JSON.stringify(extracted, null, 2)}

For each field in the gold standard, determine if the extracted value is close enough to the correct answer.
- Pass (true) if:
  * The values match or are semantically equivalent
  * Minor formatting differences (different date formats, capitalization, etc.)
  * **BOTH are null/undefined/empty** (if the field doesn't exist in the contract, correctly returning empty is correct)
- Fail (false) if:
  * Expected has a value but extracted is missing/empty
  * Values are present but factually different

Examples that should pass: different date formats (January 1, 2026 = 2026-01-01 = 1/1/2026), capitalization (ABC = abc), minor wording that preserves meaning, both null/undefined (null = undefined = ""= null).

CRITICAL: Output ONLY raw JSON. Do NOT use markdown. Do NOT use code blocks. Do NOT use backticks. Start directly with { and end with }. No other text before or after.

Provide both overall reasoning and per-field explanations in fieldReasonings.

Example format:
{"fieldResults": {"contractId": true, "title": false}, "reasoning": "Overall: 1/2 fields correct", "fieldReasonings": {"contractId": "Matches exactly", "title": "Expected 'Lease Agreement' but got 'Rental Contract' - semantically different"}}`;

  try {
    const response = await anthropicClient.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      temperature: 0, // Deterministic evaluation
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response, handling markdown code blocks if present
    let jsonText = content.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      // Remove ```json or ``` at start and ``` at end
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    }

    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No JSON object found in response: ${jsonText.substring(0, 100)}`);
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      fieldResults: result.fieldResults || {},
      reasoning: result.reasoning || 'No reasoning provided',
      fieldReasonings: result.fieldReasonings || {},
    };
  } catch (error) {
    console.error('AI evaluation error:', error);
    // Fallback to all fails on error
    return {
      fieldResults: {},
      reasoning: `AI evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

