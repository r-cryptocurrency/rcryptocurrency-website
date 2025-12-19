#!/usr/bin/env node
/**
 * Recalculate karma for a specific round from existing posts/comments
 * Usage: pnpm tsx scripts/recalc-karma.ts [round]
 * 
 * If no round is specified, uses the current round.
 */
import { prisma } from '@rcryptocurrency/database';
import { recalculateRoundKarma, getRoundForDate, getRoundDates, getLeaderboard } from '../src/karma';

async function main() {
  const args = process.argv.slice(2);
  const roundArg = args[0];
  
  const targetRound = roundArg ? parseInt(roundArg) : getRoundForDate(new Date());
  
  if (isNaN(targetRound)) {
    console.error('Invalid round number:', roundArg);
    process.exit(1);
  }

  const { startDate, endDate } = getRoundDates(targetRound);
  console.log(`\n🔄 Recalculating karma for Round ${targetRound}`);
  console.log(`   Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  await recalculateRoundKarma(targetRound);
  
  // Show top 10
  const leaderboard = await getLeaderboard(targetRound, 10);
  
  if (leaderboard.length > 0) {
    console.log('\n🏆 Top 10 Leaderboard:');
    console.log('-'.repeat(60));
    for (const entry of leaderboard) {
      console.log(`${entry.rank.toString().padStart(2)}. ${entry.username.padEnd(25)} ${entry.totalKarma.toString().padStart(8)} karma (${entry.postKarma} post, ${entry.commentKarma} comment)`);
    }
  } else {
    console.log('\n⚠️  No karma entries found for this round.');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
