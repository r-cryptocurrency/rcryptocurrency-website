import { prisma } from '@rcryptocurrency/database';

const args = process.argv.slice(2);
const address = args[0];
const label = args[1];

if (!address || !label) {
  console.error('Usage: pnpm label <address> <label>');
  console.error('Example: pnpm label 0x123... "Kraken Hot Wallet"');
  process.exit(1);
}

async function main() {
  console.log(`Labeling ${address} as "${label}"...`);
  
  // We use upsert to ensure the holder exists even if we haven't indexed them yet
  await prisma.holder.upsert({
    where: { address },
    update: { label },
    create: { 
      address, 
      label,
      balanceNova: 0,
      balanceOne: 0,
      balanceEth: 0,
      totalBalance: 0
    }
  });
  
  console.log('✅ Successfully updated label.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
