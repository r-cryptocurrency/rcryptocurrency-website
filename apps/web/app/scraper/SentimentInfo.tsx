'use client';

import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function SentimentInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      <InformationCircleIcon className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-help transition-colors" />
      
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 border border-slate-700">
          <div className="font-semibold mb-1 text-orange-400">Sentiment Score</div>
          Sentiment is calculated using VADER analysis on post titles. Scores range from <span className="text-red-400 font-bold">-1 (Negative)</span> to <span className="text-green-400 font-bold">+1 (Positive)</span>.
        </div>
      )}
    </div>
  );
}
