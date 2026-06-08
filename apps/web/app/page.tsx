import Image from 'next/image'
import Background from '../components/Background';
import InteractiveMoon from '../components/InteractiveMoon';
import Timeline from '../components/Timeline';
import { createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    // Dynamically import prisma to catch initialization errors
    const { prisma } = await import('@rcryptocurrency/database');

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
    // Return default values when database is unavailable
    return {
      holderCount: 0,
      userCount: 0,
      submissionCount: 0,
      totalMoons: 0,
      marketData: null
    };
  }
}

// Subreddit member count. Reddit blocks datacenter IPs (serves an HTML
// challenge instead of JSON), so the live fetch is best-effort only and usually
// fails from the server. Fallback chain (in Home): live → last value the
// scraper saved in the DB → REDDIT_SUBS_FALLBACK. Override the constant anytime
// via the REDDIT_SUBS_FALLBACK env var (no code change needed) if the number
// drifts substantially.
const REDDIT_SUBS_FALLBACK = Number(process.env.REDDIT_SUBS_FALLBACK) || 10_000_000;
async function getRedditSubscribers(): Promise<number> {
  try {
    const res = await fetch('https://www.reddit.com/r/CryptoCurrency/about.json', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const j = await res.json();
      const n = j?.data?.subscribers;
      if (typeof n === 'number' && n > 0) return n;
    }
  } catch {
    // ignore — Reddit blocked the request
  }
  return 0; // signal "no live value"; Home applies the DB/constant fallback
}

// Live MOON/USD from the Camelot V3 MOON/WETH pool on Arbitrum One (MOON was
// delisted from Kraken, so the old price feed is dead). ETH/USD via Kraken.
async function getMoonPrice(): Promise<number> {
  try {
    const client = createPublicClient({ chain: arbitrum, transport: http('https://arb1.arbitrum.io/rpc') });
    const res = await client.call({
      to: '0x5e27a422ec06a57567a843fd65a1bbb06ac19fc0', // Camelot V3 MOON/WETH pool
      data: '0xe76c01e4', // globalState()
    });
    if (!res.data) return 0;
    const sqrtPriceX96 = BigInt('0x' + res.data.slice(2, 66));
    const ratio = Number(sqrtPriceX96) / 2 ** 96;
    const ethPerMoon = ratio * ratio; // token0=MOON, token1=WETH (both 18 decimals)
    const ethRes = await fetch('https://api.kraken.com/0/public/Ticker?pair=XETHZUSD', { next: { revalidate: 300 } });
    const ethJson = await ethRes.json();
    const ethUsd = parseFloat(ethJson?.result?.XETHZUSD?.c?.[0] || '0');
    return ethPerMoon * ethUsd;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const [stats, liveSubs, moonPrice] = await Promise.all([
    getStats(),
    getRedditSubscribers(),
    getMoonPrice(),
  ]);
  // live count → last value the scraper saved in the DB → env/constant fallback
  const redditSubs =
    liveSubs || Number(stats.marketData?.redditSubscribers) || REDDIT_SUBS_FALLBACK;

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
                  {redditSubs.toLocaleString()}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">and growing every day</p>
              </div>

              {/* Social Links */}
              <div className="mb-8">
                <h3 className="text-slate-700 dark:text-slate-300 text-lg font-semibold mb-4">Join the Community</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto lg:mx-0">
                  <a href="https://www.reddit.com/r/CryptoCurrency/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-brands fa-reddit text-xl"></i>
                    <span className="hidden sm:inline">Reddit</span>
                  </a>
                  <a href="https://discord.gg/ZuU9Gqeqmy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-brands fa-discord text-xl"></i>
                    <span className="hidden sm:inline">Discord</span>
                  </a>
                  <a href="https://t.me/rCryptoCurrencyOfficial" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-brands fa-telegram text-xl"></i>
                    <span className="hidden sm:inline">Telegram</span>
                  </a>
                  <a href="https://twitter.com/CCMOD_" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-black hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-brands fa-x-twitter text-xl"></i>
                    <span className="hidden sm:inline">X</span>
                  </a>
                  <a href="https://snapshot.org/#/s:cryptomods.eth" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-solid fa-vote-yea text-xl"></i>
                    <span className="hidden sm:inline">Governance</span>
                  </a>
                  <a href="https://moondao.llc" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-rcc-orange hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i className="fa-solid fa-moon text-xl"></i>
                    <span className="hidden sm:inline">CCMOON DAO</span>
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

      {/* Foundation Section */}
      <section className="min-h-screen flex items-center relative overflow-hidden py-20 bg-gradient-to-b from-slate-50/50 to-orange-50/50 dark:from-slate-900/20 dark:to-slate-950/50">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                <span className="bg-gradient-to-r from-rcc-orange to-orange-500 bg-clip-text text-transparent">CCMOON DAO</span>
              </h2>
              <p className="text-xl font-semibold text-rcc-orange mb-4">The rCryptoCurrency Foundation</p>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
		The official Non-Profit Organization represents rCryptoCurrency’s 10 million+ members, moderates the community across all platforms, and operates Community Tools and Education Programs for everyone.                
	      </p>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Registered in the Marshall Islands as a Non-Profit Organization (501(c)(3)-equivalent), dedicated to fostering transparency, community governance, sustainable growth of the ecosystem, and Education.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a href="https://snapshot.org/#/s:cryptomods.eth" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <i className="fa-solid fa-vote-yea text-lg"></i>
                  <span>Governance & Voting</span>
                </a>
                <a href="https://moondao.llc" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-rcc-orange hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <i className="fa-solid fa-moon text-lg"></i>
                  <span>CCMOON DAO</span>
                </a>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-12 rounded-2xl border-2 border-rcc-orange/30 dark:border-rcc-orange/50">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Foundation Focus</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-rcc-orange text-lg mt-1 flex-shrink-0"></i>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Education & Tools</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Building resources and programs for the whole world</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-rcc-orange text-lg mt-1 flex-shrink-0"></i>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Community Governance</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Democratic and compliant decision-making through CCMOON DAO</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-rcc-orange text-lg mt-1 flex-shrink-0"></i>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Community Moderation</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Managing engagement across all platforms</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fa-solid fa-check text-rcc-orange text-lg mt-1 flex-shrink-0"></i>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Transparency</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Ensuring accountability and open operations</p>
                    </div>
                  </li>
                </ul>
              </div>
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
                      ${moonPrice ? moonPrice.toFixed(5) : '0.00000'}
                    </p>
                    <i className="fa-solid fa-moon text-rcc-yellow animate-pulse text-xl"></i>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    via Camelot (Arbitrum One)
                  </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-orange-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                  <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">Market Cap</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    ${moonPrice ? Math.round(moonPrice * 79800000).toLocaleString() : '0'}
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
                <a href="https://moondao.llc/richlist" target="_blank" rel="noopener noreferrer" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Rich List
                </a>
                <a href="https://moondao.llc/burns" target="_blank" rel="noopener noreferrer" className="inline-block bg-rcc-orange hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Burns
                </a>
                <a href="https://moondao.llc/swaps" target="_blank" rel="noopener noreferrer" className="inline-block bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Swaps
                </a>
                <a href="https://moondao.llc" target="_blank" rel="noopener noreferrer" className="inline-block bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  CCMOON DAO
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
              <i className="fa-brands fa-x-twitter"></i>
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
