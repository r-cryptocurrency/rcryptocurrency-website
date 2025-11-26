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
      await prisma.holder.upsert({
        where: { address: address.toLowerCase() },
        update: { 
          label,
        },
        create: { 
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

  console.log('Seeding complete!');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
