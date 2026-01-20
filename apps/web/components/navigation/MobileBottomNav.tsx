'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { NAVIGATION_CONFIG, type NavCategory } from './types';
import BottomSheet from './BottomSheet';

export default function MobileBottomNav() {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const pathname = usePathname();

  // Close sheet on route change
  useEffect(() => {
    setActiveSheet(null);
  }, [pathname]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveSheet((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  const isActive = (category: NavCategory) => {
    return category.items.some((item) => pathname === item.href);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 md:hidden
          bg-white dark:bg-slate-900
          border-t border-gray-200 dark:border-slate-700
          safe-area-inset-bottom"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {/* Home - Direct Link */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center
              min-w-[64px] min-h-[44px] px-3 py-2
              rounded-lg transition-colors
              focus:outline-none focus-visible:ring-2
              focus-visible:ring-rcc-orange focus-visible:ring-offset-2
              ${pathname === '/'
                ? 'text-rcc-orange dark:text-rcc-orange'
                : 'text-gray-600 dark:text-gray-400 hover:text-rcc-orange'
              }`}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <NAVIGATION_CONFIG.home.icon className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>

          {/* Category Buttons */}
          {NAVIGATION_CONFIG.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              aria-expanded={activeSheet === category.id}
              aria-controls={`${category.id}-sheet`}
              aria-haspopup="dialog"
              className={`flex flex-col items-center justify-center
                min-w-[64px] min-h-[44px] px-3 py-2
                rounded-lg transition-colors
                focus:outline-none focus-visible:ring-2
                focus-visible:ring-rcc-orange focus-visible:ring-offset-2
                ${activeSheet === category.id || isActive(category)
                  ? 'text-rcc-orange dark:text-rcc-orange'
                  : 'text-gray-600 dark:text-gray-400 hover:text-rcc-orange'
                }`}
            >
              <category.icon className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs mt-1 font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Sheets for each category */}
      {NAVIGATION_CONFIG.categories.map((category) => (
        <BottomSheet
          key={category.id}
          id={`${category.id}-sheet`}
          isOpen={activeSheet === category.id}
          onClose={() => setActiveSheet(null)}
          title={category.label}
          items={category.items}
          showThemeToggle={category.id === 'account'}
        />
      ))}

      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </>
  );
}
