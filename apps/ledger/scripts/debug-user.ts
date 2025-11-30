
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

  // Check specific address variants
  const addressLower = '0x41a4922487216655a1b1d10f70ee6b0bf7e75219';
  const addressMixed = '0x41a4922487216655A1B1d10F70EE6B0bf7e75219';

  const holdersByAddress = await prisma.holder.findMany({
    where: {
      address: {
        in: [addressLower, addressMixed]
      }
    }
  });

  console.log(`\nFound ${holdersByAddress.length} holders by address lookup:`);
  for (const h of holdersByAddress) {
    console.log(`- Address: ${h.address} (Length: ${h.address.length})`);
    console.log(`  Balance: ${h.totalBalance}`);
    console.log(`  Username: ${h.username}`);
  }
}

debug()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
