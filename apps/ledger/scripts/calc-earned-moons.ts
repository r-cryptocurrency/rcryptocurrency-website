import { createPublicClient, http, fallback, parseAbiItem } from 'viem';
import { prisma } from '@rcryptocurrency/database';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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

// State file for resuming
const STATE_FILE = path.resolve(__dirname, 'earned-moons-state.json');

// Addresses that distribute earned moons
// Genesis: Initial distribution
// TheMoonDistributor: Used for mod distributions
const DISTRIBUTORS = [
  '0x0000000000000000000000000000000000000000', // Genesis
  '0xda9338361d1cfab5813a92697c3f0c0c42368fb3'  // TheMoonDistributor (lowercase!)
];

interface DistributorState {
  lastBlock: string; // Store as string for JSON serialization
}

interface State {
  earnedMap: Record<string, number>;
  distributors: Record<string, DistributorState>;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retries === 0) throw e;
    const isRetryable = e?.message?.includes('429') || 
                        e?.message?.includes('timeout') ||
                        e?.message?.includes('Too Many Requests') ||
                        e?.message?.includes('limit') ||
                        e?.message?.includes('range'); // Handle block range errors by retrying (caller should handle resizing)
    
    if (isRetryable) {
      console.warn(`⚠️  RPC Error: ${e.message?.slice(0, 100)}...`);
      console.warn(`   Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(r => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw e;
  }
}

function loadState(): State {
  if (fs.existsSync(STATE_FILE)) {
    console.log(`📂 Loading progress from ${STATE_FILE}...`);
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  }
  return { earnedMap: {}, distributors: {} };
}

function saveState(state: State) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function calculateEarnedMoons() {
  console.log('=== CALCULATING EARNED MOONS FROM BLOCKCHAIN ===\n');
  console.log('This scans ALL transfers from genesis and distributor addresses.');
  console.log('This will take a LONG time (hours) - use QuickNode credits!\n');
  console.log('RPCs configured:');
  console.log(`  - QuickNode: ${process.env.QUICKNODE_URL_NOVA ? 'Yes' : 'No'}`);
  console.log(`  - Alchemy: ${process.env.ALCHEMY_URL_NOVA ? 'Yes' : 'No'}`);
  console.log('');

  const state = loadState();
  const earnedMap = new Map<string, number>(Object.entries(state.earnedMap));
  let totalTransfers = 0;

  const currentBlock = await client.getBlockNumber();
  console.log(`Current block: ${currentBlock}\n`);

  for (const distributor of DISTRIBUTORS) {
    console.log(`📡 Scanning transfers FROM ${distributor}...`);
    
    // Resume from last block or start at 0
    let fromBlock = state.distributors[distributor] 
      ? BigInt(state.distributors[distributor].lastBlock) + 1n 
      : 0n;
      
    let chunkSize = 2000n; // Start with a safer chunk size
    
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
          
          // Skip transfers TO the distributor itself (intermediate step for mod distributions)
          if (to === '0xda9338361d1cfab5813a92697c3f0c0c42368fb3') continue;

          if (to && value > 0) {
            const current = earnedMap.get(to) || 0;
            earnedMap.set(to, current + value);
            totalTransfers++;
          }
        }

        // Update state
        state.distributors[distributor] = { lastBlock: toBlock.toString() };
        state.earnedMap = Object.fromEntries(earnedMap);
        saveState(state);

        process.stdout.write(`\r   Block ${toBlock}/${currentBlock} | Found ${logs.length} transfers | Total: ${totalTransfers}`);
        
        fromBlock = toBlock + 1n;

      } catch (e: any) {
        console.error(`\n❌ Error fetching logs: ${e.message?.slice(0, 100)}`);
        
        // Dynamic chunk sizing
        if (chunkSize > 100n) {
          chunkSize = chunkSize / 2n;
          console.log(`   📉 Reducing chunk size to ${chunkSize} and retrying...`);
        } else {
          console.error('   ❌ Chunk size too small, aborting.');
          throw e;
        }
      }
    }
    console.log('\n   ✅ Distributor scan complete.\n');
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

  console.log(`   Found ${holders.length} holders with Reddit usernames`);

  // Map addresses to usernames and aggregate earned per user
  // (Some users may have multiple addresses)
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

  // Print top earners
  console.log('\n\n🏆 Top 10 Earned Moons:');
  const topEarners = Array.from(userEarned.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  topEarners.forEach(([username, amount], i) => {
    console.log(`   ${i + 1}. ${username}: ${amount.toLocaleString()} moons`);
  });

  console.log('\n✅ Earned moons calculation complete!');
}

calculateEarnedMoons()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
