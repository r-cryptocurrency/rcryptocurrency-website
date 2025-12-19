import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { arbitrum } from 'viem/chains';
import { prisma } from '@rcryptocurrency/database';
import { MOON_CONTRACTS, LIQUIDITY_POOLS } from '@rcryptocurrency/chain-data';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Load RPC URLs from environment
const QUICKNODE_URL_NOVA = process.env.QUICKNODE_URL_NOVA;
const QUICKNODE_URL_ONE = process.env.QUICKNODE_URL_ONE;
const ALCHEMY_URL_NOVA = process.env.ALCHEMY_URL_NOVA;
const ALCHEMY_URL_ONE = process.env.ALCHEMY_URL_ONE;

console.log('RPC Configuration:');
console.log(`  Nova: ${QUICKNODE_URL_NOVA ? 'QuickNode ✓' : 'Public only'}, ${ALCHEMY_URL_NOVA ? 'Alchemy ✓' : ''}`);
console.log(`  One:  ${QUICKNODE_URL_ONE ? 'QuickNode ✓' : 'Public only'}, ${ALCHEMY_URL_ONE ? 'Alchemy ✓' : ''}`);

// Define Arbitrum Nova
const arbitrumNova = {
  id: 42170,
  name: 'Arbitrum Nova',
  network: 'arbitrum-nova',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://nova.arbitrum.io/rpc'] },
    public: { http: ['https://nova.arbitrum.io/rpc'] },
  },
};

// Uniswap V2/SushiSwap V2 Swap event
const SWAP_V2_EVENT = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');

// Uniswap V3/Camelot V3 Swap event
const SWAP_V3_EVENT = parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)');

const DELAY_MS = 50; // Fast with dedicated RPC

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

interface RpcProvider {
  name: string;
  url: string;
  maxBlockRange: bigint;
  client?: any;
}

interface PoolConfig {
  chain: string;
  chainObj: any;
  address: string;
  type: 'V2' | 'V3';
  name: string;
  moonIsToken0: boolean;
  providers: RpcProvider[];
}

// Get the last processed block for a DEX
async function getLastSwapBlock(dex: string, chain: string): Promise<bigint> {
  const lastSwap = await prisma.swap.findFirst({
    where: { dex, chain },
    orderBy: { blockNumber: 'desc' },
    select: { blockNumber: true }
  });
  return lastSwap ? BigInt(lastSwap.blockNumber) : 0n;
}

async function getBlockTimestamp(client: any, blockNumber: bigint): Promise<Date> {
  const block = await client.getBlock({ blockNumber });
  return new Date(Number(block.timestamp) * 1000);
}

// Try to fetch logs with a specific provider, returns null on failure
async function tryGetLogs(
  provider: RpcProvider,
  address: string,
  event: any,
  fromBlock: bigint,
  toBlock: bigint
): Promise<any[] | null> {
  if (!provider.client) return null;
  
  try {
    const logs = await provider.client.getLogs({
      address: address as `0x${string}`,
      event,
      fromBlock,
      toBlock,
    });
    return logs;
  } catch (error: any) {
    const msg = error.message || '';
    // Don't log for expected block range errors
    if (!msg.includes('block range') && !msg.includes('10 block')) {
      console.log(`\n   [${provider.name}] Error: ${msg.substring(0, 100)}`);
    }
    return null;
  }
}

async function scanPool(pool: PoolConfig) {
  console.log(`\n=== Scanning ${pool.name} on ${pool.chain} ===`);
  console.log(`Pool address: ${pool.address}`);
  console.log(`Type: ${pool.type}`);
  console.log(`Providers: ${pool.providers.filter(p => p.client).map(p => `${p.name}(${p.maxBlockRange})`).join(', ')}`);

  // Use the first available client for block number
  const primaryClient = pool.providers.find(p => p.client)?.client;
  if (!primaryClient) {
    console.error('No RPC providers available!');
    return;
  }

  const currentBlock = await primaryClient.getBlockNumber();
  const lastProcessedBlock = await getLastSwapBlock(pool.name, pool.chain);
  const startBlock = lastProcessedBlock > 0n ? lastProcessedBlock + 1n : 0n;

  console.log(`Current block: ${currentBlock}`);
  console.log(`Last processed: ${lastProcessedBlock}`);
  console.log(`Starting from: ${startBlock}`);

  if (startBlock >= currentBlock) {
    console.log(`✅ ${pool.name} is already up to date!`);
    return;
  }

  const event = pool.type === 'V2' ? SWAP_V2_EVENT : SWAP_V3_EVENT;
  let fromBlock = startBlock;
  let totalSwaps = 0;
  let consecutiveErrors = 0;

  while (fromBlock < currentBlock) {
    let logs: any[] | null = null;
    let usedProvider: RpcProvider | null = null;

    // Try each provider in order with their respective block ranges
    for (const provider of pool.providers) {
      if (!provider.client) continue;

      const chunkSize = provider.maxBlockRange;
      const toBlock = fromBlock + chunkSize > currentBlock ? currentBlock : fromBlock + chunkSize;
      
      const progress = ((Number(fromBlock - startBlock) / Number(currentBlock - startBlock)) * 100).toFixed(1);
      process.stdout.write(`\r[${progress}%] ${provider.name}: blocks ${fromBlock} to ${toBlock}...    `);

      logs = await tryGetLogs(provider, pool.address, event, fromBlock, toBlock);
      
      if (logs !== null) {
        usedProvider = provider;
        // Successfully got logs, process them
        if (logs.length > 0) {
          console.log(`\n   Found ${logs.length} swap events.`);
        }

        for (const log of logs) {
          const txHash = log.transactionHash;
          const blockNumber = log.blockNumber;

          if (!txHash || !blockNumber) continue;

          let moonAmount = 0;
          let otherAmount = 0;
          let isBuy = false;
          let maker = '';

          if (pool.type === 'V2') {
            const args = log.args as any;
            const amount0In = Number(args.amount0In || 0n) / 1e18;
            const amount1In = Number(args.amount1In || 0n) / 1e18;
            const amount0Out = Number(args.amount0Out || 0n) / 1e18;
            const amount1Out = Number(args.amount1Out || 0n) / 1e18;
            maker = (args.to || args.sender || '').toLowerCase();

            if (pool.moonIsToken0) {
              moonAmount = amount0Out > 0 ? amount0Out : amount0In;
              otherAmount = amount1In > 0 ? amount1In : amount1Out;
              isBuy = amount0Out > 0;
            } else {
              moonAmount = amount1Out > 0 ? amount1Out : amount1In;
              otherAmount = amount0In > 0 ? amount0In : amount0Out;
              isBuy = amount1Out > 0;
            }
          } else {
            const args = log.args as any;
            const amount0 = Number(args.amount0 || 0n) / 1e18;
            const amount1 = Number(args.amount1 || 0n) / 1e18;
            maker = (args.recipient || args.sender || '').toLowerCase();

            if (pool.moonIsToken0) {
              moonAmount = Math.abs(amount0);
              otherAmount = Math.abs(amount1);
              isBuy = amount0 < 0;
            } else {
              moonAmount = Math.abs(amount1);
              otherAmount = Math.abs(amount0);
              isBuy = amount1 < 0;
            }
          }

          if (moonAmount === 0) continue;

          const timestamp = await getBlockTimestamp(primaryClient, blockNumber);

          await prisma.swap.upsert({
            where: { txHash },
            update: {},
            create: {
              txHash,
              blockNumber: Number(blockNumber),
              timestamp,
              chain: pool.chain,
              dex: pool.name,
              amountIn: isBuy ? otherAmount : moonAmount,
              amountOut: isBuy ? moonAmount : otherAmount,
              tokenIn: isBuy ? 'ETH' : 'MOON',
              tokenOut: isBuy ? 'MOON' : 'ETH',
              usdValue: null,
              maker,
            },
          });

          if (maker && maker.startsWith('0x')) {
            await prisma.holder.upsert({
              where: { address: maker },
              create: {
                address: maker,
                hasOutgoing: true,
                lastTransferAt: timestamp,
              },
              update: {
                hasOutgoing: true,
                lastTransferAt: timestamp,
              }
            });
          }

          totalSwaps++;
        }

        consecutiveErrors = 0;
        fromBlock = toBlock + 1n;
        break; // Successfully processed, move to next chunk
      }
    }

    if (logs === null) {
      // All providers failed
      consecutiveErrors++;
      console.error(`\n   All providers failed for chunk ${fromBlock}. Waiting...`);
      
      if (consecutiveErrors >= 5) {
        console.error('\n   Too many consecutive errors. Stopping.');
        break;
      }
      
      await sleep(5000 * consecutiveErrors);
    } else {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n✅ Finished scanning ${pool.name}. Found ${totalSwaps} new swaps.`);
}

function createClient(chainObj: any, url: string | undefined) {
  if (!url) return undefined;
  return createPublicClient({
    chain: chainObj,
    transport: http(url, { timeout: 60_000 }),
  });
}

async function main() {
  console.log('=== BACKFILL SWAPS ===\n');
  console.log('This script scans all DEX pools for historical swap events.');
  console.log('It will resume from where it left off.\n');

  // Define providers with their block range limits
  // QuickNode: unlimited, Alchemy free: 10 blocks, Public: 2000 blocks (but slow)
  const novaProviders: RpcProvider[] = [
    { name: 'QuickNode', url: QUICKNODE_URL_NOVA!, maxBlockRange: 10000n, client: createClient(arbitrumNova, QUICKNODE_URL_NOVA) },
    { name: 'Alchemy', url: ALCHEMY_URL_NOVA!, maxBlockRange: 10n, client: createClient(arbitrumNova, ALCHEMY_URL_NOVA) },
    { name: 'Public', url: 'https://nova.arbitrum.io/rpc', maxBlockRange: 2000n, client: createClient(arbitrumNova, 'https://nova.arbitrum.io/rpc') },
  ].filter(p => p.client);

  const oneProviders: RpcProvider[] = [
    { name: 'QuickNode', url: QUICKNODE_URL_ONE!, maxBlockRange: 10000n, client: createClient(arbitrum, QUICKNODE_URL_ONE) },
    { name: 'Alchemy', url: ALCHEMY_URL_ONE!, maxBlockRange: 10n, client: createClient(arbitrum, ALCHEMY_URL_ONE) },
    { name: 'Public', url: 'https://arb1.arbitrum.io/rpc', maxBlockRange: 2000n, client: createClient(arbitrum, 'https://arb1.arbitrum.io/rpc') },
  ].filter(p => p.client);

  const pools: PoolConfig[] = [
    {
      chain: 'Arbitrum Nova',
      chainObj: arbitrumNova,
      address: LIQUIDITY_POOLS.nova.sushiSwapV2,
      type: 'V2',
      name: 'SushiSwap V2 (Nova)',
      moonIsToken0: true,
      providers: novaProviders,
    },
    {
      chain: 'Arbitrum One',
      chainObj: arbitrum,
      address: LIQUIDITY_POOLS.one.camelotV3,
      type: 'V3',
      name: 'Camelot V3',
      moonIsToken0: true,
      providers: oneProviders,
    },
    {
      chain: 'Arbitrum One',
      chainObj: arbitrum,
      address: LIQUIDITY_POOLS.one.uniswapV3,
      type: 'V3',
      name: 'Uniswap V3',
      moonIsToken0: true,
      providers: oneProviders,
    },
  ];

  for (const pool of pools) {
    await scanPool(pool);
  }

  console.log('\n=== BACKFILL COMPLETE ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
