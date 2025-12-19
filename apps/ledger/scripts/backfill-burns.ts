import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';
import { prisma } from '@rcryptocurrency/database';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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

const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

// Use a conservative chunk size for public RPCs
const CHUNK_SIZE = 2000n;
const DELAY_MS = 200;

async function getBlockTimestamp(client: any, blockNumber: bigint): Promise<Date> {
  const block = await client.getBlock({ blockNumber });
  return new Date(Number(block.timestamp) * 1000);
}

// Get the last processed block for a chain to resume from
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
  console.log(`\n=== Starting scan for ${chainName} ===`);
  console.log(`RPC: ${rpcUrl.replace(/([a-zA-Z0-9]{10})[a-zA-Z0-9]+/, '$1...')}`);

  const client = createPublicClient({
    chain: chainObj,
    transport: http(rpcUrl, { timeout: 60_000 }),
  });

  const currentBlock = await client.getBlockNumber();
  const lastProcessedBlock = await getLastBurnBlock(chainName);
  const startBlock = lastProcessedBlock > 0n ? lastProcessedBlock + 1n : 0n;
  
  console.log(`Current block: ${currentBlock}`);
  console.log(`Last processed: ${lastProcessedBlock}`);
  console.log(`Starting from: ${startBlock}`);

  if (startBlock >= currentBlock) {
    console.log(`✅ ${chainName} is already up to date!`);
    return;
  }

  let fromBlock = startBlock;
  let totalBurns = 0;

  while (fromBlock < currentBlock) {
    const toBlock = fromBlock + CHUNK_SIZE > currentBlock ? currentBlock : fromBlock + CHUNK_SIZE;
    
    const progress = ((Number(fromBlock - startBlock) / Number(currentBlock - startBlock)) * 100).toFixed(1);
    process.stdout.write(`\r[${progress}%] Scanning ${chainName} blocks ${fromBlock} to ${toBlock}...`);

    try {
      const logs = await client.getLogs({
        address: tokenAddress,
        event: TRANSFER_EVENT,
        args: {
          to: BURN_ADDRESS as `0x${string}`,
        },
        fromBlock,
        toBlock,
      });

      if (logs.length > 0) {
        console.log(`\n   Found ${logs.length} burn events in this chunk.`);
      }

      for (const log of logs) {
        const { from, value } = log.args;
        const txHash = log.transactionHash;
        const blockNumber = log.blockNumber;

        if (!txHash || !blockNumber || !value || !from) continue;

        const timestamp = await getBlockTimestamp(client, blockNumber);
        const amount = parseFloat(formatUnits(value, 18));

        // Use upsert to handle duplicates gracefully
        await prisma.burn.upsert({
          where: { txHash },
          update: {}, // Don't update if exists
          create: {
            txHash,
            blockNumber: Number(blockNumber),
            timestamp,
            amount,
            chain: chainName,
            sender: from.toLowerCase(),
          },
        });
        totalBurns++;
        process.stdout.write(' [Saved]');
      }

    } catch (error: any) {
      console.error(`\nError scanning chunk ${fromBlock}-${toBlock}:`, error.message || error);
      // Sleep longer on error
      await new Promise(r => setTimeout(r, 5000));
    }

    // Rate limit protection
    await new Promise(r => setTimeout(r, DELAY_MS));

    fromBlock = toBlock + 1n;
  }

  console.log(`\n✅ Finished scanning ${chainName}. Found ${totalBurns} new burns.`);
}

async function main() {
  console.log('=== BACKFILL BURNS ===\n');
  console.log('This script scans all chains for historical burns to 0xdead.');
  console.log('It will resume from where it left off.\n');

  // Use QuickNode RPCs for faster scanning (using up credits as requested)
  const novaRpc = process.env.QUICKNODE_URL_NOVA || 'https://nova.arbitrum.io/rpc';
  const oneRpc = process.env.QUICKNODE_URL_ONE || 'https://arb1.arbitrum.io/rpc';
  const ethRpc = process.env.QUICKNODE_URL_ETH || 'https://eth.llamarpc.com';

  // Arbitrum Nova
  await scanChain(
    'Arbitrum Nova',
    arbitrumNova,
    novaRpc,
    MOON_CONTRACTS.arbitrumNova as `0x${string}`
  );

  // Arbitrum One
  await scanChain(
    'Arbitrum One',
    arbitrum,
    oneRpc,
    MOON_CONTRACTS.arbitrumOne as `0x${string}`
  );

  // Ethereum Mainnet
  await scanChain(
    'Ethereum',
    mainnet,
    ethRpc,
    MOON_CONTRACTS.ethereum as `0x${string}`
  );

  console.log('\n=== BACKFILL COMPLETE ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
