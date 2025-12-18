import { prisma } from '@rcryptocurrency/database';
import { Card, Title, Text, BarList, Flex, Grid, Metric, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, BadgeDelta } from "@tremor/react";
import Background from '../../components/Background';
import SentimentChart from '../stats/SentimentChart';
import SentimentInfo from './SentimentInfo';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

// Calculate the current moon round dynamically
function getCurrentMoonRound(): { roundNumber: number; startDate: Date; endDate: Date } {
  // Round 51 started Dec 9, 2025
  const ROUND_51_START = new Date('2025-12-09T00:00:00Z');
  const DAYS_PER_ROUND = 28;
  
  const now = new Date();
  const daysSinceRound51 = Math.floor((now.getTime() - ROUND_51_START.getTime()) / (1000 * 60 * 60 * 24));
  const roundsSinceR51 = Math.max(0, Math.floor(daysSinceRound51 / DAYS_PER_ROUND));
  
  const currentRound = 51 + roundsSinceR51;
  const roundStartDate = new Date(ROUND_51_START.getTime() + (roundsSinceR51 * DAYS_PER_ROUND * 24 * 60 * 60 * 1000));
  const roundEndDate = new Date(roundStartDate.getTime() + (DAYS_PER_ROUND * 24 * 60 * 60 * 1000) - 1);
  
  return { roundNumber: currentRound, startDate: roundStartDate, endDate: roundEndDate };
}

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

  // --- Dynamic Moon Round ---
  const { roundNumber, startDate: roundStart, endDate: roundEnd } = getCurrentMoonRound();

  // 1. Get Post Scores
  const postScores = await prisma.redditPost.groupBy({
    by: ['author'],
    _sum: { score: true },
    where: { createdUtc: { gte: roundStart, lte: roundEnd } }
  });

  // 2. Get Comment Scores
  const commentScores = await prisma.redditComment.groupBy({
    by: ['author'],
    _sum: { score: true },
    where: { createdUtc: { gte: roundStart, lte: roundEnd } }
  });

  // 3. Merge Scores
  const karmaMap = new Map<string, number>();

  postScores.forEach(p => {
    const current = karmaMap.get(p.author) || 0;
    karmaMap.set(p.author, current + (p._sum.score || 0));
  });

  commentScores.forEach(c => {
    const current = karmaMap.get(c.author) || 0;
    karmaMap.set(c.author, current + (c._sum.score || 0));
  });

  // 4. Sort and Top 20
  const leaderboard = Array.from(karmaMap.entries())
    .map(([author, score]) => ({ author, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

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

  const chartData = sentimentPosts.map(p => ({
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

  const mentionData = mentions.map(m => ({
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
                  {mentions.map((m) => (
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

          {/* Karma Leaderboard */}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Karma Leaderboard (Round {roundNumber})</h2>
          <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-orange-100 dark:border-white/10 mb-12">
            <div className="bg-orange-100/50 dark:bg-white/5 px-6 py-4 border-b border-orange-100 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white m-0">Top Earners ({roundStart.toLocaleDateString()} - {roundEnd.toLocaleDateString()})</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Based on scraped posts/comments</span>
            </div>
            <div className="p-6">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Rank</TableHeaderCell>
                    <TableHeaderCell>User</TableHeaderCell>
                    <TableHeaderCell className="text-right">Est. Karma</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((user, index) => (
                    <TableRow key={user.author}>
                      <TableCell>
                        <BadgeDelta deltaType={index < 3 ? "increase" : "unchanged"} isIncreasePositive={true} size="xs">
                          #{index + 1}
                        </BadgeDelta>
                      </TableCell>
                      <TableCell>
                        <a href={`https://reddit.com/u/${user.author}`} target="_blank" rel="noreferrer" className="text-slate-700 dark:text-slate-300 hover:text-rcc-orange font-medium">
                          u/{user.author}
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-slate-800 dark:text-white">
                        {user.score.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
                  {posts.map((post) => (
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
                          {post.mentions.map(m => (
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
