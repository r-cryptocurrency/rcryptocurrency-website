import { prisma } from '@rcryptocurrency/database';

// Round 70 started Dec 9, 2025 - each round is 28 days
const ROUND_70_START = new Date('2025-12-09T00:00:00Z');
const ROUND_DURATION_DAYS = 28;

/**
 * Calculate which round a given date falls into
 */
export function getRoundForDate(date: Date): number {
  const msDiff = date.getTime() - ROUND_70_START.getTime();
  const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
  const roundOffset = Math.floor(daysDiff / ROUND_DURATION_DAYS);
  return 70 + roundOffset;
}

/**
 * Get the start and end dates for a given round
 */
export function getRoundDates(roundNumber: number): { startDate: Date; endDate: Date } {
  const roundOffset = roundNumber - 70;
  const startMs = ROUND_70_START.getTime() + (roundOffset * ROUND_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const endMs = startMs + (ROUND_DURATION_DAYS * 24 * 60 * 60 * 1000);
  return {
    startDate: new Date(startMs),
    endDate: new Date(endMs)
  };
}

/**
 * Get or create the current active round
 */
export async function getOrCreateCurrentRound(): Promise<{ id: number; startDate: Date; endDate: Date }> {
  const now = new Date();
  const currentRoundNumber = getRoundForDate(now);
  const { startDate, endDate } = getRoundDates(currentRoundNumber);

  // Upsert the round
  const round = await prisma.karmaRound.upsert({
    where: { id: currentRoundNumber },
    update: { isActive: true },
    create: {
      id: currentRoundNumber,
      startDate,
      endDate,
      isActive: true
    }
  });

  // Mark any other rounds as inactive
  await prisma.karmaRound.updateMany({
    where: { 
      id: { not: currentRoundNumber },
      isActive: true 
    },
    data: { isActive: false }
  });

  return round;
}

/**
 * Update karma for a user in the current round
 * @param isNewItem - true when this is a newly discovered post/comment (increment count), false for score updates
 */
export async function updateKarmaForUser(
  username: string,
  karmaChange: number,
  isComment: boolean,
  isNewItem: boolean = false
): Promise<void> {
  // Skip deleted/removed users and AutoModerator
  if (!username || username === '[deleted]' || username === '[removed]' || username === 'AutoModerator') {
    return;
  }

  const round = await getOrCreateCurrentRound();

  // Upsert the karma entry
  await prisma.karmaEntry.upsert({
    where: {
      roundId_username: {
        roundId: round.id,
        username
      }
    },
    update: {
      totalKarma: { increment: karmaChange },
      ...(isComment
        ? {
            commentKarma: { increment: karmaChange },
            ...(isNewItem ? { commentCount: { increment: 1 } } : {})
          }
        : {
            postKarma: { increment: karmaChange },
            ...(isNewItem ? { postCount: { increment: 1 } } : {})
          }
      )
    },
    create: {
      roundId: round.id,
      username,
      totalKarma: karmaChange,
      postKarma: isComment ? 0 : karmaChange,
      commentKarma: isComment ? karmaChange : 0,
      postCount: isComment ? 0 : 1,
      commentCount: isComment ? 1 : 0
    }
  });
}

/**
 * Record a new post/comment and track karma
 * Call this after successfully creating a post/comment record
 */
export async function recordKarmaContribution(
  username: string,
  score: number,
  isComment: boolean,
  _contentId: string
): Promise<void> {
  // We want to track score changes over time
  // For simplicity, we just use the current score
  // Pass true for isNewItem since this is called for new contributions
  await updateKarmaForUser(username, score, isComment, true);
}

/**
 * Batch update karma from existing posts/comments
 * This is useful for initial seeding or catch-up
 */
export async function recalculateRoundKarma(roundNumber: number): Promise<void> {
  const { startDate, endDate } = getRoundDates(roundNumber);
  
  console.log(`Recalculating karma for round ${roundNumber} (${startDate.toISOString()} - ${endDate.toISOString()})`);

  // Delete existing entries for this round
  await prisma.karmaEntry.deleteMany({
    where: { roundId: roundNumber }
  });

  // Aggregate post karma
  const postKarma = await prisma.redditPost.groupBy({
    by: ['author'],
    where: {
      createdUtc: { gte: startDate, lt: endDate },
      author: { notIn: ['[deleted]', '[removed]', 'AutoModerator'] }
    },
    _sum: { score: true },
    _count: { id: true }
  });

  // Aggregate comment karma
  const commentKarma = await prisma.redditComment.groupBy({
    by: ['author'],
    where: {
      createdUtc: { gte: startDate, lt: endDate },
      author: { notIn: ['[deleted]', '[removed]', 'AutoModerator'] }
    },
    _sum: { score: true },
    _count: { id: true }
  });

  // Merge results
  const karmaMap = new Map<string, { postKarma: number; commentKarma: number; postCount: number; commentCount: number }>();

  for (const p of postKarma) {
    karmaMap.set(p.author, {
      postKarma: p._sum.score || 0,
      commentKarma: 0,
      postCount: p._count.id,
      commentCount: 0
    });
  }

  for (const c of commentKarma) {
    const existing = karmaMap.get(c.author) || { postKarma: 0, commentKarma: 0, postCount: 0, commentCount: 0 };
    karmaMap.set(c.author, {
      ...existing,
      commentKarma: c._sum.score || 0,
      commentCount: c._count.id
    });
  }

  // Create round if not exists
  const { startDate: roundStart, endDate: roundEnd } = getRoundDates(roundNumber);
  await prisma.karmaRound.upsert({
    where: { id: roundNumber },
    update: {},
    create: {
      id: roundNumber,
      startDate: roundStart,
      endDate: roundEnd,
      isActive: roundNumber === getRoundForDate(new Date())
    }
  });

  // Insert all entries
  const entries = Array.from(karmaMap.entries()).map(([username, data]) => ({
    roundId: roundNumber,
    username,
    postKarma: data.postKarma,
    commentKarma: data.commentKarma,
    totalKarma: data.postKarma + data.commentKarma,
    postCount: data.postCount,
    commentCount: data.commentCount
  }));

  if (entries.length > 0) {
    await prisma.karmaEntry.createMany({ data: entries });
    console.log(`Created ${entries.length} karma entries for round ${roundNumber}`);
  } else {
    console.log(`No karma entries found for round ${roundNumber}`);
  }
}

/**
 * Get leaderboard for a round
 */
export async function getLeaderboard(roundNumber: number, limit = 100): Promise<{
  username: string;
  postKarma: number;
  commentKarma: number;
  totalKarma: number;
  postCount: number;
  commentCount: number;
  rank: number;
}[]> {
  const entries = await prisma.karmaEntry.findMany({
    where: { roundId: roundNumber },
    orderBy: { totalKarma: 'desc' },
    take: limit
  });

  return entries.map((e, i) => ({
    username: e.username,
    postKarma: e.postKarma,
    commentKarma: e.commentKarma,
    totalKarma: e.totalKarma,
    postCount: e.postCount,
    commentCount: e.commentCount,
    rank: i + 1
  }));
}
