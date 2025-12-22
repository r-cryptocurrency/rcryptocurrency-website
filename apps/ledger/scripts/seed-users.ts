import fs from 'fs';
import path from 'path';
import { prisma } from '@rcryptocurrency/database';

/**
 * Seed manual address-to-username associations from known-users.csv
 * 
 * This is like seed-labels.ts but for linking addresses to Reddit usernames.
 * Use this when you need to associate addresses with users that aren't
 * in the official MoonDistributions.csv (e.g., new wallets, transfers, etc.)
 * 
 * Run: pnpm seed-users
 */

const CSV_PATH = path.join(__dirname, '../seeds/known-users.csv');

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header

  console.log(`Found ${lines.length} lines. Processing...\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    let [address, username] = trimmed.split(',').map(s => s.trim());

    if (!address || !username) {
      console.warn(`Skipping invalid line: ${line}`);
      skipped++;
      continue;
    }

    // Normalize address to lowercase
    address = address.toLowerCase();

    // Remove u/ prefix if present
    if (username.startsWith('u/')) {
      username = username.slice(2);
    }

    // Validate address format
    if (!address.startsWith('0x') || address.length !== 42) {
      console.warn(`Skipping invalid address: ${address}`);
      skipped++;
      continue;
    }

    console.log(`Linking ${address} → ${username}...`);

    // 1. Ensure the RedditUser exists
    await prisma.redditUser.upsert({
      where: { username },
      update: {},
      create: { username, earnedMoons: 0 }
    });

    // 2. Check for existing record (case-insensitive for address)
    const existing = await prisma.holder.findFirst({
      where: {
        address: {
          equals: address,
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      console.log(`  → Found existing holder: ${existing.address}. Updating username...`);
      await prisma.holder.update({
        where: { address: existing.address },
        data: { username }
      });
      updated++;
    } else {
      console.log(`  → Creating new holder...`);
      await prisma.holder.create({
        data: { 
          address,
          username,
          balanceNova: 0,
          balanceOne: 0,
          balanceEth: 0,
          totalBalance: 0
        }
      });
      created++;
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`\n💡 Run "pnpm refresh-balances" to fetch balances for these addresses.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
