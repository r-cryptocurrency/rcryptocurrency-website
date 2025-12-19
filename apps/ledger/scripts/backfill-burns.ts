import { createPublicClient, http, fallback, parseAbiItem, formatUnits } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';
import { prisma } from '@rcryptocurrency/database';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Load RPC URLs from environment
const QUICKNODE_URL_NOVA = process.env.QUICKNODE_URL_NOVA;
const QUICKNODE_URL_ONE = process.env.QUICKNODE_URL_ONE;
const QUICKNODE_URL_ETH = process.env.QUICKNODE_URL_ETH;
const ALCHEMY_URL_NOVA = process.env.ALCHEMY_URL_NOVA;
const ALCHEMY_URL_ONE = process.env.ALCHEMY_URL_ONE;
const ALCHEMY_URL_ETH = process.env.ALCHEMY_URL_ETH;

console.log('RPC Configuration:');
console.log(`  Nova: ${QUICKNODE_URL_NOVA ? 'QuickNode ✓' : 'Public only'}, ${ALCHEMY_URL_NOVA ? 'Alchemy ✓' : ''}`);
console.log(`  One:  ${QUICKNODE_URL_ONE ? 'QuickNode ✓' : 'Public only'}, ${ALCHEMY_URL_ONE ? 'Alchemy ✓' : ''}`);
console.log(`  ETH:  ${QUICKNODE_URL_ETH ? 'QuickNode ✓' : 'Public only'}, ${ALCHEMY_URL_ETH ? 'Alchemy ✓' : ''}`);

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

// QuickNode can handle larger chunks than public RPCs
const CHUNK_SIZE = 5000n;
const DELAY_MS = 100;
const MAX_RETRIES = 5;

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, baseDelay = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.includes('rate limit');
      const delay = isRateLimit ? baseDelay * Math.pow(2, i) : baseDelay;
      
      if (i === retries - 1) throw error;
      console.log(`\n   Retry ${i + 1}/${retries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

// Build fallback RPC transports (QuickNode primary, Alchemy secondary, Public fallback)
function getNovaTransport() {
  const urls = [
    QUICKNODE_URL_NOVA,
    ALCHEMY_URL_NOVA,
    'https://nova.arbitrum.io/rpc'
  ].filter(Boolean) as string[];
  return fallback(urls.map(url => http(url, { timeout: 60_000 })));
}

function getOneTransport() {
  const urls = [
    QUICKNODE_URL_ONE,
    ALCHEMY_URL_ONE,
    'https://arb1.arbitrum.io/rpc'
  ].filter(Boolean) as string[];
  return fallback(urls.map(url => http(url, { timeout: 60_000 })));
}

function getEthTransport() {
  const urls = [
    QUICKNODE_URL_ETH,
    ALCHEMY_URL_ETH,
    'https://eth.llamarpc.com'
  ].filter(Boolean) as string[];
  return fallback(urls.map(url => http(url, { timeout: 60_000 })));
}

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
  transport: any,
  tokenAddress: `0x${string}`
) {
  console.log(`\n=== Starting scan for ${chainName} ===`);

  const client = createPublicClient({
    chain: chainObj,
    transport,
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
      const logs = await withRetry(() => client.getLogs({
        address: tokenAddress,
        event: TRANSFER_EVENT,
        args: {
          to: BURN_ADDRESS as `0x${string}`,
        },
        fromBlock,
        toBlock,
      }));

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

        // Update Holder stats
        await prisma.holder.upsert({
          where: { address: from.toLowerCase() },
          create: {
            address: from.toLowerCase(),
            hasOutgoing: true,
            lastTransferAt: timestamp,
          },
          update: {
            hasOutgoing: true,
            lastTransferAt: timestamp,
          }
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
  console.log('It will resume from where it left off.');
  console.log('Using QuickNode as primary RPC with Alchemy/public fallback.\n');

  // Arbitrum Nova
  await scanChain(
    'Arbitrum Nova',
    arbitrumNova,
    getNovaTransport(),
    MOON_CONTRACTS.arbitrumNova as `0x${string}`
  );

  // Arbitrum One
  await scanChain(
    'Arbitrum One',
    arbitrum,
    getOneTransport(),
    MOON_CONTRACTS.arbitrumOne as `0x${string}`
  );

  // Ethereum Mainnet
  await scanChain(
    'Ethereum',
    mainnet,
    getEthTransport(),
    MOON_CONTRACTS.ethereum as `0x${string}`
  );

  console.log('\n=== BACKFILL COMPLETE ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
