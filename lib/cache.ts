import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Use .next/cache for development, or a custom location for production
const CACHE_DIR = join(process.cwd(), '.next', 'cache', 'api-responses');

/**
 * Get cached API response if it exists
 * @param tool - API tool name (e.g., 'extracta' or 'azure')
 * @param docId - Document/contract ID
 * @returns Cached response or null if not found
 */
export async function getCachedResponse<T>(
  tool: string,
  docId: string
): Promise<T | null> {
  const cacheFile = join(CACHE_DIR, tool, `${docId}.json`);

  if (!existsSync(cacheFile)) {
    return null;
  }

  try {
    const cached = await readFile(cacheFile, 'utf-8');
    return JSON.parse(cached) as T;
  } catch (error) {
    console.warn(`Failed to read cache for ${tool}/${docId}:`, error);
    return null;
  }
}

/**
 * Save API response to cache
 * @param tool - API tool name (e.g., 'extracta' or 'azure')
 * @param docId - Document/contract ID
 * @param data - Response data to cache
 */
export async function setCachedResponse<T>(
  tool: string,
  docId: string,
  data: T
): Promise<void> {
  const toolDir = join(CACHE_DIR, tool);

  // Ensure directory exists
  await mkdir(toolDir, { recursive: true });

  const cacheFile = join(toolDir, `${docId}.json`);

  try {
    await writeFile(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to write cache for ${tool}/${docId}:`, error);
  }
}
