import fs from 'fs';
import path from 'path';
import { prisma } from '@rcryptocurrency/database';

const CSV_PATH = path.join(__dirname, '../seeds/known-addresses.csv');

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header

  console.log(`Found ${lines.length} lines. Processing...`);

  for (const line of lines) {
    if (!line.trim()) continue;
    const [address, label] = line.split(',').map(s => s.trim());

    if (address && label) {
      console.log(`Labeling ${address} as "${label}"...`);

      // Check for existing record (case-insensitive)
      const existing = await prisma.holder.findFirst({
        where: {
          address: {
            equals: address,
            mode: 'insensitive'
          }
        }
      });

      if (existing) {
        console.log(`Found existing holder: ${existing.address}. Updating label...`);
        await prisma.holder.update({
          where: { address: existing.address },
          data: { label }
        });

        // Cleanup: If we previously created a lowercase duplicate with 0 balance, remove it
        if (existing.address !== address.toLowerCase()) {
          const duplicate = await prisma.holder.findUnique({
            where: { address: address.toLowerCase() }
          });
          if (duplicate && duplicate.totalBalance === 0) {
            console.log(`Removing duplicate 0-balance holder: ${duplicate.address}`);
            await prisma.holder.delete({ where: { address: duplicate.address } });
          }
        }

      } else {
        console.log(`Creating new holder: ${address.toLowerCase()}...`);
        await prisma.holder.create({
          data: { 
            address: address.toLowerCase(), 
            label,
            balanceNova: 0,
            balanceOne: 0,
            balanceEth: 0,
            totalBalance: 0
          }
        });
      }
    }
  }

  console.log('Seeding complete!');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
