import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rcryptocurrency/database';

// Round 70 started Dec 9, 2025 - each round is 28 days
const ROUND_70_START = new Date('2025-12-09T00:00:00Z');
const ROUND_DURATION_DAYS = 28;

function getRoundDates(roundNumber: number): { startDate: Date; endDate: Date } {
  const roundOffset = roundNumber - 70;
  const startMs = ROUND_70_START.getTime() + (roundOffset * ROUND_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const endMs = startMs + (ROUND_DURATION_DAYS * 24 * 60 * 60 * 1000);
  return {
    startDate: new Date(startMs),
    endDate: new Date(endMs)
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roundParam = searchParams.get('round');
  
  if (!roundParam) {
    return NextResponse.json({ error: 'Round parameter required' }, { status: 400 });
  }
  
  const roundNumber = parseInt(roundParam);
  if (isNaN(roundNumber)) {
    return NextResponse.json({ error: 'Invalid round number' }, { status: 400 });
  }

  const { startDate, endDate } = getRoundDates(roundNumber);

  // Fetch all entries for this round
  const entries = await prisma.karmaEntry.findMany({
    where: { roundId: roundNumber },
    orderBy: { totalKarma: 'desc' }
  });

  // Build CSV
  const headers = ['rank', 'username', 'post_karma', 'comment_karma', 'total_karma', 'post_count', 'comment_count'];
  const rows = entries.map((entry: any, i: number) => [
    i + 1,
    entry.username,
    entry.postKarma,
    entry.commentKarma,
    entry.totalKarma,
    entry.postCount,
    entry.commentCount
  ]);

  const csvContent = [
    `# Round ${roundNumber} Karma Leaderboard`,
    `# Period: ${startDate.toISOString()} to ${endDate.toISOString()}`,
    `# Exported: ${new Date().toISOString()}`,
    `# Total participants: ${entries.length}`,
    '',
    headers.join(','),
    ...rows.map((row: any[]) => row.join(','))
  ].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="karma-round-${roundNumber}.csv"`
    }
  });
}
