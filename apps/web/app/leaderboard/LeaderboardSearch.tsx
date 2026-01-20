'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface LeaderboardSearchProps {
  currentRound: number;
  initialSearch: string;
}

export default function LeaderboardSearch({ currentRound, initialSearch }: LeaderboardSearchProps) {
  const [search, setSearch] = useState(initialSearch);
  const router = useRouter();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed) {
      router.push(`/leaderboard?round=${currentRound}&search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`/leaderboard?round=${currentRound}`);
    }
  }, [search, currentRound, router]);

  const handleClear = useCallback(() => {
    setSearch('');
    router.push(`/leaderboard?round=${currentRound}`);
  }, [currentRound, router]);

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md">
      <div className="relative">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username..."
          className="w-full pl-10 pr-10 py-2.5
            bg-white/80 dark:bg-black/20
            border border-orange-100 dark:border-white/10
            rounded-lg
            text-slate-800 dark:text-white
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-rcc-orange focus:border-transparent
            backdrop-blur-sm"
        />
        {(search || initialSearch) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1
              text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
              transition-colors"
            aria-label="Clear search"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {initialSearch && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Showing results for &quot;{initialSearch}&quot;
        </p>
      )}
    </form>
  );
}
