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
    // QuickNode first (fast, high limits)
    ...(process.env.QUICKNODE_URL_NOVA ? [http(process.env.QUICKNODE_URL_NOVA, { timeout: 60_000 })] : []),
    // Free public RPC as fallback (no rate limits on block range, just slower)
    http("https://nova.arbitrum.io/rpc", { timeout: 60_000 }),
  ])
});

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

// State file for resuming
const STATE_FILE = path.resolve(__dirname, 'earned-moons-state.json');

// Addresses that distribute earned moons
const DISTRIBUTORS = [
  '0x0000000000000000000000000000000000000000', // Genesis
  '0xda9338361d1cfab5813a92697c3f0c0c42368fb3'  // TheMoonDistributor
];

// MOON on Nova was deployed around block 1, but we start from 1 to avoid issues with genesis block
const START_BLOCK = 1n;

interface DistributorState {
  lastBlock: string;
}

interface State {
  earnedMap: Record<string, number>;
  distributors: Record<string, DistributorState>;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 2000, context = ''): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retries === 0) throw e;
    const msg = e?.message || '';
    const isRetryable = msg.includes('429') || 
                        msg.includes('timeout') ||
                        msg.includes('Too Many Requests') ||
                        msg.includes('limit') ||
                        msg.includes('range') ||
                        msg.includes('Missing or invalid');
    
    if (isRetryable) {
      console.warn('RPC Error (' + context + '): ' + msg.slice(0, 100) + '...');
      console.warn('Retrying in ' + delay + 'ms... (' + retries + ' left)');
      await new Promise(r => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay * 2, context);
    }
    // Log full error for non-retryable errors
    console.error('Non-retryable error (' + context + '):', msg);
    throw e;
  }
}

function loadState(): State {
  if (fs.existsSync(STATE_FILE)) {
    console.log('Loading progress from ' + STATE_FILE + '...');
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
  console.log('  - QuickNode: ' + (process.env.QUICKNODE_URL_NOVA ? 'Yes (primary)' : 'No'));
  console.log('  - Free Public RPC: Yes (fallback)');
  console.log('');

  const state = loadState();
  const earnedMap = new Map<string, number>(Object.entries(state.earnedMap));
  let totalTransfers = 0;

  const currentBlock = await client.getBlockNumber();
  console.log('Current block: ' + currentBlock + '\n');

  for (const distributor of DISTRIBUTORS) {
    console.log('Scanning transfers FROM ' + distributor + '...');
    
    let fromBlock = state.distributors[distributor] 
      ? BigInt(state.distributors[distributor].lastBlock) + 1n 
      : START_BLOCK;
      
    let chunkSize = 2000n;
    
    while (fromBlock < currentBlock) {
      const toBlock = fromBlock + chunkSize > currentBlock ? currentBlock : fromBlock + chunkSize;
      
      try {
        const logs = await withRetry(() => client.getLogs({
          address: MOON_CONTRACTS.arbitrumNova as `0x${string}`,
          event: TRANSFER_EVENT,
          args: { from: distributor as `0x${string}` },
          fromBlock,
          toBlock
        }), 3, 2000, 'getLogs ' + fromBlock + '-' + toBlock);

        for (const log of logs) {
          const to = log.args.to?.toLowerCase();
          const value = Number(log.args.value) / 1e18;
          
          if (to === '0xda9338361d1cfab5813a92697c3f0c0c42368fb3') continue;

          if (to && value > 0) {
            const current = earnedMap.get(to) || 0;
            earnedMap.set(to, current + value);
            totalTransfers++;
          }
        }

        state.distributors[distributor] = { lastBlock: toBlock.toString() };
        state.earnedMap = Object.fromEntries(earnedMap);
        saveState(state);

        process.stdout.write('\r   Block ' + toBlock + '/' + currentBlock + ' | Found ' + logs.length + ' transfers | Total: ' + totalTransfers);
        
        fromBlock = toBlock + 1n;

      } catch (e: any) {
        console.error('\nError fetching logs: ' + (e.message?.slice(0, 100) || e));
        
        if (chunkSize > 100n) {
          chunkSize = chunkSize / 2n;
          console.log('Reducing chunk size to ' + chunkSize + ' and retrying...');
        } else {
          console.error('Chunk size too small, aborting.');
          throw e;
        }
      }
    }
    console.log('\n   Distributor scan complete.\n');
  }

  console.log('\nFound ' + earnedMap.size + ' addresses with earned moons');
  console.log('Total transfers processed: ' + totalTransfers);

  console.log('\nUpdating RedditUser.earnedMoons...');
  
  const holders = await prisma.holder.findMany({
    where: { username: { not: null } },
    select: { address: true, username: true }
  });

  console.log('Found ' + holders.length + ' holders with Reddit usernames');

  const userEarned = new Map<string, number>();
  
  for (const holder of holders) {
    const earned = earnedMap.get(holder.address.toLowerCase());
    if (earned && holder.username) {
      const current = userEarned.get(holder.username) || 0;
      userEarned.set(holder.username, current + earned);
    }
  }

  console.log('Mapped to ' + userEarned.size + ' Reddit users');

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
    process.stdout.write('\r   Progress: ' + Math.min(i + BATCH, updates.length) + '/' + updates.length);
  }

  console.log('\n\nTop 10 Earned Moons:');
  const topEarners = Array.from(userEarned.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  topEarners.forEach(([username, amount], i) => {
    console.log('   ' + (i + 1) + '. ' + username + ': ' + amount.toLocaleString() + ' moons');
  });

  console.log('\nEarned moons calculation complete!');
}

calculateEarnedMoons()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
