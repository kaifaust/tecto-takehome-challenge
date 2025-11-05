/**
 * Golden Chunk Q&A Table
 * Displays evaluation results for metric-tagged golden chunks
 */

import type { ChunkEvaluationResult } from '@/types/golden-chunks';
import type { ServiceProvider } from '@/types/api';

interface GoldenChunkTableProps {
  contractId: string;
  contractFilename: string;
  chunkResults: Record<ServiceProvider, ChunkEvaluationResult[]>;
}

const SERVICE_COLORS: Record<ServiceProvider, string> = {
  extracta: 'text-blue-600 dark:text-blue-400',
  azure: 'text-purple-600 dark:text-purple-400',
};

const SERVICES: ServiceProvider[] = ['extracta', 'azure'];

export function GoldenChunkTable({
  contractId,
  contractFilename,
  chunkResults,
}: GoldenChunkTableProps) {
  // Get all unique chunks (use extracta as source of truth for chunks)
  const chunks = chunkResults.extracta || [];

  if (chunks.length === 0) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        No golden chunks available for this contract
      </div>
    );
  }

  return (
    <div className="border-b border-zinc-200 pb-6 last:border-b-0 dark:border-zinc-700">
      <h3 className="mb-4 font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Contract: {contractFilename}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-300 dark:border-zinc-600">
              <th className="p-3 text-left font-semibold text-zinc-700 dark:text-zinc-300 w-1/4">
                Question
              </th>
              <th className="p-3 text-left font-semibold text-zinc-700 dark:text-zinc-300 w-1/6">
                Expected Answer
              </th>
              {SERVICES.map((service) => (
                <th
                  key={service}
                  className={`p-3 text-left font-semibold capitalize ${SERVICE_COLORS[service]} w-1/4`}
                >
                  <div>{service}</div>
                  <div className="text-xs font-normal opacity-70">
                    Extracted / Pass/Fail / Reasoning
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chunks.map((chunk, idx) => {
              return (
                <tr
                  key={chunk.chunkId}
                  className={
                    idx < chunks.length - 1
                      ? 'border-b border-zinc-200 dark:border-zinc-700'
                      : ''
                  }
                >
                  {/* Question */}
                  <td className="p-3 align-top">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {chunk.question}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Metric: <span className="font-mono">{chunk.metric}</span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      ID: <span className="font-mono">{chunk.chunkId}</span>
                    </div>
                  </td>

                  {/* Expected Answer */}
                  <td className="p-3 align-top text-zinc-700 dark:text-zinc-300">
                    <div className="max-w-xs break-words text-sm">
                      {typeof chunk.expectedAnswer === 'string'
                        ? chunk.expectedAnswer
                        : JSON.stringify(chunk.expectedAnswer, null, 2)}
                    </div>
                  </td>

                  {/* Service Results */}
                  {SERVICES.map((service) => {
                    const serviceChunk = chunkResults[service]?.find(
                      (c) => c.chunkId === chunk.chunkId
                    );

                    if (!serviceChunk) {
                      return (
                        <td
                          key={service}
                          className="p-3 align-top text-zinc-500 dark:text-zinc-400"
                        >
                          —
                        </td>
                      );
                    }

                    const statusColor = serviceChunk.passed
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';

                    return (
                      <td key={service} className="p-3 align-top">
                        {/* Extracted Answer */}
                        <div className="mb-2 text-zinc-900 dark:text-zinc-100">
                          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Extracted:
                          </div>
                          <div className="max-w-xs break-words text-sm">
                            {serviceChunk.extractedAnswer !== undefined
                              ? typeof serviceChunk.extractedAnswer === 'string'
                                ? serviceChunk.extractedAnswer
                                : JSON.stringify(serviceChunk.extractedAnswer, null, 2)
                              : '—'}
                          </div>
                        </div>

                        {/* Pass/Fail Badge */}
                        <div className="mb-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColor}`}
                          >
                            {serviceChunk.passed ? '✓ PASS' : '✗ FAIL'}
                            <span className="ml-1 opacity-70">
                              ({(serviceChunk.score * 100).toFixed(0)}%)
                            </span>
                          </span>
                        </div>

                        {/* Reasoning */}
                        {serviceChunk.reasoning && (
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                            {serviceChunk.reasoning}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
