'use client';

import { useState } from 'react';
import type { Prisma } from '@rcryptocurrency/database';
import { useSearchParams } from 'next/navigation';

import Link from 'next/link';

type HolderWithUser = Prisma.HolderGetPayload<{
  include: { user: true }
}>;

interface RichlistTableProps {
  holders: HolderWithUser[];
  skip: number;
  currentSort: string;
  currentOrder: string;
}

const SortHeader = ({ label, sortKey, currentSort, currentOrder, align = 'right' }: any) => {
  const searchParams = useSearchParams();
  const isActive = currentSort === sortKey;
  const nextOrder = isActive && currentOrder === 'desc' ? 'asc' : 'desc';
  
  const params = new URLSearchParams(searchParams.toString());
  params.set('sort', sortKey);
  params.set('order', nextOrder);
  params.set('page', '1');

  return (
    <th className={`px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider text-${align} cursor-pointer hover:text-rcc-orange transition-colors`}>
      <Link href={`/richlist?${params.toString()}`} className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'} gap-1`}>
        {label}
        {isActive && (
          <span className="text-rcc-orange">{currentOrder === 'desc' ? '↓' : '↑'}</span>
        )}
      </Link>
    </th>
  );
};

const AddressCell = ({ holder }: { holder: HolderWithUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!holder.username && !holder.label) {
    return <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{holder.address}</span>;
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
      >
        {holder.username ? (
          <span className="font-bold text-rcc-orange">
            {holder.username.startsWith('u/') ? holder.username : `u/${holder.username}`}
          </span>
        ) : (
          <span className="font-bold text-blue-600 dark:text-blue-400 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded text-xs border border-blue-100 dark:border-blue-800">
            {holder.label}
          </span>
        )}
        <span className="text-[10px] text-slate-400">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 p-2 bg-white dark:bg-slate-900 rounded shadow-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-500 dark:text-slate-400 select-all">
          {holder.address}
        </div>
      )}
    </div>
  );
};

export default function RichlistTable({ holders, skip, currentSort, currentOrder }: RichlistTableProps) {
  const [showEarned, setShowEarned] = useState(false);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl shadow-lg overflow-hidden border border-orange-100 dark:border-slate-800 mb-8">
      <div className="p-4 flex justify-end border-b border-orange-100 dark:border-slate-800">
        <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showEarned} 
            onChange={(e) => setShowEarned(e.target.checked)}
            className="rounded border-slate-300 text-rcc-orange focus:ring-rcc-orange"
          />
          <span>Show Est. Earned</span>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-orange-50 dark:bg-slate-900/50 border-b border-orange-100 dark:border-slate-800">
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider w-16">Rank</th>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider">User / Address</th>
              <SortHeader label="Total Balance" sortKey="totalBalance" currentSort={currentSort} currentOrder={currentOrder} />
              {showEarned && (
                <SortHeader label="Est. Earned" sortKey="earnedMoons" currentSort={currentSort} currentOrder={currentOrder} />
              )}
              <SortHeader label="Last Active" sortKey="lastTransferAt" currentSort={currentSort} currentOrder={currentOrder} />
              <SortHeader label="Nova" sortKey="balanceNova" currentSort={currentSort} currentOrder={currentOrder} />
              <SortHeader label="One" sortKey="balanceOne" currentSort={currentSort} currentOrder={currentOrder} />
              <SortHeader label="Ethereum" sortKey="balanceEth" currentSort={currentSort} currentOrder={currentOrder} />
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100 dark:divide-slate-800">
            {holders.map((holder, index) => (
              <tr key={holder.address} className="hover:bg-orange-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-slate-500 dark:text-slate-500 font-mono">{skip + index + 1}</td>
                <td className="px-6 py-4">
                  <AddressCell holder={holder} />
                </td>
                <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-bold text-right font-mono">
                  {holder.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                {showEarned && (
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-right font-mono">
                    {holder.user?.earnedMoons ? holder.user.earnedMoons.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                  </td>
                )}
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-right font-mono text-xs">
                  {holder.lastTransferAt ? new Date(holder.lastTransferAt).toLocaleDateString() : '-'}
                  {holder.hasOutgoing && <span className="ml-2 text-xs text-red-500" title="Has outgoing transfers">↗</span>}
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-right font-mono">
                  {holder.balanceNova.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-right font-mono">
                  {holder.balanceOne.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-right font-mono">
                  {holder.balanceEth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
