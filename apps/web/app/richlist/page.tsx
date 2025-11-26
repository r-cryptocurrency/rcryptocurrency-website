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

  let orderBy: any = { totalBalance: 'desc' };
  if (sort === 'earnedMoons') {
    orderBy = { user: { earnedMoons: order } };
  } else if (['totalBalance', 'balanceNova', 'balanceOne', 'balanceEth', 'lastTransferAt'].includes(sort)) {
    orderBy = { [sort]: order };
  }

  const where: Prisma.HolderWhereInput = search ? {
    OR: [
      { address: { contains: search } },
      { username: { contains: search } },
      { label: { contains: search } }
    ]
  } : {};

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
          <div className="flex justify-center gap-4">
            {page > 1 && (
              <Link 
                href={`/richlist?page=${page - 1}&sort=${sort}&order=${order}${search ? `&search=${search}` : ''}`}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-slate-600 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link 
                href={`/richlist?page=${page + 1}&sort=${sort}&order=${order}${search ? `&search=${search}` : ''}`}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </main>
    </Background>
  );
}
