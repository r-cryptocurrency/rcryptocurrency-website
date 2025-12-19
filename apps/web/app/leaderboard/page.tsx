import { prisma } from '@rcryptocurrency/database';
import Background from '../../components/Background';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

// Round 70 started Dec 9, 2025 - each round is 28 days
const ROUND_70_START = new Date('2025-12-09T00:00:00Z');
const ROUND_DURATION_DAYS = 28;

function getRoundForDate(date: Date): number {
  const msDiff = date.getTime() - ROUND_70_START.getTime();
  const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
  const roundOffset = Math.floor(daysDiff / ROUND_DURATION_DAYS);
  return 70 + roundOffset;
}

function getRoundDates(roundNumber: number): { startDate: Date; endDate: Date } {
  const roundOffset = roundNumber - 70;
  const startMs = ROUND_70_START.getTime() + (roundOffset * ROUND_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const endMs = startMs + (ROUND_DURATION_DAYS * 24 * 60 * 60 * 1000);
  return {
    startDate: new Date(startMs),
    endDate: new Date(endMs)
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysRemaining(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function LeaderboardPage({ searchParams }: { searchParams: { round?: string } }) {
  const currentRound = getRoundForDate(new Date());
  const requestedRound = searchParams.round ? parseInt(searchParams.round) : currentRound;
  const { startDate, endDate } = getRoundDates(requestedRound);
  const daysRemaining = requestedRound === currentRound ? getDaysRemaining(endDate) : 0;
  const isActive = requestedRound === currentRound;

  // Fetch leaderboard entries
  const entries = await prisma.karmaEntry.findMany({
    where: { roundId: requestedRound },
    orderBy: { totalKarma: 'desc' },
    take: 100
  });

  // Get available rounds for navigation
  const rounds = await prisma.karmaRound.findMany({
    orderBy: { id: 'desc' },
    take: 10
  });

  return (
    <Background>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Karma Leaderboard</h1>
              <p className="text-slate-600 dark:text-white/80">
                r/CryptoCurrency karma earned in 28-day rounds
              </p>
            </div>
            
            {/* Round Selector */}
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <Link 
                href={`/leaderboard?round=${requestedRound - 1}`}
                className={`px-3 py-1 rounded bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-rcc-orange/20 transition-colors ${requestedRound <= 70 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                ← Prev
              </Link>
              <span className="font-bold text-xl text-rcc-orange">Round {requestedRound}</span>
              <Link 
                href={`/leaderboard?round=${requestedRound + 1}`}
                className={`px-3 py-1 rounded bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-rcc-orange/20 transition-colors ${requestedRound >= currentRound ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Next →
              </Link>
            </div>
          </div>

          {/* Round Info Card */}
          <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 border border-orange-100 dark:border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</div>
                <div className={`text-xl font-bold ${isActive ? 'text-green-500' : 'text-slate-600 dark:text-slate-300'}`}>
                  {isActive ? '🟢 Active' : '⚫ Completed'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">Start Date</div>
                <div className="text-xl font-bold text-slate-800 dark:text-white">{formatDate(startDate)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">End Date</div>
                <div className="text-xl font-bold text-slate-800 dark:text-white">{formatDate(endDate)}</div>
              </div>
              {isActive && (
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">Days Remaining</div>
                  <div className="text-xl font-bold text-rcc-orange">{daysRemaining}</div>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-orange-100 dark:border-white/10">
            {entries.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No Data Yet</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {isActive 
                    ? 'Karma tracking has just started. Post and comment on r/CryptoCurrency to appear here!' 
                    : 'No karma data recorded for this round.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left border-collapse">
                  <thead>
                    <tr className="bg-orange-100/50 dark:bg-white/5 border-b border-orange-100 dark:border-white/10">
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-16 text-center">Rank</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider">Username</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-28 text-right">Post Karma</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-32 text-right">Comment Karma</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-28 text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-20 text-center">Posts</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-gray-400 text-sm uppercase tracking-wider w-24 text-center">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100 dark:divide-white/10">
                    {entries.map((entry, i) => (
                      <tr key={entry.id} className="hover:bg-orange-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-center">
                          {i === 0 && <span className="text-2xl">🥇</span>}
                          {i === 1 && <span className="text-2xl">🥈</span>}
                          {i === 2 && <span className="text-2xl">🥉</span>}
                          {i > 2 && <span className="font-bold text-slate-600 dark:text-slate-400">{i + 1}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <a 
                            href={`https://reddit.com/u/${entry.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-slate-800 dark:text-white hover:text-rcc-orange transition-colors"
                          >
                            u/{entry.username}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          {entry.postKarma.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          {entry.commentKarma.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-bold font-mono text-rcc-orange">
                          {entry.totalKarma.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
                          {entry.postCount}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
                          {entry.commentCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CSV Export Link */}
          <div className="mt-6 text-center">
            <a 
              href={`/api/karma-export?round=${requestedRound}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rcc-orange text-white rounded-lg hover:bg-rcc-orange/90 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </a>
          </div>
        </div>
      </div>
    </Background>
  );
}
