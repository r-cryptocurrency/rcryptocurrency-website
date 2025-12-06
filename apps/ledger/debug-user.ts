const { prisma } = require('@rcryptocurrency/database');

async function main() {
  const username = 'u/CryptoMaximalist';
  const address = '0x113cc667fe5d0ac97c6e7212369c60102a0ced2a';

  console.log(`Checking for user: ${username}`);
  const user = await prisma.redditUser.findUnique({
    where: { username: 'CryptoMaximalist' } // Try without u/ prefix too just in case
  });
  console.log('User (CryptoMaximalist):', user);

  const userWithPrefix = await prisma.redditUser.findUnique({
    where: { username: 'u/CryptoMaximalist' }
  });
  console.log('User (u/CryptoMaximalist):', userWithPrefix);

  console.log(`Checking for address: ${address}`);
  const holder = await prisma.holder.findUnique({
    where: { address: address }
  });
  console.log('Holder:', holder);

  // Check if there are any holders with this username
  const holders = await prisma.holder.findMany({
    where: { 
      OR: [
        { username: 'CryptoMaximalist' },
        { username: 'u/CryptoMaximalist' }
      ]
    }
  });
  console.log('Holders linked to username:', holders);
}

main().catch(console.error);
