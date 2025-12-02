'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function InteractiveMoon() {
  const { theme, setTheme } = useTheme();
  const [isFlashing, setIsFlashing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    setIsFlashing(true);
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setTimeout(() => setIsFlashing(false), 700);
  };

  if (!mounted) {
    // Render a static placeholder to prevent layout shift during hydration, 
    // matching the default server-rendered state (no glow, standard shadow)
    return (
      <div className="relative w-full aspect-square max-w-lg mx-auto animate-float">
        <Image
          src="/img/moon.webp"
          alt="MOON Token"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain drop-shadow-2xl"
          priority
        />
      </div>
    );
  }

  return (
    <div 
      className="relative w-full aspect-square max-w-lg mx-auto animate-float cursor-pointer group"
      onClick={handleClick}
    >
      {/* Flash Effect Overlay */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white rounded-full z-20 pointer-events-none transition-all duration-700 ease-out ${
          isFlashing ? 'opacity-40 scale-150 blur-xl' : 'opacity-0 scale-100 blur-none'
        }`}
      />
      
      {/* The Moon Image */}
      <Image
        src="/img/moon.webp"
        alt="MOON Token"
        fill
        className={`object-contain transition-all duration-1000 ${
          theme === 'dark' 
            ? 'drop-shadow-[0_0_60px_rgba(255,255,255,0.4)] brightness-110' 
            : 'drop-shadow-2xl brightness-100'
        }`}
        priority
      />
      
      {/* Ambient Glow (Dark Mode Only) */}
      <div 
        className={`absolute inset-0 bg-rcc-orange/20 rounded-full blur-[100px] -z-10 transition-opacity duration-1000 ${
          theme === 'dark' ? 'opacity-100 animate-pulse' : 'opacity-0'
        }`}
      />
    </div>
  );
}
