import { prisma } from '@rcryptocurrency/database';

async function main() {
  console.log('Calculating dormant Moons held by Redditors...');

  // Calculate sum of balances for users with a username (Redditors) 
  // who have hasOutgoing = false
  const result = await prisma.holder.aggregate({
    _sum: {
      totalBalance: true,
    },
    where: {
      username: {
        not: null,
      },
      hasOutgoing: false,
    },
  });

  const total = result._sum.totalBalance || 0;
  
  // Also get the count of such users
  const count = await prisma.holder.count({
    where: {
      username: {
        not: null,
      },
      hasOutgoing: false,
    },
  });

  console.log('------------------------------------------------');
  console.log(`Total Moons held by Redditors who never moved them: ${total.toLocaleString()}`);
  console.log(`Number of such accounts: ${count.toLocaleString()}`);
  console.log('------------------------------------------------');

  // Top 10 dormant holders
  const topDormant = await prisma.holder.findMany({
    where: {
      username: {
        not: null,
      },
      hasOutgoing: false,
    },
    orderBy: {
      totalBalance: 'desc',
    },
    take: 10,
    select: {
      username: true,
      totalBalance: true,
      lastTransferAt: true,
    },
  });

  console.log('\nTop 10 Dormant Redditor Wallets:');
  console.log('------------------------------------------------');
  console.log('Username'.padEnd(25) + 'Balance'.padEnd(20) + 'Last Received');
  console.log('------------------------------------------------');
  
  topDormant.forEach(holder => {
    const username = holder.username || 'Unknown';
    const balance = holder.totalBalance.toLocaleString();
    const lastReceived = holder.lastTransferAt ? holder.lastTransferAt.toISOString().split('T')[0] : 'N/A';
    
    console.log(`${username.padEnd(25)}${balance.padEnd(20)}${lastReceived}`);
  });
  console.log('------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
