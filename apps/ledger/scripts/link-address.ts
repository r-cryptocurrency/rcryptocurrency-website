import { prisma } from '@rcryptocurrency/database';

/**
 * Link an address to a Reddit username.
 * 
 * This allows you to manually associate addresses with users when
 * the official CSV only has their old/original wallet address.
 * 
 * Usage: 
 *   pnpm link-user <address> <username>
 * 
 * Example:
 *   pnpm link-user 0x113cc667fe5d0ac97c6e7212369c60102a0ced2a CryptoMaximalist
 * 
 * This will:
 *   1. Create the RedditUser if they don't exist
 *   2. Create or update the Holder with the username association
 *   3. Trigger balance refresh for that address
 */

const args = process.argv.slice(2);
const address = args[0]?.toLowerCase();
let username = args[1];

if (!address || !username) {
  console.error('Usage: pnpm link-user <address> <username>');
  console.error('Example: pnpm link-user 0x113cc667fe5d0ac97c6e7212369c60102a0ced2a CryptoMaximalist');
  process.exit(1);
}

// Normalize address
if (!address.startsWith('0x') || address.length !== 42) {
  console.error('❌ Invalid address format. Must be 0x followed by 40 hex characters.');
  process.exit(1);
}

// Remove u/ prefix if present
if (username.startsWith('u/')) {
  username = username.slice(2);
}

async function main() {
  console.log(`\n🔗 Linking address to user...`);
  console.log(`   Address:  ${address}`);
  console.log(`   Username: ${username}\n`);

  // 1. Ensure the RedditUser exists
  await prisma.redditUser.upsert({
    where: { username },
    update: {},
    create: { username, earnedMoons: 0 }
  });
  console.log(`✅ RedditUser "${username}" exists or was created.`);

  // 2. Check if this address is already linked to someone else
  const existingHolder = await prisma.holder.findUnique({
    where: { address }
  });

  if (existingHolder?.username && existingHolder.username !== username) {
    console.warn(`\n⚠️  Warning: This address is currently linked to "${existingHolder.username}".`);
    console.warn(`   Continuing will re-link it to "${username}".`);
    console.warn(`   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // 3. Create or update the Holder with the username
  await prisma.holder.upsert({
    where: { address },
    update: { username },
    create: { 
      address, 
      username,
      balanceNova: 0,
      balanceOne: 0,
      balanceEth: 0,
      totalBalance: 0
    }
  });
  console.log(`✅ Holder linked: ${address} → ${username}`);

  // 4. Check if user has other addresses and display them
  const userAddresses = await prisma.holder.findMany({
    where: { username },
    select: { address: true, totalBalance: true }
  });

  if (userAddresses.length > 1) {
    console.log(`\n📋 All addresses for ${username}:`);
    for (const h of userAddresses) {
      const indicator = h.address === address ? ' ← just linked' : '';
      console.log(`   - ${h.address} (${h.totalBalance.toLocaleString()} MOONs)${indicator}`);
    }
  }

  console.log(`\n✨ Done! Run "pnpm refresh ${address}" to fetch the balance.\n`);
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
