import { prisma } from '@rcryptocurrency/database';

// Calculate the current moon round dynamically
function getCurrentMoonRound(): { roundNumber: number; startDate: Date; endDate: Date; daysIntoRound: number } {
  const ROUND_51_START = new Date('2025-12-09T00:00:00Z');
  const DAYS_PER_ROUND = 28;
  
  const now = new Date();
  const daysSinceR51 = Math.floor((now.getTime() - ROUND_51_START.getTime()) / (1000 * 60 * 60 * 24));
  const roundsSinceR51 = Math.max(0, Math.floor(daysSinceR51 / DAYS_PER_ROUND));
  
  const currentRound = 51 + roundsSinceR51;
  const roundStartDate = new Date(ROUND_51_START.getTime() + (roundsSinceR51 * DAYS_PER_ROUND * 24 * 60 * 60 * 1000));
  const roundEndDate = new Date(roundStartDate.getTime() + (DAYS_PER_ROUND * 24 * 60 * 60 * 1000) - 1);
  const daysIntoRound = daysSinceR51 % DAYS_PER_ROUND;
  
  return { roundNumber: currentRound, startDate: roundStartDate, endDate: roundEndDate, daysIntoRound };
}

async function healthCheck() {
  console.log('=== SYSTEM HEALTH CHECK ===\n');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  // Database Stats
  const holders = await prisma.holder.count();
  const holdersWithUsername = await prisma.holder.count({ where: { username: { not: null } } });
  const users = await prisma.redditUser.count();
  const usersWithEarned = await prisma.redditUser.count({ where: { earnedMoons: { gt: 0 } } });
  const burns = await prisma.burn.count();
  const swaps = await prisma.swap.count();
  const posts = await prisma.redditPost.count();
  const comments = await prisma.redditComment.count();
  
  console.log('📊 Database Stats:');
  console.log(`   Holders: ${holders.toLocaleString()} (${holdersWithUsername.toLocaleString()} with Reddit username)`);
  console.log(`   Reddit Users: ${users.toLocaleString()} (${usersWithEarned.toLocaleString()} with earned moons > 0)`);
  console.log(`   Burns: ${burns.toLocaleString()}`);
  console.log(`   Swaps: ${swaps.toLocaleString()}`);
  console.log(`   Reddit Posts: ${posts.toLocaleString()}`);
  console.log(`   Reddit Comments: ${comments.toLocaleString()}`);
  
  // Latest Activity
  const lastBurn = await prisma.burn.findFirst({ orderBy: { timestamp: 'desc' } });
  const lastSwap = await prisma.swap.findFirst({ orderBy: { timestamp: 'desc' } });
  const lastPost = await prisma.redditPost.findFirst({ orderBy: { createdUtc: 'desc' } });
  const lastMarket = await prisma.marketStat.findFirst({ orderBy: { timestamp: 'desc' } });
  
  console.log('\n⏰ Latest Activity:');
  console.log(`   Last Burn: ${lastBurn?.timestamp?.toISOString() || 'Never'}`);
  console.log(`   Last Swap: ${lastSwap?.timestamp?.toISOString() || 'Never'}`);
  console.log(`   Last Post Scraped: ${lastPost?.createdUtc?.toISOString() || 'Never'}`);
  console.log(`   Last Market Update: ${lastMarket?.timestamp?.toISOString() || 'Never'}`);
  
  // Current Moon Round
  const { roundNumber, startDate, endDate, daysIntoRound } = getCurrentMoonRound();
  
  console.log('\n🌙 Moon Round Info:');
  console.log(`   Current Round: ${roundNumber}`);
  console.log(`   Round Start: ${startDate.toLocaleDateString()}`);
  console.log(`   Round End: ${endDate.toLocaleDateString()}`);
  console.log(`   Days into Round: ${daysIntoRound}/28`);
  
  // Top Earners (All Time)
  const topEarners = await prisma.redditUser.findMany({
    orderBy: { earnedMoons: 'desc' },
    take: 5,
    select: { username: true, earnedMoons: true }
  });
  
  console.log('\n💰 Top Earned Moons (All Time):');
  if (topEarners.length === 0 || topEarners[0].earnedMoons === 0) {
    console.log('   ⚠️ No earned moons data! Run: pnpm --filter @rcryptocurrency/ledger run calc-earned-moons');
  } else {
    topEarners.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.username}: ${u.earnedMoons.toLocaleString()} moons`);
    });
  }
  
  // Leaderboard Preview (Current Round)
  const postScores = await prisma.redditPost.groupBy({
    by: ['author'],
    _sum: { score: true },
    where: { createdUtc: { gte: startDate } },
    orderBy: { _sum: { score: 'desc' } },
    take: 5
  });
  
  console.log(`\n🏆 Karma Leaderboard (Round ${roundNumber}):`);
  if (postScores.length === 0) {
    console.log('   ⚠️ No posts found for this round! Is the scraper running?');
  } else {
    postScores.forEach((u, i) => {
      console.log(`   ${i + 1}. u/${u.author}: ${(u._sum.score || 0).toLocaleString()} karma`);
    });
  }

  // Top Burns
  const topBurns = await prisma.burn.findMany({
    orderBy: { amount: 'desc' },
    take: 3,
    select: { sender: true, amount: true, chain: true, timestamp: true }
  });

  console.log('\n🔥 Largest Burns:');
  if (topBurns.length === 0) {
    console.log('   ⚠️ No burns found! Run: pnpm --filter @rcryptocurrency/ledger run backfill-burns');
  } else {
    topBurns.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.amount.toLocaleString()} MOON on ${b.chain} (${b.timestamp.toLocaleDateString()})`);
    });
  }

  // Warnings
  console.log('\n⚠️ Warnings:');
  let warnings = 0;
  
  if (usersWithEarned === 0) {
    console.log('   - No users have earned moons calculated');
    warnings++;
  }
  
  if (burns === 0) {
    console.log('   - No burns in database');
    warnings++;
  }
  
  if (swaps === 0) {
    console.log('   - No swaps in database');
    warnings++;
  }
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (lastPost && lastPost.createdUtc < oneDayAgo) {
    console.log('   - Last scraped post is older than 24 hours');
    warnings++;
  }
  
  if (lastMarket && lastMarket.timestamp < oneDayAgo) {
    console.log('   - Last market update is older than 24 hours');
    warnings++;
  }
  
  if (warnings === 0) {
    console.log('   None! Everything looks good.');
  }
  
  console.log('\n✅ Health check complete!');
}

healthCheck()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
