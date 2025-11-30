import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { arbitrum } from 'viem/chains';
import { prisma } from '@rcryptocurrency/database';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import dotenv from 'dotenv';

// Define Arbitrum Nova manually since it might be missing in this viem version
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
    default: {
      http: ['https://nova.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://nova.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://nova.arbiscan.io',
    },
  },
};

dotenv.config();

const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

// Use a conservative chunk size for public RPCs
const CHUNK_SIZE = 2000n;
const DELAY_MS = 200;

async function getBlockTimestamp(client: any, blockNumber: bigint): Promise<Date> {
  const block = await client.getBlock({ blockNumber });
  return new Date(Number(block.timestamp) * 1000);
}

async function scanChain(
  chainName: string,
  chainObj: any,
  rpcUrl: string,
  tokenAddress: `0x${string}`,
  startBlock: bigint
) {
  console.log(`Starting scan for ${chainName} using ${rpcUrl}...`);

  const client = createPublicClient({
    chain: chainObj,
    transport: http(rpcUrl),
  });

  const currentBlock = await client.getBlockNumber();
  console.log(`Current block on ${chainName}: ${currentBlock}`);

  let fromBlock = startBlock;

  while (fromBlock < currentBlock) {
    const toBlock = fromBlock + CHUNK_SIZE > currentBlock ? currentBlock : fromBlock + CHUNK_SIZE;
    
    // console.log(`Scanning ${chainName} blocks ${fromBlock} to ${toBlock}...`);
    process.stdout.write(`\rScanning ${chainName}: ${fromBlock}/${currentBlock} (${Math.round(Number(fromBlock)/Number(currentBlock)*100)}%)`);

    try {
      const logs = await client.getLogs({
        address: tokenAddress,
        event: TRANSFER_EVENT,
        args: {
          to: BURN_ADDRESS,
        },
        fromBlock,
        toBlock,
      });

      if (logs.length > 0) {
        console.log(`\nFound ${logs.length} burn events in this chunk.`);
      }

      for (const log of logs) {
        const { from, value } = log.args;
        const txHash = log.transactionHash;
        const blockNumber = log.blockNumber;

        if (!txHash || !blockNumber || !value || !from) continue;

        // Check if already exists to avoid re-fetching timestamp
        const existing = await prisma.burn.findUnique({
          where: { txHash },
        });

        if (existing) {
          continue;
        }

        const timestamp = await getBlockTimestamp(client, blockNumber);
        const amount = parseFloat(formatUnits(value, 18));

        await prisma.burn.create({
          data: {
            txHash,
            blockNumber: Number(blockNumber),
            timestamp,
            amount,
            chain: chainName,
            sender: from,
          },
        });
        process.stdout.write(' [Saved]');
      }

    } catch (error) {
      console.error(`\nError scanning chunk ${fromBlock}-${toBlock}:`, error);
      // If error, try to sleep longer and retry same chunk? 
      // For now, just sleep and continue (might miss blocks, but safer to restart script)
      await new Promise(r => setTimeout(r, 5000));
    }

    // Rate limit protection
    await new Promise(r => setTimeout(r, DELAY_MS));

    fromBlock = toBlock + 1n;
  }

  console.log(`\nFinished scanning ${chainName}.`);
}

async function main() {
  // Use Public RPCs for backfill to avoid burning API credits
  // Arbitrum Nova Public RPC
  await scanChain(
    'Arbitrum Nova',
    arbitrumNova,
    'https://nova.arbitrum.io/rpc',
    MOON_CONTRACTS.arbitrumNova,
    0n 
  );

  // Arbitrum One Public RPC
  await scanChain(
    'Arbitrum One',
    arbitrum,
    'https://arb1.arbitrum.io/rpc',
    MOON_CONTRACTS.arbitrumOne,
    0n 
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
