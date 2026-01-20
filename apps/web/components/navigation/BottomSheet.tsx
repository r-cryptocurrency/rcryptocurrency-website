'use client';

import { Fragment, useRef, useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { NavItem } from './types';

interface BottomSheetProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: NavItem[];
  showThemeToggle?: boolean;
}

export default function BottomSheet({ id, isOpen, onClose, title, items, showThemeToggle }: BottomSheetProps) {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        id={id}
        className="relative z-50 md:hidden"
        onClose={onClose}
        initialFocus={closeButtonRef}
      >
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
        </TransitionChild>

        {/* Sheet Container */}
        <div className="fixed inset-0 flex items-end">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <DialogPanel
              className="mobile-bottom-sheet w-full max-h-[70vh] overflow-y-auto
                bg-white dark:bg-slate-900
                rounded-t-2xl shadow-xl"
            >
              {/* Header */}
              <div
                className="mobile-bottom-sheet-header sticky top-0 z-10
                  flex items-center justify-between
                  px-4 py-3
                  border-b border-gray-200 dark:border-slate-700
                  bg-white dark:bg-slate-900"
              >
                <DialogTitle
                  as="h2"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {title}
                </DialogTitle>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-lg
                    text-gray-500 hover:text-gray-700
                    dark:text-gray-400 dark:hover:text-gray-200
                    focus:outline-none focus-visible:ring-2
                    focus-visible:ring-rcc-orange"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav aria-label={`${title} navigation`}>
                <ul role="menu" className="py-2">
                  {items.map((item) => (
                    <li key={item.href} role="none">
                      {item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          role="menuitem"
                          onClick={onClose}
                          className="flex items-center gap-4 px-4 py-3
                            min-h-[44px]
                            text-base font-medium
                            text-gray-700 dark:text-gray-200
                            hover:bg-gray-100 dark:hover:bg-slate-800
                            transition-colors
                            focus:outline-none focus-visible:ring-2
                            focus-visible:ring-inset focus-visible:ring-rcc-orange"
                        >
                          <item.icon
                            className="w-5 h-5 flex-shrink-0"
                            aria-hidden="true"
                          />
                          {item.label}
                          <span className="sr-only">(opens in new tab)</span>
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          role="menuitem"
                          onClick={onClose}
                          className={`flex items-center gap-4 px-4 py-3
                            min-h-[44px]
                            text-base font-medium
                            transition-colors
                            focus:outline-none focus-visible:ring-2
                            focus-visible:ring-inset focus-visible:ring-rcc-orange
                            ${pathname === item.href
                              ? 'text-rcc-orange bg-rcc-orange/10'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                          aria-current={pathname === item.href ? 'page' : undefined}
                        >
                          <item.icon
                            className="w-5 h-5 flex-shrink-0"
                            aria-hidden="true"
                          />
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Theme Toggle */}
              {showThemeToggle && mounted && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-4 w-full px-4 py-3
                      min-h-[44px]
                      text-base font-medium
                      text-gray-700 dark:text-gray-200
                      hover:bg-gray-100 dark:hover:bg-slate-800
                      rounded-lg transition-colors
                      focus:outline-none focus-visible:ring-2
                      focus-visible:ring-rcc-orange"
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    {theme === 'dark' ? (
                      <>
                        <SunIcon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <MoonIcon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                        Dark Mode
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Bottom padding for safe area */}
              <div className="h-6 safe-area-inset-bottom" aria-hidden="true" />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
