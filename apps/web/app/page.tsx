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
      {/* Hero Section - Community First */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4">
                r/CryptoCurrency
              </h1>
              <h2 className="text-3xl lg:text-5xl font-extrabold bg-gradient-to-r from-rcc-orange to-orange-500 bg-clip-text text-transparent mb-6">
                WORLD&apos;S LARGEST CRYPTO COMMUNITY
              </h2>

              {/* Subscriber Count */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-rcc-orange/30 dark:border-rcc-orange/50 mb-8 max-w-md mx-auto lg:mx-0">
                <h3 className="text-slate-600 dark:text-slate-400 text-lg font-medium mb-2">Community Members</h3>
                <p className="text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white">
                  {(stats.marketData?.redditSubscribers || 0).toLocaleString()}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">and growing every day</p>
              </div>

              {/* Social Links */}
              <div className="mb-8">
                <h3 className="text-slate-700 dark:text-slate-300 text-lg font-semibold mb-4">Join the Community</h3>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <a href="https://www.reddit.com/r/CryptoCurrency/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-brands fa-reddit text-xl"></i>
                    Reddit
                  </a>
                  <a href="https://discord.gg/ZuU9Gqeqmy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-brands fa-discord text-xl"></i>
                    Discord
                  </a>
                  <a href="https://t.me/rCryptoCurrencyOfficial" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-brands fa-telegram text-xl"></i>
                    Telegram
                  </a>
                  <a href="https://twitter.com/CCMOD_" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-brands fa-twitter text-xl"></i>
                    Twitter
                  </a>
                  <a href="https://snapshot.org/#/rcryptocurrency.eth" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-solid fa-vote-yea text-xl"></i>
                    Governance
                  </a>
                </div>
              </div>

              <p className="text-lg text-slate-600 dark:text-white/80 max-w-2xl mx-auto lg:mx-0">
                The leading community for cryptocurrency news, discussion, and analysis.
              </p>
            </div>

            <div className="hidden lg:block relative">
              <InteractiveMoon />
            </div>
          </div>
        </div>
      </section>

      {/* MOON Token Section */}
      <section className="min-h-screen flex items-center relative overflow-hidden py-20 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-center lg:justify-start gap-3">
                <i className="fa-solid fa-moon text-rcc-yellow animate-pulse"></i>
                MOON Token
              </h2>
              <p className="text-lg text-slate-600 dark:text-white/80 mb-8 max-w-2xl mx-auto lg:mx-0">
                Our community token that powers governance and rewards quality contributions.
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

              </div>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a href="/richlist" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Richlist
                </a>
                <a href="/leaderboard" className="inline-block bg-rcc-orange hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Leaderboard
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
              <div className="relative w-full max-w-md mx-auto" style={{ transform: 'scale(0.7)' }}>
                <InteractiveMoon />
              </div>
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
            <a href="https://twitter.com/CCMOD_" target="_blank" className="text-slate-400 hover:text-rcc-orange text-2xl transition-colors">
              <i className="fa-brands fa-twitter"></i>
            </a>
            <a href="https://t.me/rCryptoCurrencyOfficial" target="_blank" className="text-slate-400 hover:text-rcc-orange text-2xl transition-colors">
              <i className="fa-brands fa-telegram"></i>
            </a>
                        <a href="https://discord.gg/ZuU9Gqeqmy" target="_blank" className="text-slate-400 hover:text-rcc-orange text-2xl transition-colors">
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
