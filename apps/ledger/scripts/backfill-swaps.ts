import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { arbitrum } from 'viem/chains';
import { prisma } from '@rcryptocurrency/database';
import { MOON_CONTRACTS, LIQUIDITY_POOLS } from '@rcryptocurrency/chain-data';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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

const CHUNK_SIZE = 2000n;
const DELAY_MS = 200;

interface PoolConfig {
  chain: string;
  chainObj: any;
  rpcUrl: string;
  address: string;
  type: 'V2' | 'V3';
  name: string;
  moonIsToken0: boolean; // Whether MOON is token0 in the pair
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

async function scanPool(pool: PoolConfig) {
  console.log(`\n=== Scanning ${pool.name} on ${pool.chain} ===`);
  console.log(`Pool address: ${pool.address}`);
  console.log(`Type: ${pool.type}`);

  const client = createPublicClient({
    chain: pool.chainObj,
    transport: http(pool.rpcUrl, { timeout: 60_000 }),
  });

  const currentBlock = await client.getBlockNumber();
  const lastProcessedBlock = await getLastSwapBlock(pool.name, pool.chain);
  const startBlock = lastProcessedBlock > 0n ? lastProcessedBlock + 1n : 0n;

  console.log(`Current block: ${currentBlock}`);
  console.log(`Last processed: ${lastProcessedBlock}`);
  console.log(`Starting from: ${startBlock}`);

  if (startBlock >= currentBlock) {
    console.log(`✅ ${pool.name} is already up to date!`);
    return;
  }

  let fromBlock = startBlock;
  let totalSwaps = 0;

  while (fromBlock < currentBlock) {
    const toBlock = fromBlock + CHUNK_SIZE > currentBlock ? currentBlock : fromBlock + CHUNK_SIZE;
    
    const progress = ((Number(fromBlock - startBlock) / Number(currentBlock - startBlock)) * 100).toFixed(1);
    process.stdout.write(`\r[${progress}%] Scanning blocks ${fromBlock} to ${toBlock}...`);

    try {
      // Fetch logs based on pool type
      let logs: any[];
      if (pool.type === 'V2') {
        logs = await client.getLogs({
          address: pool.address as `0x${string}`,
          event: SWAP_V2_EVENT,
          fromBlock,
          toBlock,
        });
      } else {
        logs = await client.getLogs({
          address: pool.address as `0x${string}`,
          event: SWAP_V3_EVENT,
          fromBlock,
          toBlock,
        });
      }

      if (logs.length > 0) {
        console.log(`\n   Found ${logs.length} swap events in this chunk.`);
      }

      for (const log of logs) {
        const txHash = log.transactionHash;
        const blockNumber = log.blockNumber;

        if (!txHash || !blockNumber) continue;

        let moonAmount = 0;
        let otherAmount = 0;
        let isBuy = false; // true if buying MOON
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
          // V3
          const args = log.args as any;
          const amount0 = Number(args.amount0 || 0n) / 1e18;
          const amount1 = Number(args.amount1 || 0n) / 1e18;
          maker = (args.recipient || args.sender || '').toLowerCase();

          if (pool.moonIsToken0) {
            moonAmount = Math.abs(amount0);
            otherAmount = Math.abs(amount1);
            isBuy = amount0 < 0; // Negative means pool sent it out (user received)
          } else {
            moonAmount = Math.abs(amount1);
            otherAmount = Math.abs(amount0);
            isBuy = amount1 < 0;
          }
        }

        if (moonAmount === 0) continue;

        const timestamp = await getBlockTimestamp(client, blockNumber);

        // Use upsert to handle duplicates
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
            usdValue: null, // Could calculate from price oracle later
            maker,
          },
        });
        totalSwaps++;
      }

    } catch (error: any) {
      console.error(`\nError scanning chunk ${fromBlock}-${toBlock}:`, error.message || error);
      await new Promise(r => setTimeout(r, 5000));
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
    fromBlock = toBlock + 1n;
  }

  console.log(`\n✅ Finished scanning ${pool.name}. Found ${totalSwaps} new swaps.`);
}

async function main() {
  console.log('=== BACKFILL SWAPS ===\n');
  console.log('This script scans all DEX pools for historical swap events.');
  console.log('It will resume from where it left off.\n');

  const novaRpc = process.env.QUICKNODE_URL_NOVA || 'https://nova.arbitrum.io/rpc';
  const oneRpc = process.env.QUICKNODE_URL_ONE || 'https://arb1.arbitrum.io/rpc';

  const pools: PoolConfig[] = [
    {
      chain: 'Arbitrum Nova',
      chainObj: arbitrumNova,
      rpcUrl: novaRpc,
      address: LIQUIDITY_POOLS.nova.sushiSwapV2,
      type: 'V2',
      name: 'SushiSwap V2 (Nova)',
      moonIsToken0: true, // Check contract to confirm
    },
    {
      chain: 'Arbitrum One',
      chainObj: arbitrum,
      rpcUrl: oneRpc,
      address: LIQUIDITY_POOLS.one.camelotV3,
      type: 'V3',
      name: 'Camelot V3',
      moonIsToken0: true, // Check contract to confirm
    },
    {
      chain: 'Arbitrum One',
      chainObj: arbitrum,
      rpcUrl: oneRpc,
      address: LIQUIDITY_POOLS.one.uniswapV3,
      type: 'V3',
      name: 'Uniswap V3',
      moonIsToken0: true, // Check contract to confirm
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
