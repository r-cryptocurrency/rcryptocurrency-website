'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Search() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [term, setTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSearch = params.get('search') || '';

      // Only update URL if the search term has actually changed.
      // This prevents resetting the page number when navigating pages (which changes searchParams).
      if (currentSearch === term) return;

      if (term) {
        params.set('search', term);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      replace(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [term, pathname, replace, searchParams]);

  return (
    <div className="mb-6 max-w-md">
      <label htmlFor="search" className="sr-only">Search</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input 
          type="text" 
          id="search" 
          className="block w-full py-3 pr-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-rcc-orange focus:border-rcc-orange dark:bg-slate-900 dark:border-slate-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-rcc-orange dark:focus:border-rcc-orange shadow-sm" 
          placeholder="Search address, user, or label..." 
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
    </div>
  );
}
