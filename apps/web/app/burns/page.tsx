import { prisma, Burn } from '@rcryptocurrency/database';
import { Title, Text, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Badge, Flex, Button, Metric } from "@tremor/react";
import Background from '../../components/Background';
import BurnsFilters from './BurnsFilters';
import BurnChart from './BurnChart';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

async function getBurnStats() {
  // Fetch all burns to calculate cumulative stats
  // In a real production app with millions of rows, this should be pre-aggregated
  const allBurns = await prisma.burn.findMany({
    orderBy: { timestamp: 'asc' },
    select: { timestamp: true, amount: true, chain: true }
  });

  let totalBurned = 0;
  let novaBurned = 0;
  let oneBurned = 0;

  // Group by day for the chart
  const chartDataMap = new Map<string, { date: string, Nova: number, One: number, Total: number }>();

  allBurns.forEach((burn: any) => {
    totalBurned += burn.amount;
    if (burn.chain.includes('Nova')) novaBurned += burn.amount;
    if (burn.chain.includes('One')) oneBurned += burn.amount;

    const dateKey = new Date(burn.timestamp).toISOString().split('T')[0];
    const existing = chartDataMap.get(dateKey) || { date: dateKey, Nova: 0, One: 0, Total: 0 };
    
    if (burn.chain.includes('Nova')) existing.Nova += burn.amount;
    if (burn.chain.includes('One')) existing.One += burn.amount;
    
    chartDataMap.set(dateKey, existing);
  });

  // Convert daily amounts to cumulative
  const sortedDates = Array.from(chartDataMap.keys()).sort();
  let runningNova = 0;
  let runningOne = 0;
  
  const chartData = sortedDates.map((date: string) => {
    const day = chartDataMap.get(date)!;
    runningNova += day.Nova;
    runningOne += day.One;
    return {
      date,
      Nova: runningNova,
      One: runningOne,
      Total: runningNova + runningOne
    };
  });

  return { totalBurned, novaBurned, oneBurned, chartData };
}

async function getBurns(page: number, minAmount: number, chain: string | undefined) {
  try {
    // Ensure page is at least 1 to prevent negative skip values
    const safePage = Math.max(1, Math.floor(page));
    const safeMinAmount = Math.max(0, minAmount);
    
    const where: any = {};
    if (safeMinAmount > 0) {
      where.amount = { gte: safeMinAmount };
    }
    if (chain && chain !== 'all') {
      where.chain = chain;
    }

    const [data, total] = await Promise.all([
      prisma.burn.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (safePage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.burn.count({ where })
    ]);

    // Resolve senders
    const senders = Array.from(new Set(data.map((b: any) => b.sender.toLowerCase())));
    const holders = await prisma.holder.findMany({
      where: { address: { in: senders } },
      select: { address: true, username: true, label: true }
    });
    
    const holderMap = new Map<string, { username: string | null, label: string | null }>();
    holders.forEach((h: any) => holderMap.set(h.address.toLowerCase(), h));

    return { data, total, holderMap };
  } catch (e) {
    console.error("Failed to fetch burns:", e);
    return { data: [], total: 0, holderMap: new Map() };
  }
}

export default async function BurnsPage({ searchParams }: { searchParams: { page?: string, minAmount?: string, chain?: string } }) {
  const parsedPage = parseInt(searchParams.page || '1');
  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const parsedMinAmount = parseFloat(searchParams.minAmount || '0');
  const minAmount = Number.isNaN(parsedMinAmount) || parsedMinAmount < 0 ? 0 : parsedMinAmount;
  const chain = searchParams.chain;

  const [{ data: burns, total, holderMap }, { totalBurned, chartData }] = await Promise.all([
    getBurns(page, minAmount, chain),
    getBurnStats()
  ]);
  
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Background>
      <main className="p-4 md:p-10 pt-24 min-h-screen flex flex-col items-center">
        <div className="container mx-auto max-w-6xl">
          <Title className="text-slate-900 dark:text-white mb-4 text-3xl font-bold">Moon Burns</Title>
          <Text className="text-slate-600 dark:text-white/80 mb-8">
            Real-time tracking of MOON tokens being burned.
          </Text>

          <div className="mb-8 w-full">
            <BurnChart data={chartData} />
            <div className="mt-4 text-center">
              <Text className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-sm font-semibold">Total MOONs Burned</Text>
              <Metric className="text-4xl md:text-5xl font-bold text-orange-500 mt-2">
                {totalBurned.toLocaleString(undefined, { maximumFractionDigits: 0 })} 🔥
              </Metric>
            </div>
          </div>

          <BurnsFilters />

          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <Flex className="mb-4 justify-between">
              <Title className="dark:text-white">Recent Burns</Title>
              <Text className="dark:text-slate-400">Total: {total}</Text>
            </Flex>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="dark:text-slate-300">Time</TableHeaderCell>
                  <TableHeaderCell className="dark:text-slate-300">Chain</TableHeaderCell>
                  <TableHeaderCell className="dark:text-slate-300">Amount</TableHeaderCell>
                  <TableHeaderCell className="dark:text-slate-300">Address</TableHeaderCell>
                  <TableHeaderCell className="dark:text-slate-300">Label</TableHeaderCell>
                  <TableHeaderCell className="dark:text-slate-300">Tx</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {burns.map((burn: any) => {
                  const senderInfo = holderMap.get(burn.sender.toLowerCase());
                  const label = senderInfo?.username 
                    ? (senderInfo.username.startsWith('u/') ? senderInfo.username : `u/${senderInfo.username}`) 
                    : senderInfo?.label || '-';
                  
                  return (
                  <TableRow key={burn.id}>
                    <TableCell className="dark:text-slate-300">{new Date(burn.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge color={burn.chain.includes('Nova') ? 'orange' : burn.chain.includes('One') ? 'blue' : 'slate'}>
                        {burn.chain}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-orange-500">
                      {burn.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} MOON
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {burn.sender.substring(0, 6)}...{burn.sender.substring(38)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {label}
                    </TableCell>
                    <TableCell>
                      <a 
                        href={burn.chain.includes('Nova') ? `https://nova.arbiscan.io/tx/${burn.txHash}` : `https://arbiscan.io/tx/${burn.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline text-xs dark:text-blue-400"
                      >
                        View
                      </a>
                    </TableCell>
                  </TableRow>
                )})}
                {burns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 dark:text-slate-400">
                      No burns found matching criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <Flex className="mt-6 justify-center gap-4">
              {page > 1 && (
                <Link href={`/burns?page=${page - 1}&minAmount=${minAmount}&chain=${chain || 'all'}`}>
                  <Button variant="secondary">Previous</Button>
                </Link>
              )}
              <Text className="dark:text-slate-400">Page {page} of {totalPages || 1}</Text>
              {page < totalPages && (
                <Link href={`/burns?page=${page + 1}&minAmount=${minAmount}&chain=${chain || 'all'}`}>
                  <Button variant="secondary">Next</Button>
                </Link>
              )}
            </Flex>
          </div>
        </div>
      </main>
    </Background>
  );
}
