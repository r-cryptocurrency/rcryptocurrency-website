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

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 lg:hidden">
            <ThemeToggle />
            <button 
              className="text-white focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
            </button>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <NavLink href="/" label="Home" />
            <NavLink href="/#timeline" label="Timeline" />
            <NavLink href="/stats" label="Subreddit Stats" />
            <NavLink href="/richlist" label="Richlist" />
            <a 
              href="https://www.reddit.com/r/CryptoCurrency/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-rcc-dark transition-colors font-medium"
            >
              Subreddit
            </a>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-white/10 pt-4 flex flex-col gap-4">
            <NavLink href="/" label="Home" mobile onClick={() => setIsOpen(false)} />
            <NavLink href="/#timeline" label="Timeline" mobile onClick={() => setIsOpen(false)} />
            <NavLink href="/stats" label="Subreddit Stats" mobile onClick={() => setIsOpen(false)} />
            <NavLink href="/richlist" label="Richlist" mobile onClick={() => setIsOpen(false)} />
            <a 
              href="https://www.reddit.com/r/CryptoCurrency/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-rcc-dark transition-colors font-medium block py-2"
              onClick={() => setIsOpen(false)}
            >
              Subreddit
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, label, mobile = false, onClick }: { href: string, label: string, mobile?: boolean, onClick?: () => void }) {
  return (
    <Link 
      href={href} 
      className={`text-white hover:text-rcc-dark transition-colors font-medium ${mobile ? 'block py-2' : ''}`}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}
