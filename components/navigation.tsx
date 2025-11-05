'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="mb-6 flex gap-2 rounded-lg bg-white p-2 shadow dark:bg-zinc-900">
      <Link
        href="/"
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isActive('/')
            ? 'bg-blue-600 text-white'
            : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
        }`}
      >
        Extraction Pipeline
      </Link>
      <Link
        href="/benchmark"
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isActive('/benchmark')
            ? 'bg-blue-600 text-white'
            : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
        }`}
      >
        Benchmark Evaluation
      </Link>
    </nav>
  );
}
