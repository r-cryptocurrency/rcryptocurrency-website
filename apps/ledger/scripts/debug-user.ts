
import { prisma } from '@rcryptocurrency/database';

async function debug() {
  console.log('Checking jwinterm...');
  
  // Check Holders with username containing 'jwinterm'
  const holders = await prisma.holder.findMany({
    where: { username: { contains: 'jwinterm' } },
    include: { user: true }
  });

  console.log(`Found ${holders.length} holders for jwinterm:`);
  for (const h of holders) {
    console.log(`- Address: ${h.address}`);
    console.log(`- Username: ${h.username}`);
    console.log(`- User Relation: ${h.user ? 'Found' : 'Missing'}`);
    if (h.user) {
      console.log(`  - User Username: ${h.user.username}`);
      console.log(`  - Earned Moons: ${h.user.earnedMoons}`);
    }
  }

  // Check RedditUser directly
  const users = await prisma.redditUser.findMany({
    where: { username: { contains: 'jwinterm' } }
  });
  
  console.log(`\nFound ${users.length} RedditUsers for jwinterm:`);
  for (const u of users) {
    console.log(`- Username: ${u.username}, Earned: ${u.earnedMoons}`);
  }
}

debug()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
