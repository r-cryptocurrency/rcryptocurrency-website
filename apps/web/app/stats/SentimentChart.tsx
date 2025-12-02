'use client';

import { AreaChart } from "@tremor/react";

interface ChartData {
  date: string;
  Sentiment: number | null;
}

export default function SentimentChart({ data }: { data: ChartData[] }) {
  return (
    <AreaChart
      className="h-72 mt-4"
      data={data}
      index="date"
      categories={["Sentiment"]}
      colors={["orange"]}
      valueFormatter={(number) => (number ?? 0).toFixed(2)}
      showLegend={false}
      yAxisWidth={40}
    />
  );
}
