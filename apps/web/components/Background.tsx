'use client';

import { useEffect, useState } from 'react';

const ICONS = [
  'fa-brands fa-bitcoin',
  'fa-brands fa-ethereum',
  'fa-brands fa-reddit-alien',
  'fa-solid fa-moon',
  'fa-solid fa-rocket',
];

interface FloatyIcon {
  id: number;
  icon: string;
  top: string;
  left: string;
  size: string;
  duration: string;
  delay: string;
  opacity: number;
}

export default function Background({ children }: { children: React.ReactNode }) {
  const [icons, setIcons] = useState<FloatyIcon[]>([]);

  useEffect(() => {
    // Generate random icons only on client to avoid hydration mismatch
    const newIcons: FloatyIcon[] = [];
    const count = 15; // Number of floaty icons

    for (let i = 0; i < count; i++) {
      newIcons.push({
        id: i,
        icon: ICONS[Math.floor(Math.random() * ICONS.length)],
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 3 + 1}rem`, // 1rem to 4rem
        duration: `${Math.random() * 10 + 5}s`, // 5s to 15s
        delay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.3 + 0.1, // 0.1 to 0.4 opacity
      });
    }
    setIcons(newIcons);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-orange-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'url("/img/pattern.png")', backgroundSize: '200px' }}>
           {/* If pattern.png doesn't exist, this will just be transparent, which is fine. 
               We can use a CSS pattern instead if needed. */}
      </div>

      {/* Floaty Icons Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {icons.map((icon) => (
          <i
            key={icon.id}
            className={`${icon.icon} absolute animate-float text-rcc-orange dark:text-white`}
            style={{
              top: icon.top,
              left: icon.left,
              fontSize: icon.size,
              opacity: icon.opacity,
              animationDuration: icon.duration,
              animationDelay: icon.delay,
            }}
          />
        ))}
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
