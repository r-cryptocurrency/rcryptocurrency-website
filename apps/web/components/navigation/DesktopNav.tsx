'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Popover, PopoverButton, PopoverPanel, Transition, Dialog, DialogPanel, TransitionChild } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../ThemeToggle';
import { NAVIGATION_CONFIG } from './types';

export default function DesktopNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="hidden md:block fixed top-0 left-0 w-full z-40
          bg-rcc-orange/95 dark:bg-rcc-dark-orange/95
          backdrop-blur-sm border-b border-white/10 shadow-lg
          transition-colors duration-300"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2
                focus:outline-none focus-visible:ring-2
                focus-visible:ring-white focus-visible:ring-offset-2
                focus-visible:ring-offset-rcc-orange rounded-lg"
            >
              <Image
                src="/img/logorcc.png"
                alt=""
                width={40}
                height={40}
                className="rounded-full border-2 border-white/20"
              />
              <span className="text-white font-bold text-xl drop-shadow-md">
                r/CryptoCurrency
              </span>
            </Link>

            {/* Hamburger for medium screens (md to xl) */}
            <div className="xl:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Bars3Icon className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            {/* Full Navigation Items - only on xl+ */}
            <div className="hidden xl:flex items-center gap-1">
            {/* Home Link */}
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium
                transition-colors
                focus:outline-none focus-visible:ring-2
                focus-visible:ring-white focus-visible:ring-offset-2
                focus-visible:ring-offset-rcc-orange
                ${pathname === '/'
                  ? 'text-white bg-white/20'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              aria-current={pathname === '/' ? 'page' : undefined}
            >
              Home
            </Link>

            {/* Category Dropdowns */}
            {NAVIGATION_CONFIG.categories.map((category) => (
              <Popover key={category.id} className="relative">
                {({ open, close }) => (
                  <>
                    <PopoverButton
                      className={`group inline-flex items-center gap-1
                        px-4 py-2 rounded-lg text-sm font-medium
                        transition-colors
                        focus:outline-none focus-visible:ring-2
                        focus-visible:ring-white focus-visible:ring-offset-2
                        focus-visible:ring-offset-rcc-orange
                        ${open || category.items.some((i) => pathname === i.href)
                          ? 'text-white bg-white/20'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {category.label}
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200
                          ${open ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </PopoverButton>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <PopoverPanel
                        className="nav-dropdown-panel absolute left-0 z-10 mt-2 w-56
                          bg-white dark:bg-slate-800
                          rounded-xl shadow-lg ring-1 ring-black/5
                          dark:ring-white/10
                          overflow-hidden"
                      >
                        <nav aria-label={`${category.label} navigation`}>
                          <ul role="menu" className="py-2">
                            {category.items.map((item) => (
                              <li key={item.href} role="none">
                                <Link
                                  href={item.href}
                                  role="menuitem"
                                  onClick={() => close()}
                                  className={`flex items-center gap-3 px-4 py-2.5
                                    text-sm font-medium
                                    transition-colors
                                    focus:outline-none focus-visible:bg-gray-100
                                    dark:focus-visible:bg-slate-700
                                    ${pathname === item.href
                                      ? 'text-rcc-orange bg-rcc-orange/10'
                                      : 'text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }`}
                                  aria-current={pathname === item.href ? 'page' : undefined}
                                >
                                  <item.icon
                                    className="w-5 h-5 flex-shrink-0 text-gray-500 dark:text-gray-300"
                                    aria-hidden="true"
                                  />
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </nav>
                      </PopoverPanel>
                    </Transition>
                  </>
                )}
              </Popover>
            ))}

            {/* External Links */}
            {NAVIGATION_CONFIG.external.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-medium
                  text-white/80 hover:text-white hover:bg-white/10
                  transition-colors
                  focus:outline-none focus-visible:ring-2
                  focus-visible:ring-white focus-visible:ring-offset-2
                  focus-visible:ring-offset-rcc-orange
                  inline-flex items-center gap-2"
                aria-label={item.ariaLabel}
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
                {item.label}
              </a>
            ))}
              {/* Theme Toggle - in full nav */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

    {/* Slide-over menu for medium screens */}
    <Transition show={mobileMenuOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 xl:hidden" onClose={setMobileMenuOpen}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex justify-end">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <DialogPanel className={`w-full max-w-xs shadow-xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              {/* Header */}
              <div className={`flex items-center justify-between px-4 py-4 border-b ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>
                <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Menu</span>
                <button
                  type="button"
                  className={`p-2 -mr-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-rcc-orange
                    ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>

              {/* Menu Content */}
              <nav className={`px-4 py-4 space-y-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                {/* Home */}
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium
                    ${pathname === '/'
                      ? 'text-rcc-orange bg-rcc-orange/10'
                      : isDark ? 'text-gray-100 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Home
                </Link>

                {/* Categories */}
                {NAVIGATION_CONFIG.categories.map((category) => (
                  <div key={category.id}>
                    <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      {category.label}
                    </h3>
                    <ul className="mt-2 space-y-1">
                      {category.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium
                              ${pathname === item.href
                                ? 'text-rcc-orange bg-rcc-orange/10'
                                : isDark ? 'text-gray-100 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* External Links */}
                <div>
                  <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    External
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {NAVIGATION_CONFIG.external.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium
                            ${isDark ? 'text-gray-100 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  </>
  );
}
