/**
 * Environment Variables Configuration
 *
 * Validates and exports environment variables with proper typing
 */

// Validate required environment variables
const requiredEnvVars = [
  'EXTRACTA_API_KEY',
  'EXTRACTA_ENDPOINT',
  'AZURE_KEY',
  'AZURE_ENDPOINT',
] as const;

function validateEnv() {
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the values.'
    );
  }
}

// Only validate in Node.js environment (not during build)
if (typeof window === 'undefined') {
  validateEnv();
}

export const env = {
  extracta: {
    apiKey: process.env.EXTRACTA_API_KEY!,
    endpoint: process.env.EXTRACTA_ENDPOINT!,
  },
  azure: {
    key: process.env.AZURE_KEY!,
    endpoint: process.env.AZURE_ENDPOINT!,
  },
} as const;
