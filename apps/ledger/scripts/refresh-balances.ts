import { createPublicClient, http, fallback, parseAbiItem } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import { prisma } from '@rcryptocurrency/database';
import * as dotenv from 'dotenv';
import * as path from 'path';

// PM2 sets cwd to apps/ledger, so go up 2 levels to reach project root
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const RPC_URL_NOVA = process.env.RPC_URL_NOVA?.trim();
const RPC_URL_ONE = process.env.RPC_URL_ONE?.trim();
const RPC_URL_ETH = process.env.RPC_URL_ETH?.trim();

if (!RPC_URL_NOVA) console.warn("WARNING: RPC_URL_NOVA not set. QuickNode will be skipped.");
else console.log(`Using Nova RPC: ${RPC_URL_NOVA.replace(/([a-zA-Z0-9]{10})[a-zA-Z0-9]+/, '$1...')}`);

if (!RPC_URL_ONE) console.warn("WARNING: RPC_URL_ONE not set. QuickNode will be skipped.");
if (!RPC_URL_ETH) console.warn("WARNING: RPC_URL_ETH not set. QuickNode will be skipped.");

// Define Arbitrum Nova manually
const arbitrumNova = {
  id: 42170,
  name: 'Arbitrum Nova',
  network: 'arbitrum-nova',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://nova.arbitrum.io/rpc'] },
    public: { http: ['https://nova.arbitrum.io/rpc'] },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1746963,
    },
  },
} as const;

const novaClient = createPublicClient({
  chain: arbitrumNova,
  transport: fallback([
    http(RPC_URL_NOVA, { timeout: 60_000 }), // QuickNode
    http(process.env.ALCHEMY_URL_NOVA, { timeout: 60_000 }), // Alchemy
    http("https://nova.arbitrum.io/rpc", { timeout: 60_000 }) // Public
  ])
});

const oneClient = createPublicClient({
  chain: arbitrum,
  transport: fallback([
    http(RPC_URL_ONE, { timeout: 60_000 }), // QuickNode
    http(process.env.ALCHEMY_URL_ONE, { timeout: 60_000 }), // Alchemy
    http(`https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`, { timeout: 60_000 }), // Infura
    http("https://arb1.arbitrum.io/rpc", { timeout: 60_000 }) // Public
  ])
});

const ethClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http(RPC_URL_ETH, { timeout: 60_000 }), // QuickNode
    http(process.env.ALCHEMY_URL_ETH, { timeout: 60_000 }), // Alchemy
    http(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`, { timeout: 60_000 }), // Infura
    http("https://eth.llamarpc.com", { timeout: 60_000 })
  ])
});

const BALANCE_ABI = [parseAbiItem('function balanceOf(address) view returns (uint256)')];
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

async function getBalance(client: any, contract: string, address: string): Promise<number> {
  try {
    const balance = await client.readContract({
      address: contract as `0x${string}`,
      abi: BALANCE_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });
    return Number(balance) / 1e18;
  } catch (e) {
    console.error(`Error fetching balance for ${address}:`, e);
    return 0;
  }
}

async function getActivity(client: any, contract: string, address: string) {
  // 1. Try QuickNode (Standard RPC) first for recent activity
  // This uses your QuickNode credits as requested.
  try {
    const currentBlock = await withRetry<bigint>(() => client.getBlockNumber());
    // Scan last 50,000 blocks (approx 3.5 hours on Arb). 
    // This is a reasonable range for QuickNode without hitting timeouts.
    const recentStart = currentBlock - 50000n; 
    
    const [logsOut, logsIn] = await Promise.all([
        withRetry<any[]>(() => client.getLogs({
            address: contract as `0x${string}`,
            event: TRANSFER_EVENT,
            args: { from: address as `0x${string}` },
            fromBlock: recentStart,
            toBlock: currentBlock
        })),
        withRetry<any[]>(() => client.getLogs({
            address: contract as `0x${string}`,
            event: TRANSFER_EVENT,
            args: { to: address as `0x${string}` },
            fromBlock: recentStart,
            toBlock: currentBlock
        }))
    ]);

    const allLogs = [...logsOut, ...logsIn].sort((a, b) => {
        const blockDiff = Number(b.blockNumber) - Number(a.blockNumber);
        if (blockDiff !== 0) return blockDiff;
        return Number(b.logIndex) - Number(a.logIndex);
    });

    if (allLogs.length > 0) {
        // Found recent activity via QuickNode!
        const lastLog = allLogs[0];
        const block = await withRetry<any>(() => client.getBlock({ blockNumber: lastLog.blockNumber }));
        return {
            lastTransferAt: new Date(Number(block.timestamp) * 1000),
            hasOutgoing: logsOut.length > 0
        };
    }
  } catch (e) {
      // QuickNode failed (timeout/limit), proceed to fallback
  }

  // 2. If no recent activity found on QuickNode (or it failed), 
  // use Alchemy's Indexer API to find historical "Last Active" (Deep Search)
  // This is necessary because standard RPC (QuickNode) cannot efficiently scan 
  // the entire chain history for "Last Active" without massive timeouts.
  const alchemyUrl = contract === MOON_CONTRACTS.arbitrumNova ? process.env.ALCHEMY_URL_NOVA :
                     contract === MOON_CONTRACTS.arbitrumOne ? process.env.ALCHEMY_URL_ONE :
                     process.env.ALCHEMY_URL_ETH;

  if (alchemyUrl && alchemyUrl.includes('alchemy.com')) {
    try {
      const fetchTransfers = async (params: any) => {
        const response = await fetch(alchemyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method: "alchemy_getAssetTransfers",
            params: [{
              fromBlock: "0x0",
              toBlock: "latest",
              contractAddresses: [contract],
              category: ["erc20"],
              maxCount: "0x1",
              order: "desc",
              ...params
            }]
          })
        });
        
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (data.error) throw new Error(data.error.message);
            return data.result?.transfers?.[0];
        } catch (e) {
            // Silent fail
            return null;
        }
      };

      const [lastOut, lastIn] = await Promise.all([
        fetchTransfers({ fromAddress: address }),
        fetchTransfers({ toAddress: address })
      ]);

      let lastTransferAt: Date | null = null;
      let hasOutgoing = !!lastOut;

      // Find the most recent transfer
      const latest = [lastOut, lastIn].filter(Boolean).sort((a, b) => 
        parseInt(b.blockNum, 16) - parseInt(a.blockNum, 16)
      )[0];

      if (latest) {
        if (latest.metadata?.blockTimestamp) {
            lastTransferAt = new Date(latest.metadata.blockTimestamp);
        } else {
            const block = await withRetry<any>(() => client.getBlock({ blockNumber: BigInt(latest.blockNum) }));
            lastTransferAt = new Date(Number(block.timestamp) * 1000);
        }
      }

      return { lastTransferAt, hasOutgoing };

    } catch (e: any) {
      // Fallthrough
    }
  }

  return { lastTransferAt: null, hasOutgoing: false };
}

const DISTRIBUTORS = [
  '0x0000000000000000000000000000000000000000',
  '0xda9338361d1CFAB5813a92697c3f0c0c42368FB3'
];

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retries === 0) throw e;
    const isRateLimit = e?.message?.includes('429') || e?.message?.includes('Too Many Requests') || e?.message?.includes('timeout');
    if (isRateLimit) {
      console.warn(`RPC Rate limit/Timeout. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(r => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw e;
  }
}

async function updateEarnedMoons(targetAddress?: string) {
  console.log('Calculating Earned Moons from Distributor transfers...');
  const earnedMap = new Map<string, number>(); // Address -> Amount
  let totalTransfersFound = 0;

  const currentBlock = await novaClient.getBlockNumber();
  
  for (const distributor of DISTRIBUTORS) {
    console.log(`Fetching transfers from ${distributor}...`);
    let fromBlock = 0n;
    let chunkSize = 50000n; // Larger chunks for logs if possible, but reduce on error
    
    while (fromBlock < currentBlock) {
      const toBlock = fromBlock + chunkSize > currentBlock ? currentBlock : fromBlock + chunkSize;
      
      try {
        // Don't use global withRetry here because we want to handle limit errors by resizing immediately
        // But we do want to retry on network errors.
        const logs = await withRetry(() => novaClient.getLogs({
          address: MOON_CONTRACTS.arbitrumNova as `0x${string}`,
          event: TRANSFER_EVENT,
          args: { 
            from: distributor as `0x${string}`,
            to: targetAddress ? (targetAddress as `0x${string}`) : undefined
          },
          fromBlock,
          toBlock
        }), 3, 2000);

        for (const log of logs) {
          const to = log.args.to?.toLowerCase();
          const value = Number(log.args.value) / 1e18;
          
          // Skip if sending to the distributor itself (intermediary step)
          if (to === '0xda9338361d1cfab5813a92697c3f0c0c42368fb3') continue;

          if (to && value > 0) {
            const current = earnedMap.get(to) || 0;
            earnedMap.set(to, current + value);
          }
        }
        
        totalTransfersFound += logs.length;
        process.stdout.write(`\rScanned blocks ${fromBlock} - ${toBlock}. Found ${logs.length} transfers (Total: ${totalTransfersFound}).`);
        
        fromBlock = toBlock + 1n;
        
        // If successful and we are below max chunk size, slowly increase it
        if (chunkSize < 10000n) {
            chunkSize = chunkSize + 1000n;
        }
        
        await new Promise(r => setTimeout(r, 100)); // Small delay

      } catch (e: any) {
        const msg = e?.message || "";
        // Check for specific RPC limit error
        if (msg.includes("exceeds limit") || msg.includes("limit exceeded") || msg.includes("timeout")) {
            const newChunk = chunkSize / 2n;
            chunkSize = newChunk < 1n ? 1n : newChunk;
            console.log(`\nReducing chunk size to ${chunkSize} due to limit/timeout at block ${fromBlock}`);
            await new Promise(r => setTimeout(r, 1000));
        } else {
            console.error(`\nError fetching logs for ${distributor} at block ${fromBlock}:`, msg);
            // For other errors, wait a bit and retry same block (loop continues)
            await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
    console.log('\n');
  }

  console.log(`Found ${earnedMap.size} addresses with earned Moons.`);
  
  // Now update users
  const whereClause: any = { username: { not: null } };
  if (targetAddress) {
    whereClause.address = targetAddress;
  }

  const holders = await prisma.holder.findMany({
    where: whereClause,
    select: { address: true, username: true }
  });

  if (holders.length === 0) {
    console.log("No linked Reddit User found for this address. Skipping user update.");
    return;
  }

  const userEarned = new Map<string, number>(); // Username -> Total

  for (const holder of holders) {
    const address = holder.address.toLowerCase();
    const earned = earnedMap.get(address);
    if (earned) {
      const username = holder.username!; 
      const current = userEarned.get(username) || 0;
      userEarned.set(username, current + earned);
    }
  }

  console.log(`Mapped earned Moons to ${userEarned.size} users. Updating DB...`);
  
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
    process.stdout.write(`\rUpdated ${Math.min(i + BATCH, updates.length)}/${updates.length} users.`);
  }
  console.log('\nEarned Moons update complete.');
}

async function main() {
  console.log("--- DEBUG: RUNNING NEW VERSION ---");
  
  // Parse arguments - support both `--address 0x...` and just `0x...`
  const args = process.argv.slice(2);
  const addressArgIndex = args.indexOf('--address');
  let targetAddress: string | null = null;

  if (addressArgIndex !== -1 && args[addressArgIndex + 1]) {
    // Format: --address 0x...
    targetAddress = args[addressArgIndex + 1].toLowerCase();
  } else if (args[0] && args[0].startsWith('0x')) {
    // Format: just 0x... directly
    targetAddress = args[0].toLowerCase();
  }

  if (targetAddress) {
    console.log(`Targeting single address: ${targetAddress}`);
  }

  let holders;

  if (targetAddress) {
    // Single Address Mode
    holders = await prisma.holder.findMany({
      where: { address: targetAddress },
      select: { address: true, label: true, username: true }
    });
    
    if (holders.length === 0) {
      console.log(`Address ${targetAddress} not found in DB. Creating temporary entry for fetch...`);
      holders = [{ address: targetAddress, label: null, username: null }];
    }
  } else {
    // Batch Mode
    const totalHolders = await prisma.holder.count();
    
    // Resume logic: Only fetch addresses that haven't been updated in the last hour
    const RESUME_THRESHOLD_MINUTES = 60;
    const cutoff = new Date(Date.now() - RESUME_THRESHOLD_MINUTES * 60 * 1000);
    
    console.log(`Fetching addresses not updated since ${cutoff.toLocaleTimeString()} (${RESUME_THRESHOLD_MINUTES} min ago)...`);
    
    holders = await prisma.holder.findMany({
      where: {
        lastUpdated: {
          lt: cutoff
        }
      },
      select: { address: true, label: true, username: true }
    });

    console.log(`Found ${holders.length} stale addresses to refresh (out of ${totalHolders} total).`);
  }

  const labeledCount = holders.filter(h => h.label).length;
  if (labeledCount === 0 && holders.length > 0) {
      // Only warn if we actually fetched something but found no labels
      // (It's possible all labeled ones were already processed)
      const allLabeled = await prisma.holder.count({ where: { label: { not: null } } });
      if (allLabeled === 0) {
        console.warn("WARNING: No labeled addresses found in DB. Did you run 'pnpm seed-labels'?");
      }
  }

  // Prioritize: 1. Labeled (Known), 2. Reddit Users (Username), 3. Others
  holders.sort((a, b) => {
    if (a.label && !b.label) return -1;
    if (!a.label && b.label) return 1;
    if (a.username && !b.username) return -1;
    if (!a.username && b.username) return 1;
    return 0;
  });

  console.log(`Found ${holders.length} addresses to refresh.`);

  // Reduced batch size to avoid RPC timeouts
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < holders.length; i += BATCH_SIZE) {
    const batch = holders.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i + 1}-${Math.min(i + BATCH_SIZE, holders.length)} of ${holders.length}...`);

    try {
      const novaContracts = batch.map(h => ({
        address: MOON_CONTRACTS.arbitrumNova as `0x${string}`,
        abi: BALANCE_ABI,
        functionName: 'balanceOf',
        args: [h.address as `0x${string}`]
      }));

      const oneContracts = batch.map(h => ({
        address: MOON_CONTRACTS.arbitrumOne as `0x${string}`,
        abi: BALANCE_ABI,
        functionName: 'balanceOf',
        args: [h.address as `0x${string}`]
      }));

      const ethContracts = batch.map(h => ({
        address: MOON_CONTRACTS.ethereum as `0x${string}`,
        abi: BALANCE_ABI,
        functionName: 'balanceOf',
        args: [h.address as `0x${string}`]
      }));

      // Execute multicalls with retry
      const [novaResults, oneResults, ethResults] = await Promise.all([
        withRetry(() => novaClient.multicall({ contracts: novaContracts })),
        withRetry(() => oneClient.multicall({ contracts: oneContracts })),
        withRetry(() => ethClient.multicall({ contracts: ethContracts }))
      ]);

      // Process results
      for (let index = 0; index < batch.length; index++) {
        const holder = batch[index];
        const novaBal = Number(novaResults[index].result || 0n) / 1e18;
        const oneBal = Number(oneResults[index].result || 0n) / 1e18;
        const ethBal = Number(ethResults[index].result || 0n) / 1e18;
        const total = novaBal + oneBal + ethBal;

        let activity: { lastTransferAt: Date | null, hasOutgoing: boolean } = { lastTransferAt: null, hasOutgoing: false };
        
        try {
          // Check nonce first (cheap)
          const nonce = await withRetry(() => novaClient.getTransactionCount({ address: holder.address as `0x${string}` }));
          activity.hasOutgoing = nonce > 0;

          // Only check logs if they have balance OR have outgoing txs (active user)
          // This skips log scanning for inactive empty addresses (spam/dust)
          if (total > 0 || activity.hasOutgoing) {
             // Add a small delay before getLogs
             await new Promise(r => setTimeout(r, 50)); 
             const lastActive = await getActivity(novaClient, MOON_CONTRACTS.arbitrumNova, holder.address);
             if (lastActive) {
                 activity.lastTransferAt = lastActive.lastTransferAt;
                 // If we found logs, we can confirm outgoing status from logs too
                 if (lastActive.hasOutgoing) activity.hasOutgoing = true;
             }
          }
        } catch (err) {
          console.warn(`Failed to get activity for ${holder.address}`, err);
        }

        await prisma.holder.upsert({
          where: { address: holder.address },
          update: {
            balanceNova: novaBal,
            balanceOne: oneBal,
            balanceEth: ethBal,
            totalBalance: total,
            lastTransferAt: activity.lastTransferAt || undefined,
            hasOutgoing: activity.hasOutgoing ? true : undefined
          },
          create: {
            address: holder.address,
            balanceNova: novaBal,
            balanceOne: oneBal,
            balanceEth: ethBal,
            totalBalance: total,
            lastTransferAt: activity.lastTransferAt || undefined,
            hasOutgoing: activity.hasOutgoing ? true : false,
            username: holder.username,
            label: holder.label
          }
        });
      }

    } catch (e) {
      console.error(`Error processing batch ${i}:`, e);
      // Wait longer on batch error
      await new Promise(r => setTimeout(r, 5000));
    }
    
    // Rate limit between batches
    await new Promise(r => setTimeout(r, 500));
  }

  if (!targetAddress) {
    // NOTE: Earned moons calculation is now a separate script (calc-earned-moons.ts)
    // Run it separately: pnpm --filter @rcryptocurrency/ledger run calc-earned-moons
    console.log("Balances updated.");
    console.log("NOTE: To calculate earned moons, run: pnpm --filter @rcryptocurrency/ledger run calc-earned-moons");
  } else {
    console.log("Balance updated for single address.");
  }

  console.log("Done!");
}

main();
