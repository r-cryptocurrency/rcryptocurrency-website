import { prisma, Swap } from '@rcryptocurrency/database';
import { Title, Text, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Badge, Flex, Button } from "@tremor/react";
import Background from '../../components/Background';
import OpenInUniswap from './OpenInUniswap';
import SwapFilters from './SwapFilters';
import Link from 'next/link';

export const metadata = {
  title: 'Swap MOONs | r/CryptoCurrency',
  description: 'Swap ETH for MOONs on Arbitrum One via Uniswap.',
};

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

async function getRecentSwaps(page: number, minAmount: number, dex: string | undefined) {
  try {
    // Ensure page is at least 1 to prevent negative skip values
    const safePage = Math.max(1, Math.floor(page));
    const safeMinAmount = Math.max(0, minAmount);
    
    const where: any = {};
    if (safeMinAmount > 0) {
      // Filter by amountIn OR amountOut being greater than minAmount
      // Since we don't know which one is MOON easily here without checking token symbol, 
      // we'll just check if either is large enough.
      where.OR = [
        { amountIn: { gte: safeMinAmount } },
        { amountOut: { gte: safeMinAmount } }
      ];
    }
    if (dex && dex !== 'all') {
      where.dex = { contains: dex };
    }

    const [data, total] = await Promise.all([
      prisma.swap.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (safePage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.swap.count({ where })
    ]);

    // Resolve makers
    const makers = Array.from(new Set(data.map((s: any) => s.maker.toLowerCase())));
    const holders = await prisma.holder.findMany({
      where: { address: { in: makers } },
      select: { address: true, username: true, label: true }
    });
    
    const holderMap = new Map<string, { username: string | null, label: string | null }>();
    holders.forEach((h: any) => holderMap.set(h.address.toLowerCase(), h));

    return { data, total, holderMap };
  } catch (e) {
    console.error("Failed to fetch swaps:", e);
    return { data: [], total: 0, holderMap: new Map() };
  }
}

export default async function SwapPage({ searchParams }: { searchParams: { page?: string, minAmount?: string, dex?: string } }) {
  const parsedPage = parseInt(searchParams.page || '1');
  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const parsedMinAmount = parseFloat(searchParams.minAmount || '0');
  const minAmount = Number.isNaN(parsedMinAmount) || parsedMinAmount < 0 ? 0 : parsedMinAmount;
  const dex = searchParams.dex;

  const { data: swaps, total, holderMap } = await getRecentSwaps(page, minAmount, dex);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Uniswap URL for Arbitrum One
  // Output: MOON (0x24404dc041d74cd03cfe28855f555559390c931b)
  // Chain: Arbitrum
  const swapUrl = "https://app.uniswap.org/swap?chain=arbitrum&outputCurrency=0x24404dc041d74cd03cfe28855f555559390c931b";

  return (
    <Background>
      <main className="p-4 md:p-10 pt-24 min-h-screen flex flex-col items-center">
        <div className="container mx-auto max-w-4xl text-center">
          <Title className="text-slate-900 dark:text-white mb-4 text-3xl font-bold">Swap MOONs</Title>
          <Text className="text-slate-600 dark:text-white/80 mb-8">
            Trade ETH for MOONs directly on Arbitrum One.
          </Text>

          <div className="w-full max-w-[600px] mx-auto mb-4 flex justify-end">
            <OpenInUniswap url={swapUrl} />
          </div>

          <div className="w-full max-w-[600px] mx-auto bg-slate-50 dark:bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-[700px] relative">
            <iframe 
              src={swapUrl}
              height="100%"
              width="100%"
              style={{
                border: 0,
                margin: '0 auto',
                display: 'block',
              }}
              id="uniswap-iframe"
              title="Uniswap Interface"
            />
          </div>
          
          <Text className="mt-6 text-sm text-slate-500">
            Note: Ensure you are connected to the <strong>Arbitrum One</strong> network in your wallet.
          </Text>

          <div className="mt-12 w-full max-w-[800px] mx-auto">
            <Title className="mb-4 text-left dark:text-white">Recent Swaps</Title>
            
            <SwapFilters />

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <Flex className="mb-4 justify-between">
                <Text className="dark:text-slate-400">Total: {total}</Text>
              </Flex>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="dark:text-slate-300">Time</TableHeaderCell>
                    <TableHeaderCell className="dark:text-slate-300">DEX</TableHeaderCell>
                    <TableHeaderCell className="dark:text-slate-300">Address</TableHeaderCell>
                    <TableHeaderCell className="dark:text-slate-300">Label</TableHeaderCell>
                    <TableHeaderCell className="dark:text-slate-300">In</TableHeaderCell>
                    <TableHeaderCell className="dark:text-slate-300">Out</TableHeaderCell>
                    <TableHeaderCell className="dark:text-slate-300">Tx</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {swaps.map((swap: any) => {
                    const makerInfo = holderMap.get(swap.maker.toLowerCase());
                    const label = makerInfo?.username 
                      ? (makerInfo.username.startsWith('u/') ? makerInfo.username : `u/${makerInfo.username}`) 
                      : makerInfo?.label || '-';
                    
                    return (
                    <TableRow key={swap.id}>
                    <TableCell className="dark:text-slate-300">
                      <div className="flex flex-col">
                        <span>{new Date(swap.timestamp).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-500">{new Date(swap.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {swap.dex}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {swap.maker.substring(0, 6)}...{swap.maker.substring(38)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {label}
                    </TableCell>
                    <TableCell className="font-mono text-sm dark:text-slate-300">
                        {swap.amountIn.toLocaleString(undefined, { maximumFractionDigits: ['ETH', 'WETH'].includes(swap.tokenIn) ? 5 : 2 })} {swap.tokenIn}
                      </TableCell>
                      <TableCell className="font-mono text-sm dark:text-slate-300">
                        {swap.amountOut.toLocaleString(undefined, { maximumFractionDigits: ['ETH', 'WETH'].includes(swap.tokenOut) ? 5 : 2 })} {swap.tokenOut}
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`https://arbiscan.io/tx/${swap.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:underline text-xs dark:text-blue-400"
                        >
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  )})}
                  {swaps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 dark:text-slate-400">
                        No swaps found matching criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <Flex className="mt-6 justify-center gap-4">
                {page > 1 && (
                  <Link href={`/swap?page=${page - 1}&minAmount=${minAmount}&dex=${dex || 'all'}`}>
                    <Button variant="secondary">Previous</Button>
                  </Link>
                )}
                <Text className="dark:text-slate-400">Page {page} of {totalPages || 1}</Text>
                {page < totalPages && (
                  <Link href={`/swap?page=${page + 1}&minAmount=${minAmount}&dex=${dex || 'all'}`}>
                    <Button variant="secondary">Next</Button>
                  </Link>
                )}
              </Flex>
            </div>
          </div>
        </div>
      </main>
    </Background>
  );
}
