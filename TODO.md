# 🌙 r/CryptoCurrency Site - Complete System Overhaul Plan

## Executive Summary

This document provides a complete, step-by-step plan to fix all issues with the data pipeline and ensure the ledger, oracle, and scraper work together efficiently.

**Last Updated:** December 18, 2025  
**Current Moon Round:** 51 (Dec 9, 2025 - Jan 5, 2026)

---

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           PM2 Processes                              │
├────────────┬────────────┬────────────┬────────────┬────────────────┤
│    web     │   ledger   │  monitor   │   oracle   │    scraper     │
│  (Next.js) │ (Indexer)  │(Burns/Swap)│ (CG/Reddit)│ (Reddit Posts) │
├────────────┴────────────┴────────────┴────────────┴────────────────┤
│                        PostgreSQL Database                          │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐     │
│  │ Holder  │RedditUser│  Burn   │  Swap   │RedditPost│Submission    │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 PHASE 1: DATABASE RESET & CLEAN INGESTION (Day 1)

### Step 1.1: Reset Database
```bash
cd /home/jw/src/rcryptocurrency-site
pnpm prisma migrate reset --force
```

### Step 1.2: Fix CSV Ingestion Script

**File:** `apps/ledger/src/ingest-csv.ts`

**CSV Format:**
```
username,blockchain_address,contributor_type,karma,round,signature
u/slywalkers,0x0079dc9976CDD7a8C7d5A0686D0ac11cdF5F5C29,contributor,6492,1,0x734fe...
u/mishax1,,contributor,3132,1,
```

**Key Points:**
- Column 0: `username` (starts with `u/`)
- Column 1: `blockchain_address` (may be EMPTY for some users!)
- Column 2: `contributor_type` 
- Column 3: `karma` (NOT earned moons - just karma score)
- Column 4: `round`
- Column 5: `signature`

**⚠️ IMPORTANT:** We CANNOT calculate earned moons from the CSV!
- CSV only has karma, not moons
- Moon distribution depends on: total karma that round, karma multipliers, moon ratio, etc.
- **Earned moons MUST be calculated from blockchain transfers**

**Changes Required:**
1. Fix CSV path to use project root
2. Handle users with NO address (skip them for Holder table, but still create RedditUser)
3. Do NOT try to parse earned moons from CSV

```typescript
// NEW ingest-csv.ts

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

  // Parse CSV
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    const usernameRaw = parts[usernameIdx]?.trim();
    const addressRaw = parts[addressIdx]?.trim();

    if (!usernameRaw) continue;

    // Store username (use display case from first occurrence)
    const usernameLower = usernameRaw.toLowerCase();
    if (!users.has(usernameLower)) {
      users.set(usernameLower, usernameRaw);
    }

    // Only create holder record if address exists
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
  console.log('\n⚠️  NEXT STEP: Run earned-moons calculation from blockchain to populate earnedMoons field');
}

ingest()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
```

### Step 1.3: Run CSV Ingestion
```bash
cd /home/jw/src/rcryptocurrency-site
pnpm --filter @rcryptocurrency/ledger run ingest-csv
```

---

## 🟠 PHASE 2: CALCULATE EARNED MOONS FROM BLOCKCHAIN (Day 1-2)

### Understanding Earned Moons

**⚠️ We CANNOT calculate earned moons from the CSV!** The CSV only contains karma scores.

Earned moons are distributed from two addresses:
1. **Genesis Address:** `0x0000000000000000000000000000000000000000`
2. **TheMoonDistributor:** `0xda9338361d1CFAB5813a92697c3f0c0c42368FB3`

The logic in `refresh-balances.ts` already handles this correctly:
- Scans Transfer events FROM these addresses
- Skips transfers TO the distributor (intermediary step for mod distributions)
- Sums all received amounts per address

### Step 2.1: Create Dedicated Earned Moons Script

**File:** `apps/ledger/scripts/calc-earned-moons.ts`

Extract the `updateEarnedMoons()` function into its own script so it can be run independently:

```typescript
// apps/ledger/scripts/calc-earned-moons.ts

import { createPublicClient, http, fallback, parseAbiItem } from 'viem';
import { prisma } from '@rcryptocurrency/database';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const arbitrumNova = {
  id: 42170,
  name: 'Arbitrum Nova',
  network: 'arbitrum-nova',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://nova.arbitrum.io/rpc'] },
    public: { http: ['https://nova.arbitrum.io/rpc'] },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
      blockCreated: 1746963,
    },
  },
} as const;

const client = createPublicClient({
  chain: arbitrumNova,
  transport: fallback([
    http(process.env.QUICKNODE_URL_NOVA, { timeout: 60_000 }),
    http(process.env.ALCHEMY_URL_NOVA, { timeout: 60_000 }),
    http("https://nova.arbitrum.io/rpc", { timeout: 60_000 })
  ])
});

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

// Addresses that distribute earned moons
const DISTRIBUTORS = [
  '0x0000000000000000000000000000000000000000', // Genesis
  '0xda9338361d1cfab5813a92697c3f0c0c42368fb3'  // TheMoonDistributor (lowercase!)
];

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retries === 0) throw e;
    const isRetryable = e?.message?.includes('429') || 
                        e?.message?.includes('timeout') ||
                        e?.message?.includes('Too Many Requests');
    if (isRetryable) {
      console.warn(`Rate limit/timeout. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(r => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw e;
  }
}

async function calculateEarnedMoons() {
  console.log('=== CALCULATING EARNED MOONS FROM BLOCKCHAIN ===\n');
  console.log('This scans ALL transfers from genesis and distributor addresses.');
  console.log('This will take a LONG time (hours) - use QuickNode credits!\n');

  const earnedMap = new Map<string, number>(); // address -> earned amount
  let totalTransfers = 0;

  const currentBlock = await client.getBlockNumber();
  console.log(`Current block: ${currentBlock}\n`);

  for (const distributor of DISTRIBUTORS) {
    console.log(`📡 Scanning transfers FROM ${distributor}...`);
    
    let fromBlock = 0n;
    let chunkSize = 50000n;
    
    while (fromBlock < currentBlock) {
      const toBlock = fromBlock + chunkSize > currentBlock ? currentBlock : fromBlock + chunkSize;
      
      try {
        const logs = await withRetry(() => client.getLogs({
          address: MOON_CONTRACTS.arbitrumNova as `0x${string}`,
          event: TRANSFER_EVENT,
          args: { from: distributor as `0x${string}` },
          fromBlock,
          toBlock
        }));

        for (const log of logs) {
          const to = log.args.to?.toLowerCase();
          const value = Number(log.args.value) / 1e18;
          
          // Skip transfers TO the distributor itself (intermediate step)
          if (to === '0xda9338361d1cfab5813a92697c3f0c0c42368fb3') continue;
          
          if (to && value > 0) {
            const current = earnedMap.get(to) || 0;
            earnedMap.set(to, current + value);
          }
        }
        
        totalTransfers += logs.length;
        const progress = ((Number(fromBlock) / Number(currentBlock)) * 100).toFixed(1);
        process.stdout.write(`\r   [${progress}%] Scanned blocks ${fromBlock}-${toBlock}, found ${logs.length} transfers (Total: ${totalTransfers})`);
        
        fromBlock = toBlock + 1n;
        
        // Adaptive chunk sizing
        if (chunkSize < 100000n) chunkSize += 5000n;
        
        await new Promise(r => setTimeout(r, 100));

      } catch (e: any) {
        const msg = e?.message || "";
        if (msg.includes("exceeds limit") || msg.includes("timeout")) {
          chunkSize = chunkSize / 2n;
          if (chunkSize < 1000n) chunkSize = 1000n;
          console.log(`\n   ⚠️ Reducing chunk size to ${chunkSize}`);
          await new Promise(r => setTimeout(r, 2000));
        } else {
          console.error(`\n   ❌ Error at block ${fromBlock}:`, msg);
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
    console.log('\n');
  }

  console.log(`\n✅ Found ${earnedMap.size} addresses with earned moons`);
  console.log(`   Total transfers processed: ${totalTransfers}`);

  // Update database
  console.log('\n📥 Updating RedditUser.earnedMoons...');
  
  // Get all holders with usernames
  const holders = await prisma.holder.findMany({
    where: { username: { not: null } },
    select: { address: true, username: true }
  });

  // Map addresses to usernames and aggregate earned per user
  const userEarned = new Map<string, number>();
  
  for (const holder of holders) {
    const earned = earnedMap.get(holder.address.toLowerCase());
    if (earned && holder.username) {
      const current = userEarned.get(holder.username) || 0;
      userEarned.set(holder.username, current + earned);
    }
  }

  console.log(`   Mapped to ${userEarned.size} Reddit users`);

  // Batch update
  const updates = Array.from(userEarned.entries());
  const BATCH = 500;
  
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    await prisma.$transaction(
      batch.map(([username, amount]) => 
        prisma.redditUser.update({
          where: { username },
          data: { earnedMoons: amount }
        })
      )
    );
    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH, updates.length)}/${updates.length}`);
  }

  console.log('\n\n✅ Earned moons calculation complete!');
}

calculateEarnedMoons()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Step 2.2: Run Earned Moons Calculation
```bash
# This will take HOURS - run in tmux/screen!
cd /home/jw/src/rcryptocurrency-site
pnpm --filter @rcryptocurrency/ledger run calc-earned-moons
```

### Step 2.3: Fix Backfill Burns Script

**File:** `apps/ledger/scripts/backfill-burns.ts`

**Changes Required:**
1. Resume from last known burn block (not block 0)
2. Add Ethereum mainnet scanning
3. Use upsert to prevent duplicates

```typescript
// Key additions to backfill-burns.ts:

async function getLastBurnBlock(chain: string): Promise<bigint> {
  const lastBurn = await prisma.burn.findFirst({
    where: { chain },
    orderBy: { blockNumber: 'desc' },
    select: { blockNumber: true }
  });
  return lastBurn ? BigInt(lastBurn.blockNumber) : 0n;
}

async function scanChain(
  chainName: string,
  chainObj: any,
  rpcUrl: string,
  tokenAddress: `0x${string}`
) {
  const startBlock = await getLastBurnBlock(chainName);
  console.log(`[${chainName}] Resuming from block ${startBlock}`);
  
  // ... rest of scan logic with upsert instead of create
}

// Add Ethereum mainnet:
async function main() {
  await scanChain('Arbitrum Nova', arbitrumNova, process.env.QUICKNODE_URL_NOVA!, MOON_CONTRACTS.arbitrumNova as `0x${string}`);
  await scanChain('Arbitrum One', arbitrum, process.env.QUICKNODE_URL_ONE!, MOON_CONTRACTS.arbitrumOne as `0x${string}`);
  await scanChain('Ethereum', mainnet, process.env.QUICKNODE_URL_ETH!, MOON_CONTRACTS.ethereum as `0x${string}`);
}
```

### Step 2.4: Create Backfill Swaps Script (NEW)

**File:** `apps/ledger/scripts/backfill-swaps.ts`

This script should scan historical swap events from all DEX pools and populate the Swap table.

```typescript
// apps/ledger/scripts/backfill-swaps.ts

import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { arbitrum } from 'viem/chains';
import { prisma } from '@rcryptocurrency/database';
import { LIQUIDITY_POOLS } from '@rcryptocurrency/chain-data';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const arbitrumNova = {
  id: 42170,
  name: 'Arbitrum Nova',
  // ... chain config
};

const SWAP_V2_EVENT = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');
const SWAP_V3_EVENT = parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)');

const POOLS = [
  { chain: 'Arbitrum Nova', address: LIQUIDITY_POOLS.nova.sushiSwapV2, type: 'V2', name: 'SushiSwap V2' },
  { chain: 'Arbitrum One', address: LIQUIDITY_POOLS.one.camelotV3, type: 'V3', name: 'Camelot V3' },
  { chain: 'Arbitrum One', address: LIQUIDITY_POOLS.one.uniswapV3, type: 'V3', name: 'Uniswap V3' },
];

async function getLastSwapBlock(dex: string): Promise<bigint> {
  const lastSwap = await prisma.swap.findFirst({
    where: { dex: { contains: dex } },
    orderBy: { blockNumber: 'desc' },
    select: { blockNumber: true }
  });
  return lastSwap ? BigInt(lastSwap.blockNumber) : 0n;
}

// ... rest of implementation follows same pattern as backfill-burns
```

### Step 2.5: Fix Refresh Balances Script

**File:** `apps/ledger/scripts/refresh-balances.ts`

**Key Changes:**
1. REMOVE the call to `updateEarnedMoons()` at the end (it's now a separate script)
2. Increase multicall batch size to 200
3. Parallelize activity lookups

```typescript
// At the end of main(), REMOVE:
// await updateEarnedMoons();  // <-- DELETE THIS LINE

// Change batch size:
const BATCH_SIZE = 200; // Was 20

// Parallelize activity lookups:
const activities = await Promise.all(
  batch.map(h => getActivity(novaClient, MOON_CONTRACTS.arbitrumNova, h.address)
    .catch(() => ({ lastTransferAt: null, hasOutgoing: false }))
  )
);
```

---

## 🟡 PHASE 3: FIX SCRAPER & LEADERBOARD (Day 2)

### Step 3.1: Fix Leaderboard Date Range

**File:** `apps/web/app/scraper/page.tsx`

The current leaderboard has hardcoded Round 50 dates. Fix it to dynamically calculate the current moon round:

```typescript
// Add helper function at top of file:
function getCurrentMoonRound(): { roundNumber: number; startDate: Date; endDate: Date } {
  // Round 51 started Dec 9, 2025
  const ROUND_51_START = new Date('2025-12-09T00:00:00Z');
  const DAYS_PER_ROUND = 28;
  
  const now = new Date();
  const daysSinceRound51 = Math.floor((now.getTime() - ROUND_51_START.getTime()) / (1000 * 60 * 60 * 24));
  const roundsSinceR51 = Math.floor(daysSinceRound51 / DAYS_PER_ROUND);
  
  const currentRound = 51 + roundsSinceR51;
  const roundStartDate = new Date(ROUND_51_START.getTime() + (roundsSinceR51 * DAYS_PER_ROUND * 24 * 60 * 60 * 1000));
  const roundEndDate = new Date(roundStartDate.getTime() + (DAYS_PER_ROUND * 24 * 60 * 60 * 1000) - 1);
  
  return { roundNumber: currentRound, startDate: roundStartDate, endDate: roundEndDate };
}

// Replace hardcoded dates in the component:
export default async function ScraperPage(...) {
  const { roundNumber, startDate: roundStart, endDate: roundEnd } = getCurrentMoonRound();
  
  // Use roundStart and roundEnd in queries...
  
  // Update UI:
  <h2>Karma Leaderboard (Round {roundNumber})</h2>
  <h3>Top Earners ({roundStart.toLocaleDateString()} - {roundEnd.toLocaleDateString()})</h3>
}
```

### Step 3.2: Verify Scraper is Running

```bash
# Check PM2 status
pm2 status

# View scraper logs
pm2 logs scraper --lines 100

# If not running:
pm2 start ecosystem.config.js --only scraper
```

---

## 🟢 PHASE 4: OPTIMIZE MONITOR SERVICE (Day 2-3)

### Step 4.1: Verify Monitor Configuration

**File:** `apps/ledger/src/monitor/config.ts`

Ensure all pools are configured correctly and notification threshold is set:

```typescript
export const NOTIFICATION_THRESHOLD = parseFloat(process.env.MOON_NOTIFICATION_THRESHOLD || '1000');
```

### Step 4.2: Verify Address Resolution

**File:** `apps/ledger/src/monitor/db.ts`

The `resolveAddress` function should:
1. Check Holder table for username first
2. Fall back to ENS name
3. Fall back to truncated address

✅ Already implemented correctly.

### Step 4.3: Verify Telegram Integration

```bash
# Test Telegram bot manually
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHANNEL_ID}" \
  -d "text=🧪 Test message from Moon Monitor" \
  -d "parse_mode=Markdown"
```

---

## 📊 PHASE 5: DATABASE OPTIMIZATIONS (Day 3)

### Step 5.1: Add Missing Indexes

**File:** `packages/database/prisma/schema.prisma`

```prisma
model Holder {
  address        String      @id
  balanceNova    Float       @default(0)
  balanceOne     Float       @default(0)
  balanceEth     Float       @default(0)
  totalBalance   Float       @default(0)
  lastUpdated    DateTime    @updatedAt
  lastTransferAt DateTime?
  hasOutgoing    Boolean     @default(false)
  label          String?
  username       String?
  user           RedditUser? @relation(fields: [username], references: [username])

  @@index([totalBalance])
  @@index([lastTransferAt])
  @@index([username])
}

model Burn {
  id          Int      @id @default(autoincrement())
  txHash      String   @unique
  blockNumber BigInt
  timestamp   DateTime @default(now())
  amount      Float
  chain       String
  sender      String

  @@index([timestamp])
  @@index([chain])
  @@index([sender])
}

model Swap {
  id          Int      @id @default(autoincrement())
  txHash      String   @unique
  blockNumber BigInt
  timestamp   DateTime @default(now())
  chain       String
  dex         String
  amountIn    Float
  amountOut   Float
  tokenIn     String
  tokenOut    String
  usdValue    Float?
  maker       String

  @@index([timestamp])
  @@index([maker])
  @@index([dex])
}

model RedditPost {
  // ... existing fields ...
  @@index([createdUtc])
  @@index([author])
}

model RedditComment {
  // ... existing fields ...
  @@index([createdUtc])
  @@index([author])
}
```

### Step 5.2: Apply Schema Changes

```bash
cd /home/jw/src/rcryptocurrency-site
pnpm prisma migrate dev --name add-indexes
```

---

## 📋 PHASE 6: VERIFICATION & TESTING (Day 3-4)

### Step 6.1: Create Health Check Script

**File:** `apps/ledger/scripts/health-check.ts` (NEW)

```typescript
import { prisma } from '@rcryptocurrency/database';

async function healthCheck() {
  console.log('=== SYSTEM HEALTH CHECK ===\n');
  
  // Database Stats
  const holders = await prisma.holder.count();
  const holdersWithUsername = await prisma.holder.count({ where: { username: { not: null } } });
  const users = await prisma.redditUser.count();
  const usersWithEarned = await prisma.redditUser.count({ where: { earnedMoons: { gt: 0 } } });
  const burns = await prisma.burn.count();
  const swaps = await prisma.swap.count();
  const posts = await prisma.redditPost.count();
  const comments = await prisma.redditComment.count();
  
  console.log('📊 Database Stats:');
  console.log(`   Holders: ${holders.toLocaleString()} (${holdersWithUsername.toLocaleString()} with Reddit username)`);
  console.log(`   Reddit Users: ${users.toLocaleString()} (${usersWithEarned.toLocaleString()} with earned moons > 0)`);
  console.log(`   Burns: ${burns.toLocaleString()}`);
  console.log(`   Swaps: ${swaps.toLocaleString()}`);
  console.log(`   Reddit Posts: ${posts.toLocaleString()}`);
  console.log(`   Reddit Comments: ${comments.toLocaleString()}`);
  
  // Latest Activity
  const lastBurn = await prisma.burn.findFirst({ orderBy: { timestamp: 'desc' } });
  const lastSwap = await prisma.swap.findFirst({ orderBy: { timestamp: 'desc' } });
  const lastPost = await prisma.redditPost.findFirst({ orderBy: { createdUtc: 'desc' } });
  const lastMarket = await prisma.marketStat.findFirst({ orderBy: { timestamp: 'desc' } });
  
  console.log('\n⏰ Latest Activity:');
  console.log(`   Last Burn: ${lastBurn?.timestamp || 'Never'}`);
  console.log(`   Last Swap: ${lastSwap?.timestamp || 'Never'}`);
  console.log(`   Last Post Scraped: ${lastPost?.createdUtc || 'Never'}`);
  console.log(`   Last Market Update: ${lastMarket?.timestamp || 'Never'}`);
  
  // Current Moon Round
  const ROUND_51_START = new Date('2025-12-09T00:00:00Z');
  const now = new Date();
  const daysSinceR51 = Math.floor((now.getTime() - ROUND_51_START.getTime()) / (1000 * 60 * 60 * 24));
  const currentRound = 51 + Math.floor(daysSinceR51 / 28);
  const daysIntoRound = daysSinceR51 % 28;
  
  console.log('\n🌙 Moon Round Info:');
  console.log(`   Current Round: ${currentRound}`);
  console.log(`   Days into Round: ${daysIntoRound}/28`);
  
  // Top Earners
  const topEarners = await prisma.redditUser.findMany({
    orderBy: { earnedMoons: 'desc' },
    take: 5,
    select: { username: true, earnedMoons: true }
  });
  
  console.log('\n💰 Top Earned Moons (All Time):');
  topEarners.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.username}: ${u.earnedMoons.toLocaleString()} moons`);
  });
  
  // Leaderboard Preview (Current Round)
  const roundStart = new Date('2025-12-09T00:00:00Z');
  const postScores = await prisma.redditPost.groupBy({
    by: ['author'],
    _sum: { score: true },
    where: { createdUtc: { gte: roundStart } },
    orderBy: { _sum: { score: 'desc' } },
    take: 5
  });
  
  console.log('\n🏆 Karma Leaderboard (Round 51):');
  postScores.forEach((u, i) => {
    console.log(`   ${i + 1}. u/${u.author}: ${u._sum.score} karma`);
  });
  
  console.log('\n✅ Health check complete!');
}

healthCheck()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Step 6.2: Test Each Service Individually

```bash
# 1. Test CSV Ingestion
pnpm --filter @rcryptocurrency/ledger run ingest-csv

# 2. Test Earned Moons Calculation (THIS TAKES HOURS!)
pnpm --filter @rcryptocurrency/ledger run calc-earned-moons

# 3. Test Burn Backfill
pnpm --filter @rcryptocurrency/ledger run backfill-burns

# 4. Test Balance Refresh (single address)
pnpm --filter @rcryptocurrency/ledger run refresh-balances -- --address 0x589af3e07607f94ba822c23b744c6cb5a188e5e5

# 5. Test Monitor (runs continuously)
pnpm --filter @rcryptocurrency/ledger run dev:monitor

# 6. Test Scraper (single run)
pnpm --filter @rcryptocurrency/scraper run dev

# 7. Test Oracle (single run)
pnpm --filter @rcryptocurrency/oracle run dev

# 8. Health Check
pnpm --filter @rcryptocurrency/ledger run health-check
```

---

## 🚀 PHASE 7: PRODUCTION DEPLOYMENT (Day 4)

### Step 7.1: Build All Apps

```bash
cd /home/jw/src/rcryptocurrency-site
pnpm build
```

### Step 7.2: Deploy with PM2

```bash
# Stop all processes
pm2 stop all

# Start fresh
pm2 start ecosystem.config.js

# Save PM2 state
pm2 save
```

### Step 7.3: Verify All Services Running

```bash
pm2 status

# Expected output:
# ┌─────────────┬────┬──────┬───────┬────────┐
# │ Name        │ ID │ Mode │ Status│ CPU    │
# ├─────────────┼────┼──────┼───────┼────────┤
# │ web         │ 0  │ clust│ online│ 0%     │
# │ web         │ 1  │ clust│ online│ 0%     │
# │ ledger      │ 2  │ fork │ online│ 0%     │
# │ monitor     │ 3  │ fork │ online│ 0%     │
# │ oracle      │ 4  │ fork │ online│ 0%     │
# │ scraper     │ 5  │ fork │ online│ 0%     │
# └─────────────┴────┴──────┴───────┴────────┘
```

---

## 📅 EXECUTION TIMELINE

| Day | Phase | Tasks |
|-----|-------|-------|
| 1 AM | Phase 1 | Reset DB, Fix & run CSV ingestion |
| 1 PM | Phase 2 | Start earned-moons calculation (runs overnight) |
| 2 AM | Phase 2 | Run backfill-burns, backfill-swaps |
| 2 PM | Phase 3 | Fix scraper leaderboard dates, verify scraper working |
| 3 AM | Phase 4 | Verify monitor, test Telegram notifications |
| 3 PM | Phase 5 | Add database indexes, run migrations |
| 4 AM | Phase 6 | Create health check, test all services |
| 4 PM | Phase 7 | Full production deployment |

---

## 🔄 ONGOING MAINTENANCE

### Daily Checks
- Run `pnpm --filter @rcryptocurrency/ledger run health-check`
- Verify `pm2 status` shows all services online
- Check Telegram for burn/swap notifications

### Weekly Tasks
- Run `refresh-balances` to update all holder balances
- Verify leaderboard is showing correct round

### Monthly Tasks
- After new CSV release: Re-run CSV ingestion
- After CSV ingestion: Re-run `calc-earned-moons` (only if you want to update earned moons)
- Review error logs: `pm2 logs --err`

---

## 📝 QUICK REFERENCE: NPM SCRIPTS

Add these to `apps/ledger/package.json`:

```json
{
  "scripts": {
    "ingest-csv": "ts-node src/ingest-csv.ts",
    "calc-earned-moons": "ts-node scripts/calc-earned-moons.ts",
    "backfill-burns": "ts-node scripts/backfill-burns.ts",
    "backfill-swaps": "ts-node scripts/backfill-swaps.ts",
    "refresh-balances": "ts-node scripts/refresh-balances.ts",
    "health-check": "ts-node scripts/health-check.ts",
    "dev:monitor": "ts-node scripts/monitor-moons.ts",
    "seed-labels": "ts-node scripts/seed-labels.ts"
  }
}
```

---

## ✅ COMPLETION CHECKLIST

- [ ] Phase 1: DB reset, CSV ingestion working (users + holders populated)
- [ ] Phase 2: Earned moons calculated from blockchain (check users have earnedMoons > 0)
- [ ] Phase 2: Burns backfilled from all chains
- [ ] Phase 2: Swaps backfilled from all DEXes
- [ ] Phase 3: Leaderboard showing Round 51+ with dynamic dates
- [ ] Phase 4: Monitor sending Telegram notifications
- [ ] Phase 5: Database indexes added
- [ ] Phase 6: Health check passes
- [ ] Phase 7: All PM2 processes running stable

---

## 🐛 KNOWN ISSUES TO WATCH

1. **QuickNode Rate Limits** - If you hit limits, increase delay between RPC calls
2. **CSV Users Without Addresses** - These create RedditUser but NOT Holder records (correct behavior)
3. **ENS Resolution Failures** - Non-critical, fallback to truncated address
4. **Scraper 429 Errors** - Reddit may rate-limit; built-in retry handles this
5. **Earned Moons Calculation Time** - Takes HOURS, run in tmux/screen

---

## 📚 KEY DATA FLOW

```
CSV File (username, address, karma)
    │
    ▼
┌─────────────────────────────────────────┐
│ ingest-csv.ts                           │
│ - Creates RedditUser (earnedMoons = 0)  │
│ - Creates Holder (links address→user)  │
│ - SKIPS users without addresses         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ calc-earned-moons.ts                    │
│ - Scans transfers FROM:                 │
│   • 0x0000...0000 (genesis)             │
│   • 0xda93...FB3 (TheMoonDistributor)   │
│ - Updates RedditUser.earnedMoons        │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ refresh-balances.ts                     │
│ - Updates Holder balances (multicall)   │
│ - Updates lastTransferAt               │
└─────────────────────────────────────────┘
```