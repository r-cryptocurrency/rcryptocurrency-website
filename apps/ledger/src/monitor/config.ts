import { parseAbiItem } from 'viem';
import { MOON_CONTRACTS, LIQUIDITY_POOLS } from '@rcryptocurrency/chain-data';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
// In dev (ts-node): __dirname is src/monitor. Root is ../../../../
// In prod (dist): __dirname is dist/src/monitor. Root is ../../../../../
const envPath = process.env.NODE_ENV === 'production' 
  ? path.resolve(__dirname, '../../../../../.env')
  : path.resolve(__dirname, '../../../../.env');

dotenv.config({ path: envPath });

export const BURN_ADDRESS = '0x000000000000000000000000000000000000dead';
export const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@rCryptoCurrencyOfficial';
export const NOTIFICATION_THRESHOLD = parseFloat(process.env.MOON_NOTIFICATION_THRESHOLD || '0.5');

// --- Event Definitions ---
export const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
export const SWAP_V2_EVENT = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');
export const SWAP_V3_EVENT = parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)');
export const SWAP_V4_EVENT = parseAbiItem('event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)');

// --- Pool Configurations ---
export const POOLS = {
  NOVA_SUSHI_V2: {
    address: LIQUIDITY_POOLS.nova.sushiSwapV2,
    type: 'V2',
    name: 'SushiSwap V2 (Nova)',
    token0: { symbol: 'MOON', decimals: 18 },
    token1: { symbol: 'ETH', decimals: 18 }
  },
  ONE_CAMELOT_V3: {
    address: LIQUIDITY_POOLS.one.camelotV3,
    type: 'V3',
    name: 'Camelot V3 (One)',
    token0: { symbol: 'MOON', decimals: 18 },
    token1: { symbol: 'ETH', decimals: 18 }
  },
  ONE_UNI_V3: {
    address: LIQUIDITY_POOLS.one.uniswapV3,
    type: 'V3',
    name: 'Uniswap V3 (One)',
    token0: { symbol: 'MOON', decimals: 18 },
    token1: { symbol: 'USDC', decimals: 6 }
  },
  ONE_POOL_MANAGER: {
    address: LIQUIDITY_POOLS.one.uniswapV4Manager,
    type: 'V4_MANAGER',
    name: 'Uniswap V4 Manager (One)',
    pools: {
        '0x065144c11d71d908594e6305b7ae834d00443374f87cc82692fbac8ed81af56a': {
            pair: 'MOON/USDC',
            token0: { symbol: 'MOON', decimals: 18 },
            token1: { symbol: 'USDC', decimals: 6 }
        },
        '0xa14aaa23a3b1ae4b0bdc031151c6814f1d06a901ffc5f8ab6951c75de2bc2c17': {
            pair: 'MOON/ETH',
            token0: { symbol: 'MOON', decimals: 18 },
            token1: { symbol: 'ETH', decimals: 18 }
        }
    }
  }
};

export { MOON_CONTRACTS };
