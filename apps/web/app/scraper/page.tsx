import { prisma } from '@rcryptocurrency/database';
import Background from '../../components/Background';
import SentimentChart from '../stats/SentimentChart';
import SentimentInfo from './SentimentInfo';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

export default async function ScraperPage({ searchParams }: { searchParams: { range?: string } }) {
  const range = searchParams.range || '24h';
  
  let startDate = new Date();
  if (range === '7d') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === '30d') {
    startDate.setDate(startDate.getDate() - 30);
  } else {
    // Default 24h
    startDate.setHours(startDate.getHours() - 24);
  }

  const posts = await prisma.redditPost.findMany({
    orderBy: { createdUtc: 'desc' },
    take: 20,
    include: { mentions: true }
  });

  // Fetch data for sentiment chart based on range
  const sentimentPosts = await prisma.redditPost.findMany({
    orderBy: { createdUtc: 'asc' },
    where: { 
      sentiment: { not: null },
      createdUtc: { gte: startDate }
    },
    select: { createdUtc: true, sentiment: true, title: true }
  });

  const chartData = sentimentPosts.map((p: any) => ({
    date: range === '24h' 
      ? new Date(p.createdUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date(p.createdUtc).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
    Sentiment: p.sentiment
  }));

  const mentions = await prisma.projectMention.groupBy({
    by: ['projectId'],
    _count: { projectId: true },
    orderBy: { _count: { projectId: 'desc' } },
    take: 10
  });

  const mentionData = mentions.map((m: any) => ({
    name: m.projectId,
    value: m._count.projectId
  }));

  return (
    <Background>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Subreddit Stats</h1>
          <p className="text-slate-600 dark:text-white/80 mb-8">Real-time analysis of r/CryptoCurrency discussions.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Top Mentions Card */}
            <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-orange-100 dark:border-white/10">
              <div className="bg-orange-100/50 dark:bg-white/5 px-6 py-4 border-b border-orange-100 dark:border-white/10">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white m-0">Top Mentions (Last 24h)</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {mentions.map((m: any) => (
                    <div key={m.projectId} className="flex items-center justify-between group">
                      <span className="font-medium text-slate-700 dark:text-gray-300 group-hover:text-rcc-orange transition-colors">{m.projectId}</span>
                      <span className="bg-rcc-orange/10 text-rcc-orange font-bold px-3 py-1 rounded-full text-sm">
                        {m._count.projectId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sentiment Overview Chart */}
            <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-xl shadow-lg border border-orange-100 dark:border-white/10">
              <div className="relative z-20 bg-orange-100/50 dark:bg-white/5 px-6 py-4 border-b border-orange-100 dark:border-white/10 flex justify-between items-center rounded-t-xl">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white m-0">Sentiment Trend</h2>
                  <SentimentInfo />
                </div>
                <div className="flex gap-2">
                  <Link href="/scraper?range=24h" className={`text-xs px-2 py-1 rounded ${range === '24h' ? 'bg-rcc-orange text-white' : 'bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-rcc-orange/20'}`}>24h</Link>
                  <Link href="/scraper?range=7d" className={`text-xs px-2 py-1 rounded ${range === '7d' ? 'bg-rcc-orange text-white' : 'bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-rcc-orange/20'}`}>7d</Link>
                  <Link href="/scraper?range=30d" className={`text-xs px-2 py-1 rounded ${range === '30d' ? 'bg-rcc-orange text-white' : 'bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-rcc-orange/20'}`}>30d</Link>
                </div>
              </div>
              <div className="p-6">
                <SentimentChart data={chartData} />
              </div>
            </div>

          </div>

          {/* Karma Leaderboard Link */}
          <div className="mb-12">
            <Link 
              href="/leaderboard"
              className="inline-flex items-center gap-3 bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-xl shadow-lg px-6 py-4 border border-orange-100 dark:border-white/10 hover:border-rcc-orange transition-colors group"
            >
              <span className="text-3xl">🏆</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-rcc-orange transition-colors m-0">Karma Leaderboard</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 m-0">Track karma earned in 28-day rounds</p>
              </div>
              <svg className="w-6 h-6 text-slate-400 group-hover:text-rcc-orange transition-colors ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Latest Posts</h2>
          <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-orange-100 dark:border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="bg-orange-100/50 dark:bg-white/5 border-b border-orange-100 dark:border-white/10">
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-auto">Title</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-20 text-center">Score</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-24 text-center">Comments</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-28 text-center">Sentiment</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-48">Mentions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 dark:divide-white/10">
                  {posts.map((post: any) => (
                    <tr key={post.id} className="hover:bg-orange-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-slate-800 dark:text-white font-medium hover:text-rcc-orange transition-colors block truncate"
                          title={post.title}
                        >
                          {post.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-gray-400 font-mono text-center">{post.score}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-gray-400 font-mono text-center">{post.numComments}</td>
                      <td className="px-4 py-3 text-center">
                        {post.sentiment != null ? (
                          <span className={`font-bold px-2 py-1 rounded text-xs inline-block w-16 text-center ${
                            post.sentiment > 0.05 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                            post.sentiment < -0.05 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                            'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {post.sentiment.toFixed(2)}
                          </span>
                        ) : <span className="text-slate-400 text-sm">N/A</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {post.mentions.map((m: any) => (
                            <span key={m.id} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 shadow-sm font-medium">
                              {m.projectId}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Background>
  );
}
