import { createPublicClient, http, parseAbiItem } from 'viem';
import { arbitrum } from 'viem/chains';
import { prisma } from '@rcryptocurrency/database';
import { LIQUIDITY_POOLS } from '@rcryptocurrency/chain-data';
import dotenv from 'dotenv';
import path from 'path';

// PM2 sets cwd to apps/ledger, so go up 2 levels to reach project root
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

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

// Swap events
const SWAP_V2_EVENT = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');
const SWAP_V3_EVENT = parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)');
const SWAP_V4_EVENT = parseAbiItem('event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)');

// V4 Pool IDs for MOON pools on the Pool Manager
const V4_MOON_POOL_IDS = [
  '0x065144c11d71d908594e6305b7ae834d00443374f87cc82692fbac8ed81af56a', // MOON/USDC
  '0xa14aaa23a3b1ae4b0bdc031151c6814f1d06a901ffc5f8ab6951c75de2bc2c17', // MOON/ETH
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface PoolConfig {
  chain: string;
  chainObj: any;
  address: string;
  type: 'V2' | 'V3' | 'V4';
  name: string;
  moonIsToken0: boolean;
  rpcUrl: string;
  chunkSize: number;
  deploymentBlock: bigint; // Block when pool was deployed - don't scan before this
  poolIds?: string[]; // For V4 Pool Manager - filter by these pool IDs
  token1Symbol?: string; // For token labeling (ETH, USDC, etc)
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
  try {
    const block = await client.getBlock({ blockNumber });
    return new Date(Number(block.timestamp) * 1000);
  } catch {
    return new Date();
  }
}

async function getBlockNumberWithRetry(client: any, maxRetries = 10): Promise<bigint> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.getBlockNumber();
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('rate limit') || msg.includes('Too Many')) {
        const waitTime = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s, 40s...
        console.log(`Rate limited on getBlockNumber. Waiting ${waitTime/1000}s... (${attempt + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to get block number after retries');
}

async function fetchLogsWithRetry(
  client: any,
  address: string,
  event: any,
  fromBlock: bigint,
  toBlock: bigint
): Promise<any[]> {
  let attempt = 0;
  
  while (true) {
    try {
      return await client.getLogs({
        address: address as `0x${string}`,
        event,
        fromBlock,
        toBlock,
      });
    } catch (error: any) {
      const msg = error.message || '';
      
      // Rate limit - wait and retry forever (don't give up)
      if (msg.includes('429') || msg.includes('rate limit') || msg.includes('Rate Limit')) {
        attempt++;
        const waitTime = Math.min(Math.pow(2, attempt) * 5000, 120000); // Max 2 minutes
        console.log(`\n   Rate limited. Waiting ${waitTime/1000}s... (attempt ${attempt})`);
        await sleep(waitTime);
        continue;
      }
      
      // Request too large - reduce chunk
      if (msg.includes('413')) {
        throw new Error('CHUNK_TOO_LARGE');
      }
      
      // Block range error
      if (msg.includes('block range') || msg.includes('10 block')) {
        throw new Error('CHUNK_TOO_LARGE');
      }
      
      // Daily limit - fatal
      if (msg.includes('daily request limit')) {
        throw new Error('DAILY_LIMIT');
      }
      
      // Other error - retry a few times
      attempt++;
      if (attempt > 10) {
        throw new Error(`PERSISTENT_ERROR: ${msg.substring(0, 100)}`);
      }
      console.log(`\n   Error: ${msg.substring(0, 80)}. Retry ${attempt}...`);
      await sleep(5000);
    }
  }
}

async function scanPool(pool: PoolConfig): Promise<boolean> {
  console.log(`\n=== Scanning ${pool.name} on ${pool.chain} ===`);
  console.log(`Pool: ${pool.address}`);
  console.log(`RPC: ${pool.rpcUrl.includes('quiknode') ? 'QuickNode' : pool.rpcUrl.includes('alchemy') ? 'Alchemy' : 'Public'}`);
  console.log(`Chunk size: ${pool.chunkSize} blocks`);

  const client = createPublicClient({
    chain: pool.chainObj,
    transport: http(pool.rpcUrl, { timeout: 120_000 }),
  });

  let currentBlock: bigint;
  try {
    currentBlock = await getBlockNumberWithRetry(client);
  } catch (e: any) {
    console.error(`Failed to get block number: ${e.message}`);
    return false;
  }

  const lastProcessedBlock = await getLastSwapBlock(pool.name, pool.chain);
  // Don't scan before the pool was deployed - waste of time and resources
  const minStartBlock = pool.deploymentBlock;
  const startBlock = lastProcessedBlock > 0n 
    ? (lastProcessedBlock + 1n > minStartBlock ? lastProcessedBlock + 1n : minStartBlock)
    : minStartBlock;

  console.log(`Current block: ${currentBlock}`);
  console.log(`Last processed: ${lastProcessedBlock}`);
  console.log(`Pool deployed at: ${pool.deploymentBlock}`);
  console.log(`Starting from: ${startBlock}`);

  if (startBlock >= currentBlock) {
    console.log(`✅ ${pool.name} is already up to date!`);
    return;
  }

  const event = pool.type === 'V2' ? SWAP_V2_EVENT : pool.type === 'V3' ? SWAP_V3_EVENT : SWAP_V4_EVENT;
  let fromBlock = startBlock;
  let totalSwaps = 0;
  let chunkSize = BigInt(pool.chunkSize);

  while (fromBlock < currentBlock) {
    const toBlock = fromBlock + chunkSize > currentBlock ? currentBlock : fromBlock + chunkSize;
    
    const progress = ((Number(fromBlock - startBlock) / Number(currentBlock - startBlock)) * 100).toFixed(1);
    process.stdout.write(`\r[${progress}%] Blocks ${fromBlock} to ${toBlock}...`);

    try {
      const logs = await fetchLogsWithRetry(client, pool.address, event, fromBlock, toBlock);

      if (logs.length > 0) {
        console.log(` Found ${logs.length} swaps`);
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
        } else if (pool.type === 'V4') {
          // V4 has pool ID filtering and int128 amounts
          const args = log.args as any;
          const poolId = args.id?.toLowerCase();
          
          // Skip if not one of our MOON pools
          if (pool.poolIds && !pool.poolIds.includes(poolId)) {
            continue;
          }
          
          // V4 uses int128 for amounts
          const amount0 = Number(args.amount0 || 0n) / 1e18;
          const amount1 = Number(args.amount1 || 0n) / 1e18;
          maker = (args.sender || '').toLowerCase();

          // V4: positive amount means tokens going INTO the pool (user pays)
          // negative amount means tokens going OUT of the pool (user receives)
          if (pool.moonIsToken0) {
            moonAmount = Math.abs(amount0);
            otherAmount = Math.abs(amount1);
            isBuy = amount0 < 0; // User receives MOON = buy
          } else {
            moonAmount = Math.abs(amount1);
            otherAmount = Math.abs(amount0);
            isBuy = amount1 < 0;
          }
        } else {
          // V3
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

        const timestamp = await getBlockTimestamp(client, blockNumber);
        const token1Symbol = pool.token1Symbol || 'ETH';

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
            tokenIn: isBuy ? token1Symbol : 'MOON',
            tokenOut: isBuy ? 'MOON' : token1Symbol,
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

      // Success - move to next chunk
      fromBlock = toBlock + 1n;
      await sleep(100); // Small delay between successful requests

    } catch (error: any) {
      if (error.message === 'CHUNK_TOO_LARGE') {
        // Reduce chunk size and retry same block
        chunkSize = chunkSize / 2n;
        if (chunkSize < 10n) chunkSize = 10n;
        console.log(`\n   Chunk too large, reducing to ${chunkSize} blocks`);
        continue;
      }
      
      if (error.message === 'DAILY_LIMIT') {
        console.error('\n   Daily limit reached. Please try again tomorrow or use a different RPC.');
        return false;
      }
      
      // For persistent errors or unexpected errors, log but keep going
      console.error(`\n   Error: ${error.message}. Progress saved, you can restart.`);
      return false;
    }
  }

  console.log(`\n✅ Finished ${pool.name}. Found ${totalSwaps} new swaps.`);
  return true;
}

async function main() {
  console.log('=== BACKFILL SWAPS ===\n');

  // Use FREE public RPCs only - they have 2000 block limit but are reliable
  const novaRpc = 'https://nova.arbitrum.io/rpc';
  const oneRpc = 'https://arb1.arbitrum.io/rpc';

  console.log('Using public RPCs with 2000 block chunks');
  console.log('This is slower but reliable and free.\n');

  // Check existing progress first
  console.log('Checking existing progress in database...');
  const novaProgress = await getLastSwapBlock('SushiSwap V2 (Nova)', 'Arbitrum Nova');
  const camelotProgress = await getLastSwapBlock('Camelot V3', 'Arbitrum One');
  const uniswapV3Progress = await getLastSwapBlock('Uniswap V3', 'Arbitrum One');
  const uniswapV4Progress = await getLastSwapBlock('Uniswap V4 (One)', 'Arbitrum One');
  
  console.log(`  SushiSwap V2 (Nova): last block ${novaProgress > 0n ? novaProgress.toString() : 'none (starting fresh)'}`);
  console.log(`  Camelot V3: last block ${camelotProgress > 0n ? camelotProgress.toString() : 'none (starting fresh)'}`);
  console.log(`  Uniswap V3: last block ${uniswapV3Progress > 0n ? uniswapV3Progress.toString() : 'none (starting fresh)'}`);
  console.log(`  Uniswap V4: last block ${uniswapV4Progress > 0n ? uniswapV4Progress.toString() : 'none (starting fresh)'}`);

  // Pool deployment blocks (from arbiscan contract creation txs)
  // - SushiSwap V2 Nova: Block ~2_100_000 (Aug 2022, shortly after Nova launch)
  // - Camelot V3: Block 192_085_710 (Mar 19, 2024)
  // - Uniswap V3: Block 377_402_392 (Sep 9, 2025)
  // - Uniswap V4 Manager: Block ~300_000_000 (Jan 2025), but MOON pools initialized later
  const pools: PoolConfig[] = [
    {
      chain: 'Arbitrum Nova',
      chainObj: arbitrumNova,
      address: LIQUIDITY_POOLS.nova.sushiSwapV2,
      type: 'V2',
      name: 'SushiSwap V2 (Nova)',
      moonIsToken0: true,
      rpcUrl: novaRpc,
      chunkSize: 2000,
      deploymentBlock: 2_100_000n, // SushiSwap pool created Aug 2022
      token1Symbol: 'ETH',
    },
    {
      chain: 'Arbitrum One',
      chainObj: arbitrum,
      address: LIQUIDITY_POOLS.one.camelotV3,
      type: 'V3',
      name: 'Camelot V3',
      moonIsToken0: true,
      rpcUrl: oneRpc,
      chunkSize: 2000,
      deploymentBlock: 192_085_710n, // Created Mar 19, 2024
      token1Symbol: 'ETH',
    },
    {
      chain: 'Arbitrum One',
      chainObj: arbitrum,
      address: LIQUIDITY_POOLS.one.uniswapV3,
      type: 'V3',
      name: 'Uniswap V3',
      moonIsToken0: true,
      rpcUrl: oneRpc,
      chunkSize: 2000,
      deploymentBlock: 377_402_392n, // Created Sep 9, 2025
      token1Symbol: 'USDC',
    },
    {
      chain: 'Arbitrum One',
      chainObj: arbitrum,
      address: LIQUIDITY_POOLS.one.uniswapV4Manager,
      type: 'V4',
      name: 'Uniswap V4 (One)',
      moonIsToken0: true,
      rpcUrl: oneRpc,
      chunkSize: 2000,
      deploymentBlock: 375_000_000n, // V4 MOON pools initialized late 2025
      poolIds: V4_MOON_POOL_IDS,
      token1Symbol: 'ETH/USDC', // Mixed pools
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const pool of pools) {
    const success = await scanPool(pool);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // Wait between pools to avoid rate limits
    await sleep(5000);
  }

  console.log('\n=== BACKFILL SUMMARY ===');
  console.log(`Successful: ${successCount}/${pools.length}`);
  if (failCount > 0) {
    console.log(`Failed: ${failCount}/${pools.length}`);
    console.log('\n❌ BACKFILL INCOMPLETE - Some pools failed. Check errors above and retry.');
    process.exit(1);
  } else {
    console.log('\n✅ BACKFILL COMPLETE');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
