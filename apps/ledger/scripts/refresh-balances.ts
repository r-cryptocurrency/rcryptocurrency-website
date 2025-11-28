import { createPublicClient, http, parseAbiItem } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import { prisma } from '@rcryptocurrency/database';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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
  transport: http(process.env.RPC_URL_NOVA || "https://nova.arbitrum.io/rpc") 
});

const oneClient = createPublicClient({
  chain: arbitrum,
  transport: http(process.env.RPC_URL_ONE || "https://arb1.arbitrum.io/rpc")
});

const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL_ETH || "https://eth.llamarpc.com")
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
  try {
    const currentBlock = await client.getBlockNumber();
    // Scan last 100,000 blocks for activity (approx 1-2 days on Nova)
    const fromBlock = currentBlock - 100000n; 

    const [logsOut, logsIn] = await Promise.all([
      client.getLogs({
        address: contract as `0x${string}`,
        event: TRANSFER_EVENT,
        args: { from: address as `0x${string}` },
        fromBlock,
        toBlock: 'latest'
      }),
      client.getLogs({
        address: contract as `0x${string}`,
        event: TRANSFER_EVENT,
        args: { to: address as `0x${string}` },
        fromBlock,
        toBlock: 'latest'
      })
    ]);

    const allLogs = [...logsOut, ...logsIn].sort((a, b) => {
      const blockDiff = Number(b.blockNumber) - Number(a.blockNumber);
      if (blockDiff !== 0) return blockDiff;
      return Number(b.logIndex) - Number(a.logIndex);
    });

    // Check for burns (transfers to 0x0...dead)
    const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
    const burns = logsIn.filter((log: any) => 
      log.args.to?.toLowerCase() === BURN_ADDRESS.toLowerCase()
    );

    if (burns.length > 0) {
      console.log(`Found ${burns.length} historical burns for ${address}`);
      for (const burn of burns) {
        const txHash = burn.transactionHash;
        const block = await client.getBlock({ blockNumber: burn.blockNumber });
        const timestamp = new Date(Number(block.timestamp) * 1000);
        const amount = Number(burn.args.value) / 1e18;
        const from = burn.args.from;

        // Upsert burn record
        await prisma.burn.upsert({
          where: { txHash },
          update: {},
          create: {
            txHash,
            blockNumber: Number(burn.blockNumber),
            timestamp,
            sender: from || address,
            amount,
            chain: contract === MOON_CONTRACTS.arbitrumNova ? 'arbitrum_nova' : 
                   contract === MOON_CONTRACTS.arbitrumOne ? 'arbitrum_one' : 'ethereum'
          }
        });
      }
    }

    let lastTransferAt: Date | null = null;
    if (allLogs.length > 0) {
      const lastLog = allLogs[0];
      const block = await client.getBlock({ blockNumber: lastLog.blockNumber });
      lastTransferAt = new Date(Number(block.timestamp) * 1000);
    }

    return {
      lastTransferAt,
      hasOutgoing: logsOut.length > 0
    };

  } catch (e) {
    console.error(`Error fetching activity for ${address}:`, e);
    return { lastTransferAt: null, hasOutgoing: false };
  }
}

const DISTRIBUTORS = [
  '0x0000000000000000000000000000000000000000',
  '0xda9338361d1CFAB5813a92697c3f0c0c42368FB3'
];

async function updateEarnedMoons() {
  console.log('Calculating Earned Moons from Distributor transfers...');
  const earnedMap = new Map<string, number>(); // Address -> Amount
  let totalTransfersFound = 0;

  const currentBlock = await novaClient.getBlockNumber();
  
  for (const distributor of DISTRIBUTORS) {
    console.log(`Fetching transfers from ${distributor}...`);
    let fromBlock = 0n;
    let chunkSize = 10000n; // Start with 10k blocks
    
    while (fromBlock < currentBlock) {
      const toBlock = fromBlock + chunkSize > currentBlock ? currentBlock : fromBlock + chunkSize;
      
      try {
        const logs = await novaClient.getLogs({
          address: MOON_CONTRACTS.arbitrumNova as `0x${string}`,
          event: TRANSFER_EVENT,
          args: { from: distributor as `0x${string}` },
          fromBlock,
          toBlock
        });

        for (const log of logs) {
          const to = log.args.to?.toLowerCase();
          const value = Number(log.args.value) / 1e18;
          if (to && value > 0) {
            const current = earnedMap.get(to) || 0;
            earnedMap.set(to, current + value);
          }
        }
        
        totalTransfersFound += logs.length;
        process.stdout.write(`\rScanned blocks ${fromBlock} - ${toBlock}. Found ${logs.length} transfers (Total: ${totalTransfersFound}). (Chunk: ${chunkSize})`);
        
        // If we got a lot of logs, maybe decrease chunk size to be safe, or keep it if it worked.
        // If we got very few logs, we could increase, but let's be safe.
        // Add a small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
        fromBlock = toBlock + 1n;

      } catch (e: any) {
        const errorMsg = e?.message || JSON.stringify(e);
        const isRateLimit = errorMsg.includes('429') || errorMsg.includes('Too Many Requests');
        const isRpcLimit = errorMsg.includes('limit') || errorMsg.includes('timeout') || errorMsg.includes('RPC Request failed');

        if (isRateLimit) {
           // Rate limit hit: Wait and retry same block range
           // Do not reduce chunk size further, as that increases request count
           process.stdout.write(`\nRate limit (429). Pausing 10s...`);
           await new Promise(r => setTimeout(r, 10000));
        } else if (isRpcLimit) {
          // Reduce chunk size and retry
          const newChunkSize = chunkSize / 2n;
          if (newChunkSize < 100n) {
             // If chunk size gets too small, we might be stuck or just hitting limits. 
             // Try to skip or just wait longer.
             console.error(`\nStuck on block ${fromBlock} with small chunk. Skipping range.`);
             fromBlock = toBlock + 1n;
             chunkSize = 5000n; // Reset to reasonable size
          } else {
             chunkSize = newChunkSize;
          }
        } else {
          console.error(`\nError fetching logs for ${distributor} at block ${fromBlock}:`, e);
          await new Promise(r => setTimeout(r, 2000));
          fromBlock = toBlock + 1n; // Skip if unknown error to avoid infinite loop
        }
      }
    }
    console.log('\n');
  }

  console.log(`Found ${earnedMap.size} addresses with earned Moons.`);
  
  // Now update users
  const holders = await prisma.holder.findMany({
    where: { username: { not: null } },
    select: { address: true, username: true }
  });

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
  // Run the earned moons calculation first
  await updateEarnedMoons();

  console.log("Fetching all addresses (this may take a while)...");
  const holders = await prisma.holder.findMany({
    // Fetch everyone, not just labeled ones
    select: { address: true, label: true, username: true }
  });

  // Prioritize labeled addresses
  holders.sort((a, b) => {
    if (a.label && !b.label) return -1;
    if (!a.label && b.label) return 1;
    return 0;
  });

  console.log(`Found ${holders.length} addresses to refresh.`);

  // Process in batches to use multicall and avoid overwhelming the DB/RPC
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < holders.length; i += BATCH_SIZE) {
    const batch = holders.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i + 1}-${Math.min(i + BATCH_SIZE, holders.length)} of ${holders.length}...`);

    try {
      // Prepare multicall contracts for this batch
      // We need to check Nova, One, and Eth for each address
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

      // Execute multicalls in parallel
      const [novaResults, oneResults, ethResults] = await Promise.all([
        novaClient.multicall({ contracts: novaContracts }),
        oneClient.multicall({ contracts: oneContracts }),
        ethClient.multicall({ contracts: ethContracts })
      ]);

      // Process results and update DB sequentially to avoid SQLite timeouts and RPC rate limits
      for (let index = 0; index < batch.length; index++) {
        const holder = batch[index];
        const novaBal = Number(novaResults[index].result || 0n) / 1e18;
        const oneBal = Number(oneResults[index].result || 0n) / 1e18;
        const ethBal = Number(ethResults[index].result || 0n) / 1e18;
        const total = novaBal + oneBal + ethBal;

        let activity: { lastTransferAt: Date | null, hasOutgoing: boolean } = { lastTransferAt: null, hasOutgoing: false };
        
        try {
          // Add a small delay before getLogs to be nice to RPC
          await new Promise(r => setTimeout(r, 100)); 
          activity = await getActivity(novaClient, MOON_CONTRACTS.arbitrumNova, holder.address);
        } catch (err) {
          console.warn(`Failed to get activity for ${holder.address}`, err);
        }

        await prisma.holder.update({
          where: { address: holder.address },
          data: {
            balanceNova: novaBal,
            balanceOne: oneBal,
            balanceEth: ethBal,
            totalBalance: total,
            lastTransferAt: activity.lastTransferAt || undefined,
            hasOutgoing: activity.hasOutgoing ? true : undefined
          }
        });
      }

    } catch (e) {
      console.error(`Error processing batch ${i}:`, e);
    }
    
    // Rate limit slightly - increased to 1s to be nicer to RPCs with getLogs
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("Done!");
}

main();
