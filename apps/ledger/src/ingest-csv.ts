import fs from 'fs';
import path from 'path';
import { prisma } from '@rcryptocurrency/database';

// Use project root CSV path (works on both local and server)
const CSV_PATH = path.resolve(__dirname, '../../../MoonDistributions.csv');
const BATCH_SIZE = 1000;

async function ingest() {
  console.log('=== MOON CSV INGESTION ===');
  console.log(`CSV Path: ${CSV_PATH}`);
  
  if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ CSV file not found at', CSV_PATH);
    console.log('Expected location: Project root (same folder as package.json)');
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');
  const header = lines[0].split(',');
  
  console.log(`📋 Header: ${header.join(', ')}`);
  console.log(`📊 Total lines: ${lines.length - 1}`);

  // CSV columns: username, blockchain_address, contributor_type, karma, round, signature
  const usernameIdx = 0;
  const addressIdx = 1;

  // Maps for deduplication
  // username (lowercase) -> display name
  const users = new Map<string, string>();
  // address (lowercase) -> username (display)
  const holders = new Map<string, string>();

  let usersWithoutAddress = 0;
  let linesWithoutUsername = 0;

  // Parse CSV
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    const usernameRaw = parts[usernameIdx]?.trim();
    const addressRaw = parts[addressIdx]?.trim();

    if (!usernameRaw) {
      linesWithoutUsername++;
      continue;
    }

    // Store username (use display case from first occurrence)
    const usernameLower = usernameRaw.toLowerCase();
    if (!users.has(usernameLower)) {
      users.set(usernameLower, usernameRaw);
    }

    // Only create holder record if address exists and is valid
    if (addressRaw && addressRaw.startsWith('0x') && addressRaw.length === 42) {
      const addressLower = addressRaw.toLowerCase();
      // Map address to username (first occurrence wins)
      if (!holders.has(addressLower)) {
        holders.set(addressLower, usernameRaw);
      }
    } else {
      usersWithoutAddress++;
    }
    
    if (i % 100000 === 0) {
      console.log(`Parsed ${i}/${lines.length - 1} lines...`);
    }
  }

  console.log(`\n✅ Parsed:`);
  console.log(`   - ${users.size} unique Reddit users`);
  console.log(`   - ${holders.size} unique addresses`);
  console.log(`   - ${usersWithoutAddress} entries had no address (users still created)`);
  if (linesWithoutUsername > 0) {
    console.log(`   - ${linesWithoutUsername} lines skipped (no username)`);
  }

  // Insert Users (earnedMoons will be set to 0, calculated later from blockchain)
  console.log('\n📥 Inserting Reddit Users...');
  const userArray = Array.from(users.values());
  
  for (let i = 0; i < userArray.length; i += BATCH_SIZE) {
    const batch = userArray.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(
      batch.map(username => prisma.redditUser.upsert({
        where: { username },
        update: {}, // Don't overwrite anything if exists
        create: { username, earnedMoons: 0 }
      }))
    );
    
    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, userArray.length)}/${userArray.length}`);
  }
  console.log('\n');

  // Insert Holders (only those with addresses)
  console.log('📥 Inserting Holders...');
  const holderArray = Array.from(holders.entries());
  
  for (let i = 0; i < holderArray.length; i += BATCH_SIZE) {
    const batch = holderArray.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(
      batch.map(([address, username]) => prisma.holder.upsert({
        where: { address },
        update: { username },
        create: { address, username }
      }))
    );
    
    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, holderArray.length)}/${holderArray.length}`);
  }
  
  console.log('\n\n✅ CSV Ingestion Complete!');
  console.log('\n⚠️  NEXT STEP: Run calc-earned-moons to populate earnedMoons from blockchain');
}

ingest()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
