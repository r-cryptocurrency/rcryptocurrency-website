import { prisma } from '@rcryptocurrency/database';

async function main() {
  const users = await prisma.redditUser.findMany({
    take: 5,
    orderBy: { earnedMoons: 'desc' },
  });

  console.log('Top 5 Users by Earned Moons (Estimate):');
  for (const user of users) {
    console.log(`${user.username}: ${user.earnedMoons}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
