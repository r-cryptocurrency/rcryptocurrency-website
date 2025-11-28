'use client';

import { Icon } from "@tremor/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export default function SentimentInfo() {
  return (
    <div className="group relative inline-block">
      <Icon icon={InformationCircleIcon} size="sm" color="slate" className="cursor-help" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        Sentiment is calculated using VADER analysis on post titles. Scores range from -1 (Negative) to +1 (Positive).
      </div>
    </div>
  );
}
