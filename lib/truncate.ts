/**
 * Deep truncation utilities for JSON display
 */

export function truncateJson(obj: unknown, maxStringLength = 100, maxArrayLength = 10): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj.length > maxStringLength ? obj.slice(0, maxStringLength) : obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    const truncatedArray = obj.slice(0, maxArrayLength);
    return truncatedArray.map((item) => truncateJson(item, maxStringLength, maxArrayLength));
  }

  if (typeof obj === 'object') {
    const truncatedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Omit verbose page data from display
      if (key === 'pages' || key === 'words' || key === 'lines' || key === 'paragraphs') {
        truncatedObj[key] = '[omitted for brevity]';
        continue;
      }
      truncatedObj[key] = truncateJson(value, maxStringLength, maxArrayLength);
    }
    return truncatedObj;
  }

  return obj;
}
