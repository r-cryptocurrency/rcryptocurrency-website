import { prisma } from '@rcryptocurrency/database';

async function main() {
  console.log('Starting duplicate cleanup...');

  // 1. Fetch all addresses (lightweight)
  const allHolders = await prisma.holder.findMany({
    select: { address: true }
  });

  console.log(`Scanned ${allHolders.length} holders.`);

  // 2. Group by lowercase address
  const groups = new Map<string, string[]>();
  
  for (const h of allHolders) {
    const lower = h.address.toLowerCase();
    if (!groups.has(lower)) {
      groups.set(lower, []);
    }
    groups.get(lower)?.push(h.address);
  }

  // 3. Find duplicates
  const duplicates = Array.from(groups.entries()).filter(([_, addresses]) => addresses.length > 1);
  
  console.log(`Found ${duplicates.length} sets of duplicates.`);

  for (const [lowerAddr, addresses] of duplicates) {
    console.log(`Processing duplicate set for ${lowerAddr}: ${addresses.join(', ')}`);

    // Fetch full records
    const records = await prisma.holder.findMany({
      where: { address: { in: addresses } }
    });

    // Determine winner
    // Priority:
    // 1. Has username
    // 2. Is lowercase
    // 3. Highest balance (if different)
    
    records.sort((a, b) => {
      // Has username?
      if (a.username && !b.username) return -1; // a comes first
      if (!a.username && b.username) return 1;

      // Is lowercase?
      const aIsLower = a.address === a.address.toLowerCase();
      const bIsLower = b.address === b.address.toLowerCase();
      if (aIsLower && !bIsLower) return -1;
      if (!aIsLower && bIsLower) return 1;

      return 0;
    });

    const winner = records[0];
    const losers = records.slice(1);

    console.log(`  Winner: ${winner.address} (User: ${winner.username})`);
    
    for (const loser of losers) {
      console.log(`  Deleting loser: ${loser.address} (User: ${loser.username})`);
      await prisma.holder.delete({
        where: { address: loser.address }
      });
    }
  }

  console.log('Cleanup complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
