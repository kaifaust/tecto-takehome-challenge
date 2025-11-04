/**
 * Shared contract configuration
 */

export interface Contract {
  id: string;
  filename: string;
}

export const CONTRACTS: Contract[] = [
  { id: '01', filename: '01.pdf' },
  { id: '02', filename: '02.pdf' },
  { id: '03', filename: '03.pdf' },
  { id: 'tiny-test', filename: 'tiny-test.pdf' },
];

/**
 * Get contract path for public access
 */
export function getContractPath(filename: string): string {
  return `/data/contracts/pdf/${filename}`;
}

/**
 * Get contract file path for server-side access
 */
export function getContractFilePath(filename: string): string {
  return `public/data/contracts/pdf/${filename}`;
}
