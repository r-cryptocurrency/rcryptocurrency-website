'use client';

import { AreaChart, Card, Title, Text } from "@tremor/react";

interface BurnChartProps {
  data: {
    date: string;
    Nova: number;
    One: number;
    Total: number;
  }[];
}

export default function BurnChart({ data }: BurnChartProps) {
  return (
    <Card className="mt-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <Title className="dark:text-white">Cumulative Burns Over Time</Title>
      <Text className="dark:text-slate-400">Total MOONs burned across networks</Text>
      <AreaChart
        className="h-72 mt-4"
        data={data}
        index="date"
        categories={["Total", "Nova", "One"]}
        colors={["orange", "amber", "blue"]}
        valueFormatter={(number) => 
          Intl.NumberFormat("us").format(number).toString()
        }
        yAxisWidth={60}
      />
    </Card>
  );
}
