'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-rcc-orange/95 dark:bg-rcc-dark-orange/95 backdrop-blur-sm border-b border-white/10 shadow-lg transition-colors duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-decoration-none">
            <Image 
              src="/img/logorcc.png" 
              alt="r/CC Logo" 
              width={40} 
              height={40} 
              className="rounded-full border-2 border-white/20" 
            />
            <span className="text-white font-bold text-xl drop-shadow-md">
              r/CryptoCurrency
            </span>
          </Link>

          {/* Menu Button (Always Visible) */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="relative">
              <button 
                className="text-white focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
              >
                <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute top-full right-0 mt-4 w-48 bg-rcc-orange dark:bg-rcc-dark-orange rounded-xl shadow-xl border border-white/10 flex flex-col gap-2 p-2 animate-in fade-in slide-in-from-top-2 z-50">
                  <NavLink href="/" label="Home" mobile onClick={() => setIsOpen(false)} />
                  <NavLink href="/#timeline" label="Timeline" mobile onClick={() => setIsOpen(false)} />
                  <NavLink href="/stats" label="Stats" mobile onClick={() => setIsOpen(false)} />
                  <NavLink href="/richlist" label="Richlist" mobile onClick={() => setIsOpen(false)} />
                  <NavLink href="/burns" label="Burns" mobile onClick={() => setIsOpen(false)} />
                  <NavLink href="/calendar" label="Calendar" mobile onClick={() => setIsOpen(false)} />
                  <NavLink href="/swap" label="Swap" mobile onClick={() => setIsOpen(false)} />
                  <a 
                    href="https://www.reddit.com/r/CryptoCurrency/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg hover:bg-white/20 text-white font-semibold transition-colors text-sm text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Subreddit
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label, mobile = false, onClick }: { href: string, label: string, mobile?: boolean, onClick?: () => void }) {
  return (
    <Link 
      href={href} 
      className={`px-4 py-2 rounded-lg hover:bg-white/20 text-white font-semibold transition-colors text-sm text-center ${mobile ? 'w-full' : ''}`}
      onClick={onClick}
    >
      {label}
    </Link>
  );

}
