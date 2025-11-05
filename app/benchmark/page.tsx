'use client';

import { useState } from 'react';
import { CONTRACTS } from '@/lib/contracts';
import { Navigation } from '@/components/navigation';
import type { ServiceProvider } from '@/types/api';
import type { AllMetrics } from '@/lib/evaluation';

interface EvaluationResult {
  contractId: string;
  service: ServiceProvider;
  extracted: Record<string, string | undefined>;
  gold: Record<string, string | undefined>;
  metrics: AllMetrics;
}

interface AggregateMetrics {
  accuracy: number;
  latencyP50?: number;
  latencyP90?: number;
}

interface EvaluationReport {
  timestamp: string;
  contracts: EvaluationResult[];
  aggregateScores: {
    extracta: AggregateMetrics;
    azure: AggregateMetrics;
  };
}

function ServiceComparisonTable({
  gold,
  extractaResult,
  azureResult,
}: {
  gold: Record<string, string | undefined>;
  extractaResult: EvaluationResult;
  azureResult: EvaluationResult;
}) {
  const fields: Array<{ key: string; label: string }> = [
    { key: 'contractId', label: 'Contract ID' },
    { key: 'title', label: 'Title' },
    { key: 'parties', label: 'Parties' },
    { key: 'effectiveDate', label: 'Effective Date' },
    { key: 'executionDate', label: 'Execution Date' },
    { key: 'expirationDate', label: 'Expiration Date' },
    { key: 'contractDuration', label: 'Duration' },
    { key: 'renewalDate', label: 'Renewal Date' },
    { key: 'jurisdictions', label: 'Jurisdictions' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-zinc-300 dark:border-zinc-600">
            <th className="p-3 text-left font-semibold text-zinc-700 dark:text-zinc-300 w-32">
              Field
            </th>
            <th className="p-3 text-left font-semibold text-green-700 dark:text-green-400 w-1/4">
              Gold Standard ✓
            </th>
            <th className="p-3 text-left font-semibold text-blue-700 dark:text-blue-400 w-1/3">
              Extracta
            </th>
            <th className="p-3 text-left font-semibold text-purple-700 dark:text-purple-400 w-1/3">
              Azure
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, idx) => {
            const goldValue = gold[field.key] || '—';
            const extractaValue = extractaResult.extracted[field.key] || '—';
            const azureValue = azureResult.extracted[field.key] || '—';
            const extractaMatch = extractaResult.metrics.accuracy.fieldResults?.[field.key] === true;
            const azureMatch = azureResult.metrics.accuracy.fieldResults?.[field.key] === true;
            const extractaMissing = extractaValue === '—' && goldValue !== '—';
            const azureMissing = azureValue === '—' && goldValue !== '—';

            return (
              <tr
                key={field.key}
                className={`border-b border-zinc-200 dark:border-zinc-700 ${
                  idx % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''
                }`}
              >
                <td className="p-3 font-medium text-zinc-600 dark:text-zinc-400 align-top">
                  {field.label}
                </td>
                <td className="p-3 text-zinc-900 dark:text-zinc-100 align-top">
                  <div className="text-xs leading-relaxed">
                    {goldValue.length > 150 ? `${goldValue.substring(0, 150)}...` : goldValue}
                  </div>
                </td>
                <td className="p-3 align-top">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div
                        className={`flex-1 text-xs leading-relaxed ${
                          extractaMatch
                            ? 'text-green-700 dark:text-green-400'
                            : extractaMissing
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {extractaValue.length > 150 ? `${extractaValue.substring(0, 150)}...` : extractaValue}
                      </div>
                      {extractaMatch && !extractaMissing && (
                        <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                      )}
                      {!extractaMatch && extractaValue !== '—' && (
                        <span className="text-red-600 dark:text-red-400 flex-shrink-0">✗</span>
                      )}
                      {extractaMissing && (
                        <span className="text-red-600 dark:text-red-400 flex-shrink-0">✗</span>
                      )}
                    </div>
                    {extractaResult.metrics.accuracy.fieldReasonings?.[field.key] && (
                      <div className="mt-2 rounded border border-blue-200 bg-blue-50/50 p-2 dark:border-blue-800 dark:bg-blue-900/10">
                        <div className="text-[10px] font-semibold text-blue-900 dark:text-blue-200 mb-1">
                          Judge:
                        </div>
                        <div className="text-[10px] leading-relaxed text-blue-800 dark:text-blue-300">
                          {extractaResult.metrics.accuracy.fieldReasonings[field.key]}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 align-top">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div
                        className={`flex-1 text-xs leading-relaxed ${
                          azureMatch
                            ? 'text-green-700 dark:text-green-400'
                            : azureMissing
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {azureValue.length > 150 ? `${azureValue.substring(0, 150)}...` : azureValue}
                      </div>
                      {azureMatch && !azureMissing && (
                        <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                      )}
                      {!azureMatch && azureValue !== '—' && (
                        <span className="text-red-600 dark:text-red-400 flex-shrink-0">✗</span>
                      )}
                      {azureMissing && (
                        <span className="text-red-600 dark:text-red-400 flex-shrink-0">✗</span>
                      )}
                    </div>
                    {azureResult.metrics.accuracy.fieldReasonings?.[field.key] && (
                      <div className="mt-2 rounded border border-purple-200 bg-purple-50/50 p-2 dark:border-purple-800 dark:bg-purple-900/10">
                        <div className="text-[10px] font-semibold text-purple-900 dark:text-purple-200 mb-1">
                          Judge:
                        </div>
                        <div className="text-[10px] leading-relaxed text-purple-800 dark:text-purple-300">
                          {azureResult.metrics.accuracy.fieldReasonings[field.key]}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function BenchmarkPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<string[]>(['01', '02']);

  const toggleContract = (contractId: string) => {
    setSelectedContracts((prev) =>
      prev.includes(contractId)
        ? prev.filter((id) => id !== contractId)
        : [...prev, contractId]
    );
  };

  const runBenchmark = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractIds: selectedContracts,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setReport(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-2">
          <h1 className="mb-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Contract AI Benchmark
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Compare Extracta.ai vs Azure Document Intelligence on accuracy and latency
          </p>
        </div>

        <Navigation />

        {/* Metric Definitions */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Metric Definitions
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-zinc-900 dark:text-zinc-50">
                Accuracy
              </dt>
              <dd className="text-zinc-600 dark:text-zinc-400">
                Measures how well extracted values match the golden standard. Wrong answers and missing answers are both treated as incorrect. Uses AI judge for lenient comparison that handles format variations.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-900 dark:text-zinc-50">
                Latency
              </dt>
              <dd className="text-zinc-600 dark:text-zinc-400">
                End-to-end response time for extraction.
              </dd>
            </div>
          </dl>
        </div>

        {/* Controls */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Select Contracts
          </h2>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CONTRACTS.map((contract) => (
              <label
                key={contract.id}
                className="flex items-center gap-2 rounded border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={selectedContracts.includes(contract.id)}
                  onChange={() => toggleContract(contract.id)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
                  {contract.id}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={runBenchmark}
            disabled={loading || selectedContracts.length === 0}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Running Benchmark...'
              : `Evaluate ${selectedContracts.length} Contract${selectedContracts.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
            <h2 className="mb-2 text-xl font-semibold text-red-900 dark:text-red-200">
              Error
            </h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {report && (
          <>
            {/* Aggregate Scores */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Overall Results
              </h2>

              {/* Accuracy Comparison */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                  Accuracy
                </h3>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Extracta.ai
                    </div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-50">
                      {(report.aggregateScores.extracta.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Azure Document Intelligence
                    </div>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-50">
                      {(report.aggregateScores.azure.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Latency Comparison */}
              {(report.aggregateScores.extracta.latencyP50 !== undefined ||
                report.aggregateScores.azure.latencyP50 !== undefined) && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                    Latency (P50)
                  </h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Extracta.ai
                      </div>
                      <div className="text-3xl font-bold text-blue-900 dark:text-blue-50">
                        {report.aggregateScores.extracta.latencyP50 !== undefined
                          ? `${(report.aggregateScores.extracta.latencyP50 / 1000).toFixed(2)}s`
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                      <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Azure Document Intelligence
                      </div>
                      <div className="text-3xl font-bold text-purple-900 dark:text-purple-50">
                        {report.aggregateScores.azure.latencyP50 !== undefined
                          ? `${(report.aggregateScores.azure.latencyP50 / 1000).toFixed(2)}s`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Per-Contract Results (Field-Based) */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Field-Based Evaluation
              </h2>
              <div className="space-y-8">
                {/* Group by contract */}
                {selectedContracts.map((contractId) => {
                  const contractResults = report.contracts.filter(
                    (r) => r.contractId === contractId
                  );

                  const extractaResult = contractResults.find((r) => r.service === 'extracta');
                  const azureResult = contractResults.find((r) => r.service === 'azure');

                  if (!extractaResult || !azureResult) return null;

                  return (
                    <div
                      key={contractId}
                      className="rounded-lg border-2 border-zinc-300 p-6 dark:border-zinc-700"
                    >
                      <h3 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        Contract {contractId}
                      </h3>

                      {/* Overall Scores */}
                      <div className="mb-6 grid grid-cols-2 gap-4">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                          <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                            Extracta
                          </div>
                          <div className="text-2xl font-bold text-blue-900 dark:text-blue-50">
                            {(extractaResult.metrics.accuracy.score * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            Accuracy • {extractaResult.metrics.latency ? `${(extractaResult.metrics.latency.latencyMs / 1000).toFixed(1)}s` : 'N/A'}
                          </div>
                        </div>

                        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                          <div className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                            Azure
                          </div>
                          <div className="text-2xl font-bold text-purple-900 dark:text-purple-50">
                            {(azureResult.metrics.accuracy.score * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-purple-700 dark:text-purple-300">
                            Accuracy • {azureResult.metrics.latency ? `${(azureResult.metrics.latency.latencyMs / 1000).toFixed(1)}s` : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Side-by-side comparison */}
                      <ServiceComparisonTable
                        gold={extractaResult.gold}
                        extractaResult={extractaResult}
                        azureResult={azureResult}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
