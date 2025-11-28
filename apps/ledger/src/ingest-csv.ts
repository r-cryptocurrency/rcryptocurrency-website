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
  // Map: lowercase_username -> { display: string }
  const users = new Map<string, { display: string }>(); 
  // Map: address -> lowercase_username
  const holders = new Map<string, string>(); 

  console.log('Parsing and mapping addresses to usernames...');
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');
    if (parts.length < 2) continue;

    const usernameRaw = parts[0].trim();
    const usernameLower = usernameRaw.toLowerCase();
    const address = parts[1].trim().toLowerCase();
    
    if (usernameRaw && address) {
      // Just store the mapping, ignore karma/amounts for now as requested
      if (!users.has(usernameLower)) {
        users.set(usernameLower, { display: usernameRaw });
      }
      holders.set(address, usernameLower);
    }
  }

  console.log(`Unique Users: ${users.size}`);
  console.log(`Unique Holders: ${holders.size}`);

  // Batch Insert Users
  console.log('Starting User ingestion...');
  const userArray = Array.from(users.values());
  for (let i = 0; i < userArray.length; i += BATCH_SIZE) {
    const batch = userArray.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(
      batch.map(u => prisma.redditUser.upsert({
        where: { username: u.display },
        update: {}, // Don't update anything if exists, just ensure it exists
        create: { 
          username: u.display,
          earnedMoons: 0 // Initialize to 0, will be calculated from on-chain data later
        }
      }))
    );
    console.log(`Processed users ${Math.min(i + BATCH_SIZE, userArray.length)}/${userArray.length}`);
  }

  // Batch Insert Holders
  console.log('Starting Holder ingestion...');
  const holderArray = Array.from(holders.entries()).map(([address, lowerUser]) => {
    const userInfo = users.get(lowerUser);
    return {
      address,
      username: userInfo ? userInfo.display : null,
    };
  }).filter(h => h.username !== null);

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
