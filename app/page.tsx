'use client';

import { useState } from 'react';
import { CONTRACTS, getContractPath } from '@/lib/contracts';
import { Navigation } from '@/components/navigation';
import type { APIBatchResponse, APIContractResult, ServiceProvider } from '@/types/api';
import type { AzureObjectField, AzureFieldTypes } from '@/types/services/azure';

function getAzureFieldValue(field: AzureFieldTypes | undefined): string | undefined {
  if (!field) return undefined;
  if ('valueString' in field) return field.valueString;
  if ('valueDate' in field) return field.valueDate;
  if ('content' in field) return field.content;
  return undefined;
}

interface FieldConfig {
  label: string;
  extractors: Record<ServiceProvider, (contract: APIContractResult) => string>;
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    label: 'Title / Contract Details',
    extractors: {
      extracta: (contract) =>
        contract.services?.extracta?.data?.files?.[0]?.result?.Title ||
        '—',
      azure: (contract) =>
        getAzureFieldValue(contract.services?.azure?.data?.analyzeResult?.documents?.[0]?.fields?.Title) || '—',
    },
  },
  {
    label: 'Contract ID',
    extractors: {
      extracta: (contract) =>
        contract.services?.extracta?.data?.files?.[0]?.result?.ContractId || '—',
      azure: (contract) =>
        getAzureFieldValue(contract.services?.azure?.data?.analyzeResult?.documents?.[0]?.fields?.ContractId) || '—',
    },
  },
  {
    label: 'Parties',
    extractors: {
      extracta: (contract) =>
        contract.services?.extracta?.data?.files?.[0]?.result?.Parties ||
        '—',
      azure: (contract) => {
        const partiesField = contract.services?.azure?.data?.analyzeResult?.documents?.[0]?.fields?.Parties;
        if (!partiesField || !('valueArray' in partiesField)) return '—';
        const parties = partiesField.valueArray;
        if (!parties) return '—';
        return parties
          .map((p: AzureObjectField) => {
            const nameField = p.valueObject?.Name;
            return nameField && 'valueString' in nameField ? nameField.valueString : undefined;
          })
          .filter(Boolean)
          .join(', ') || '—';
      },
    },
  },
  {
    label: 'Effective Date',
    extractors: {
      extracta: (contract) =>
        contract.services?.extracta?.data?.files?.[0]?.result?.EffectiveDate || '—',
      azure: (contract) =>
        getAzureFieldValue(contract.services?.azure?.data?.analyzeResult?.documents?.[0]?.fields?.EffectiveDate) || '—',
    },
  },
  {
    label: 'Execution Date',
    extractors: {
      extracta: (contract) =>
        contract.services?.extracta?.data?.files?.[0]?.result?.ExecutionDate || '—',
      azure: (contract) =>
        getAzureFieldValue(contract.services?.azure?.data?.analyzeResult?.documents?.[0]?.fields?.ExecutionDate) || '—',
    },
  },
  {
    label: 'Expiration Date',
    extractors: {
      extracta: (contract) =>
        contract.services?.extracta?.data?.files?.[0]?.result?.ExpirationDate || '—',
      azure: (contract) =>
        getAzureFieldValue(contract.services?.azure?.data?.analyzeResult?.documents?.[0]?.fields?.ExpirationDate) || '—',
    },
  },
  {
    label: 'Duration',
    extractors: {
      extracta: (contract) =>
        contract.services?.extracta?.data?.files?.[0]?.result?.ContractDuration || '—',
      azure: (contract) =>
        getAzureFieldValue(contract.services?.azure?.data?.analyzeResult?.documents?.[0]?.fields?.ContractDuration) || '—',
    },
  },
  {
    label: 'Renewal Date',
    extractors: {
      extracta: (contract) =>
        contract.services?.extracta?.data?.files?.[0]?.result?.RenewalDate || '—',
      azure: (contract) =>
        getAzureFieldValue(contract.services?.azure?.data?.analyzeResult?.documents?.[0]?.fields?.RenewalDate) || '—',
    },
  },
  {
    label: 'Jurisdictions',
    extractors: {
      extracta: (contract) =>
        contract.services?.extracta?.data?.files?.[0]?.result?.Jurisdictions || '—',
      azure: (contract) =>
        getAzureFieldValue(contract.services?.azure?.data?.analyzeResult?.documents?.[0]?.fields?.Jurisdictions) || '—',
    },
  },
];

const SERVICE_COLORS: Record<ServiceProvider, string> = {
  extracta: 'text-blue-600 dark:text-blue-400',
  azure: 'text-purple-600 dark:text-purple-400',
};

const SERVICES: ServiceProvider[] = ['extracta', 'azure'];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<APIBatchResponse | { error: string } | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<string[]>(
    CONTRACTS.map((c) => c.id)
  );

  const toggleContract = (contractId: string) => {
    setSelectedContracts((prev) =>
      prev.includes(contractId)
        ? prev.filter((id) => id !== contractId)
        : [...prev, contractId]
    );
  };

  const runExtraction = async () => {
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractIds: selectedContracts,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Tecto — Contract Extraction Pipeline
        </h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">
          Extract contract fields using Extracta.ai and Azure Document Intelligence
        </p>

        <Navigation />

        <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Contracts
          </h2>
          <div className="mb-4 space-y-2">
            {CONTRACTS.map((contract) => {
              const contractPath = getContractPath(contract.filename);
              return (
                <div
                  key={contract.id}
                  className="flex items-center justify-between rounded border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedContracts.includes(contract.id)}
                      onChange={() => toggleContract(contract.id)}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
                      {contractPath}
                    </span>
                  </div>
                  <a
                    href={contractPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View PDF
                  </a>
                </div>
              );
            })}
          </div>

          <button
            onClick={runExtraction}
            disabled={loading || selectedContracts.length === 0}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400"
          >
            {loading
              ? 'Running Extraction...'
              : `Run All Services on ${selectedContracts.length} contract${selectedContracts.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {results && !('error' in results) && (
          <>
            {/* Comparison Table */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
              <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Service Comparison
              </h2>
              <div className="space-y-8">
                {results.contracts.map((contract) => (
                  <div key={contract.contractId} className="border-b border-zinc-200 pb-6 last:border-b-0 dark:border-zinc-700">
                    <h3 className="mb-4 font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Contract: {contract.filename}
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-zinc-300 dark:border-zinc-600">
                            <th className="p-3 text-left font-semibold text-zinc-700 dark:text-zinc-300">
                              Field
                            </th>
                            {SERVICES.map((service) => (
                              <th
                                key={service}
                                className={`p-3 text-left font-semibold capitalize ${SERVICE_COLORS[service]}`}
                              >
                                {service}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Field Rows */}
                          {FIELD_CONFIGS.map((field, idx) => (
                            <tr
                              key={field.label}
                              className={idx < FIELD_CONFIGS.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-700' : ''}
                            >
                              <td className="p-3 font-medium text-zinc-600 dark:text-zinc-400">
                                {field.label}
                              </td>
                              {SERVICES.map((service) => {
                                const serviceResult = contract.services?.[service];
                                const value = serviceResult?.status === 'success'
                                  ? field.extractors[service](contract)
                                  : serviceResult?.status === 'error'
                                  ? '—'
                                  : '—';

                                return (
                                  <td key={service} className="p-3 text-zinc-900 dark:text-zinc-100">
                                    {value}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}

                          {/* Latency Row */}
                          <tr>
                            <td className="p-3 font-medium text-zinc-600 dark:text-zinc-400">
                              Response Time
                            </td>
                            {SERVICES.map((service) => {
                              const latencyMs = contract.services?.[service]?.latencyMs;
                              return (
                                <td key={service} className="p-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                                  {latencyMs
                                    ? `${latencyMs}ms (${(latencyMs / 1000).toFixed(1)}s)`
                                    : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Responses */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
              <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Raw API Responses (truncated)
              </h2>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                Strings limited to 100 characters, arrays limited to 10 items
              </div>
              <pre className="overflow-auto rounded bg-zinc-100 p-4 text-xs dark:bg-zinc-950">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </>
        )}

        {results && 'error' in results && (
          <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
            <h2 className="mb-2 text-xl font-semibold text-red-900 dark:text-red-200">
              Error
            </h2>
            <p className="text-red-700 dark:text-red-300">{results.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
