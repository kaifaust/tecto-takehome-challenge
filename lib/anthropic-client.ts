/**
 * Anthropic API client for AI-powered evaluation
 */

import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';

if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

// Debug logging (remove in production)
if (apiKey.length < 50) {
  console.warn('⚠️  ANTHROPIC_API_KEY appears to be truncated or invalid');
  console.warn(`   Key length: ${apiKey.length} characters`);
  console.warn(`   Key preview: ${apiKey.substring(0, 20)}...`);
}

export const anthropicClient = new Anthropic({
  apiKey,
});

export { model as ANTHROPIC_MODEL };
