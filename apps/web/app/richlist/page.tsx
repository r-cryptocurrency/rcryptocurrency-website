import { prisma } from '@rcryptocurrency/database';
import type { Prisma } from '@rcryptocurrency/database';
import { Card, Title, Text } from "@tremor/react";
import Background from '../../components/Background';
import Link from 'next/link';
import RichlistTable from './RichlistTable';
import Search from './Search';

export const dynamic = 'force-dynamic';

export default async function RichlistPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'totalBalance';
  const order = typeof searchParams.order === 'string' ? searchParams.order : 'desc';
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  
  const pageSize = 100;
  const skip = (page - 1) * pageSize;

  let orderBy: any[] = [];
  let extraWhere: Prisma.HolderWhereInput = {};

  if (sort === 'earnedMoons') {
    orderBy = [{ user: { earnedMoons: order } }];
    // When sorting by earned moons, only show users who have a Reddit account linked
    // This prevents nulls from cluttering the top/bottom of the list
    extraWhere = { username: { not: null } };
  } else if (['totalBalance', 'balanceNova', 'balanceOne', 'balanceEth'].includes(sort)) {
    orderBy = [{ [sort]: order }];
  } else if (sort === 'lastTransferAt') {
    // Always put nulls last, so we see actual dates first whether sorting asc or desc
    orderBy = [{ lastTransferAt: { sort: order, nulls: 'last' } }];
  } else {
    orderBy = [{ totalBalance: 'desc' }];
  }

  // Always add a secondary sort by address to ensure deterministic pagination
  // This fixes the issue where "Next Page" shows the same results if values are identical
  orderBy.push({ address: 'asc' });

  const where: Prisma.HolderWhereInput = {
    ...extraWhere,
    ...(search ? {
      OR: [
        { address: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { label: { contains: search, mode: 'insensitive' } }
      ]
    } : {})
  };

  const [holders, totalHolders] = await Promise.all([
    prisma.holder.findMany({
      where,
      orderBy,
      take: pageSize,
      skip: skip,
      include: { user: true }
    }),
    prisma.holder.count({ where })
  ]);

  const totalPages = Math.ceil(totalHolders / pageSize);

  // Helper to generate pagination links
  const getPageLink = (p: number) => `/richlist?page=${p}&sort=${sort}&order=${order}${search ? `&search=${search}` : ''}`;
  
  const PaginationButton = ({ page, label, active = false, disabled = false }: any) => {
    if (disabled) return <span className="px-3 py-2 text-slate-400 dark:text-slate-600 border border-transparent">{label}</span>;
    if (active) return <span className="px-3 py-2 bg-rcc-orange text-white rounded-lg border border-rcc-orange">{label}</span>;
    return (
      <Link 
        href={getPageLink(page)}
        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {label}
      </Link>
    );
  };

  return (
    <Background>
      <main className="p-10 pt-24 min-h-screen">
        <div className="container mx-auto">
          <Title className="text-slate-900 dark:text-white mb-4 text-3xl font-bold">MOON Richlist</Title>
          <Text className="text-slate-600 dark:text-white/80 mb-8">
            Top Holders across Arbitrum Nova, Arbitrum One, and Ethereum. 
            Showing {skip + 1}-{Math.min(skip + pageSize, totalHolders)} of {totalHolders.toLocaleString()}.
          </Text>
          
          <Search />
          
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl shadow-lg overflow-hidden border border-orange-100 dark:border-slate-800 mb-8">
            <RichlistTable 
              holders={holders} 
              skip={skip} 
              currentSort={sort}
              currentOrder={order}
            />
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <PaginationButton page={1} label="First" disabled={page === 1} />
            <PaginationButton page={page - 1} label="Prev" disabled={page === 1} />
            
            {/* Show range of pages around current */}
            {page > 3 && <span className="px-2 text-slate-400">...</span>}
            
            {Array.from({ length: 5 }, (_, i) => page - 2 + i)
              .filter(p => p > 0 && p <= totalPages)
              .map(p => (
                <PaginationButton key={p} page={p} label={p.toString()} active={p === page} />
              ))}
            
            {page < totalPages - 2 && <span className="px-2 text-slate-400">...</span>}

            <PaginationButton page={page + 1} label="Next" disabled={page === totalPages} />
            <PaginationButton page={totalPages} label="Last" disabled={page === totalPages} />
          </div>
        </div>
      </main>
    </Background>
  );
}
