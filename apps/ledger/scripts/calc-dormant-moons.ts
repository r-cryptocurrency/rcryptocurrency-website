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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
