'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from "@tremor/react";

export default function BurnsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minAmount, setMinAmount] = useState(searchParams.get('minAmount') || '');
  const [chain, setChain] = useState(searchParams.get('chain') || 'all');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (minAmount) params.set('minAmount', minAmount);
    if (chain && chain !== 'all') params.set('chain', chain);
    params.set('page', '1'); // Reset to page 1 on filter change
    
    router.push(`/burns?${params.toString()}`);
  };

  return (
    <div className="mb-6 p-6 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Min Amount (MOON)
          </label>
          <input
            type="number"
            placeholder="e.g. 100"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
          />
        </div>
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Chain
          </label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors appearance-none"
          >
            <option value="all">All Chains</option>
            <option value="Arbitrum Nova">Arbitrum Nova</option>
            <option value="Arbitrum One">Arbitrum One</option>
            <option value="Ethereum">Ethereum</option>
          </select>
        </div>
        <div className="w-full md:w-auto">
          <Button onClick={handleSearch} color="orange">
            Filter
          </Button>
        </div>
      </div>
    </div>
  );
}
