import fs from 'fs';
import { prisma } from '@rcryptocurrency/database';

const CSV_PATH = '/home/jw/Documents/rcryptocurrency/MOONs/MoonDistributions.csv';
const BATCH_SIZE = 5000;

async function ingest() {
  console.log('Reading CSV...');
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV file not found at', CSV_PATH);
    return;
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  console.log(`Found ${lines.length} lines. Processing...`);

  // Deduplicate users and holders in memory first to prepare for batch insert
  const users = new Map<string, number>(); // username -> totalEarned
  const holders = new Map<string, string>(); // address -> username

  console.log('Parsing and deduplicating in memory...');
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');
    if (parts.length < 2) continue;

    const username = parts[0].trim();
    const address = parts[1].trim().toLowerCase();
    const parsedAmount = parts[2] ? parseFloat(parts[2]) : 0;
    const amount = isNaN(parsedAmount) ? 0 : parsedAmount;

    if (username && address) {
      const current = users.get(username) || 0;
      users.set(username, current + amount);
      holders.set(address, username);
    }
  }

  console.log(`Unique Users: ${users.size}`);
  console.log(`Unique Holders: ${holders.size}`);

  // Batch Insert Users
  console.log('Starting User ingestion...');
  const userArray = Array.from(users.entries());
  for (let i = 0; i < userArray.length; i += BATCH_SIZE) {
    const batch = userArray.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(
      batch.map(([u, earned]) => prisma.redditUser.upsert({
        where: { username: u },
        update: { earnedMoons: earned },
        create: { 
          username: u,
          earnedMoons: earned
        }
      }))
    );
    console.log(`Processed users ${Math.min(i + BATCH_SIZE, userArray.length)}/${userArray.length}`);
  }

  // Batch Insert Holders
  console.log('Starting Holder ingestion...');
  const holderArray = Array.from(holders.entries()).map(([address, username]) => ({
    address,
    username,
  }));

  for (let i = 0; i < holderArray.length; i += BATCH_SIZE) {
    const batch = holderArray.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(
      batch.map(h => prisma.holder.upsert({
        where: { address: h.address },
        update: { username: h.username },
        create: { 
          address: h.address,
          username: h.username
        }
      }))
    );
    console.log(`Processed holders ${Math.min(i + BATCH_SIZE, holderArray.length)}/${holderArray.length}`);
  }
  
  console.log('Ingestion complete!');
}

ingest()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
