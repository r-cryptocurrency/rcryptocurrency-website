'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-rcc-orange/95 dark:bg-rcc-dark-orange/95 backdrop-blur-sm border-b border-white/10 shadow-lg transition-colors duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-decoration-none z-50 relative">
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
            <div className="z-50 relative">
               <ThemeToggle />
            </div>
            <div className="relative z-50">
              <button 
                className="text-white focus:outline-none p-2"
                onClick={() => setIsOpen(!isOpen)}
              >
                <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-2xl transition-all duration-300 ${isOpen ? 'rotate-90' : ''}`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Menu Overlay */}
      <div className={`fixed inset-0 bg-slate-50/95 dark:bg-slate-950/95 z-40 transition-all duration-500 ease-in-out transform ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
          <NavLink href="/" label="Home" emoji="🏠" onClick={() => setIsOpen(false)} />
          <NavLink href="/#timeline" label="Timeline" emoji="⏳" onClick={() => setIsOpen(false)} />
          <NavLink href="/stats" label="Stats" emoji="📊" onClick={() => setIsOpen(false)} />
          <NavLink href="/richlist" label="Richlist" emoji="💰" onClick={() => setIsOpen(false)} />
          <NavLink href="/burns" label="Burns" emoji="🔥" onClick={() => setIsOpen(false)} />
          <NavLink href="/calendar" label="Calendar" emoji="📅" onClick={() => setIsOpen(false)} />
          <NavLink href="/swap" label="Swap" emoji="🔄" onClick={() => setIsOpen(false)} />
          <NavLink href="/advertise" label="Advertise" emoji="📢" onClick={() => setIsOpen(false)} />
          <a 
            href="https://www.reddit.com/r/CryptoCurrency/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white hover:text-rcc-orange transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span>👽</span> Subreddit
          </a>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label, emoji, onClick }: { href: string, label: string, emoji: string, onClick?: () => void }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white hover:text-rcc-orange transition-colors transform hover:scale-105 duration-200"
      onClick={onClick}
    >
      <span>{emoji}</span>
      {label}
    </Link>
  );
}
