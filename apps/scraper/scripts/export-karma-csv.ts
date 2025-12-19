#!/usr/bin/env node
/**
 * Export karma leaderboard to CSV for a specific round
 * Usage: pnpm tsx scripts/export-karma-csv.ts [round] [output-file]
 * 
 * If no round is specified, uses the current round.
 * If no output file is specified, uses karma-round-{N}.csv
 */
import { prisma } from '@rcryptocurrency/database';
import { getRoundForDate, getRoundDates, getLeaderboard } from '../src/karma';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const roundArg = args[0];
  const outputArg = args[1];
  
  const targetRound = roundArg ? parseInt(roundArg) : getRoundForDate(new Date());
  
  if (isNaN(targetRound)) {
    console.error('Invalid round number:', roundArg);
    process.exit(1);
  }

  const { startDate, endDate } = getRoundDates(targetRound);
  const outputFile = outputArg || `karma-round-${targetRound}.csv`;
  
  console.log(`\n📊 Exporting karma for Round ${targetRound}`);
  console.log(`   Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  // Get all entries (no limit)
  const entries = await prisma.karmaEntry.findMany({
    where: { roundId: targetRound },
    orderBy: { totalKarma: 'desc' }
  });
  
  if (entries.length === 0) {
    console.log('⚠️  No karma entries found for this round.');
    await prisma.$disconnect();
    return;
  }

  // Build CSV
  const headers = ['rank', 'username', 'post_karma', 'comment_karma', 'total_karma', 'post_count', 'comment_count'];
  const rows = entries.map((entry, i) => [
    i + 1,
    entry.username,
    entry.postKarma,
    entry.commentKarma,
    entry.totalKarma,
    entry.postCount,
    entry.commentCount
  ]);

  const csvContent = [
    `# Round ${targetRound} Karma Leaderboard`,
    `# Period: ${startDate.toISOString()} to ${endDate.toISOString()}`,
    `# Exported: ${new Date().toISOString()}`,
    `# Total participants: ${entries.length}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Write to file
  const outputPath = path.resolve(outputFile);
  fs.writeFileSync(outputPath, csvContent);
  
  console.log(`\n✅ Exported ${entries.length} entries to: ${outputPath}`);
  console.log(`\n🏆 Top 5:`);
  for (let i = 0; i < Math.min(5, entries.length); i++) {
    const e = entries[i];
    console.log(`   ${i + 1}. u/${e.username} - ${e.totalKarma.toLocaleString()} karma`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
