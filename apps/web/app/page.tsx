import Image from 'next/image'
import { prisma } from '@rcryptocurrency/database';
import { Card, Metric, Text, Flex, Grid } from "@tremor/react";
import Background from '../components/Background';
import InteractiveMoon from '../components/InteractiveMoon';
import Timeline from '../components/Timeline';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const holderCount = await prisma.holder.count();
    const userCount = await prisma.redditUser.count();
    const submissionCount = await prisma.submission.count();
    
      // Calculate total MOONs tracked (sum of totalBalance)
    const totalMoons = await prisma.holder.aggregate({
      _sum: {
        totalBalance: true
      }
    });

    const marketData = await prisma.marketStat.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    return {
      holderCount,
      userCount,
      submissionCount,
      totalMoons: totalMoons?._sum?.totalBalance || 0,
      marketData
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return {
      holderCount: 0,
      userCount: 0,
      submissionCount: 0,
      totalMoons: 0,
      marketData: null
    };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <Background>
      <section className="min-h-screen flex items-center relative overflow-hidden pt-20 rounded-br-[200px]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4">
                r/CryptoCurrency
              </h1>
              <h2 className="text-2xl lg:text-4xl font-bold text-slate-800 dark:text-white/90 mb-6">
                The Biggest Crypto Community
              </h2>
              <p className="text-lg text-slate-600 dark:text-white/80 mb-8 max-w-2xl mx-auto lg:mx-0">
                The leading community for cryptocurrency news, discussion, and analysis.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto lg:mx-0">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-orange-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                  <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">MOON Price</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      ${stats.marketData?.priceUsd?.toFixed(4) || '0.0000'}
                    </p>
                    <i className="fa-solid fa-moon text-rcc-yellow animate-pulse text-xl"></i>
                  </div>
                  <p className={`text-sm font-medium ${(stats.marketData?.change24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(stats.marketData?.change24h || 0) >= 0 ? '+' : ''}
                    {stats.marketData?.change24h?.toFixed(2) || '0.00'}% (24h)
                  </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-orange-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                  <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">Market Cap</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    ${(stats.marketData?.marketCap || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-orange-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                  <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">Holders Tracked</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.holderCount.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-orange-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                  <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">MOON Earners</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.userCount.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-orange-100 dark:border-slate-800 sm:col-span-2 flex flex-col justify-center items-center text-center">
                  <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">Subreddit Subscribers</h3>
                  <p className="text-4xl font-bold text-slate-900 dark:text-white">
                    {(stats.marketData?.redditSubscribers || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a href="https://www.reddit.com/r/CryptoCurrency/" target="_blank" rel="noopener noreferrer" className="inline-block bg-rcc-orange hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Subreddit
                </a>
                <a href="/richlist" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Richlist
                </a>
                <a href="/scraper" className="inline-block bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Stats
                </a>
                <a href="/swap" className="inline-block bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Swap
                </a>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <InteractiveMoon />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <Timeline />

      {/* Footer */}
      <footer id="site-footer" className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 relative z-10 transition-colors duration-300">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-8 mb-8">
            <a href="https://www.reddit.com/r/CryptoCurrency/" target="_blank" className="text-slate-400 hover:text-rcc-orange text-2xl transition-colors">
              <i className="fa-brands fa-reddit"></i>
            </a>
            <a href="https://twitter.com/CCMoons" target="_blank" className="text-slate-400 hover:text-rcc-orange text-2xl transition-colors">
              <i className="fa-brands fa-twitter"></i>
            </a>
            <a href="https://t.me/rCryptoCurrencyOfficial" target="_blank" className="text-slate-400 hover:text-rcc-orange text-2xl transition-colors">
              <i className="fa-brands fa-telegram"></i>
            </a>
            <a href="https://discord.gg/cryptocurrency" target="_blank" className="text-slate-400 hover:text-rcc-orange text-2xl transition-colors">
              <i className="fa-brands fa-discord"></i>
            </a>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} r/CryptoCurrency. Community Owned & Operated.
          </p>
        </div>
      </footer>
    </Background>
  );
}
