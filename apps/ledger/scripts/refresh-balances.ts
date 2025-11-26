import { createPublicClient, http, parseAbiItem } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import { prisma } from '@rcryptocurrency/database';
import * as dotenv from 'dotenv';

dotenv.config();

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

async function main() {
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
