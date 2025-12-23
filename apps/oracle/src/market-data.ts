import axios from 'axios';
import { createPublicClient, http, fallback, parseAbiItem } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';
import { prisma } from '@rcryptocurrency/database';
import * as dotenv from 'dotenv';
import * as path from 'path';

// PM2 runs oracle from project root, so .env is in cwd
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Moon contracts on all chains
const MOON_CONTRACTS = {
  arbitrumNova: "0x0057Ac2d777797d31CD3f8f13bF5e927571D6Ad0",
  arbitrumOne: "0x24404DC041d74cd03cFE28855F555559390C931b",
  ethereum: "0xb2490e357980ce57bf5745e181e537a64eb367b1",
};

// SushiSwap V2 pool on Nova (MOON/ETH)
const SUSHI_POOL_NOVA = "0xd6c821b282531868721b41badca1f1ce471f43c5";

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
} as const;

// RPC clients with fallbacks (free RPCs first for ongoing monitoring)
const novaClient = createPublicClient({
  chain: arbitrumNova,
  transport: fallback([
    http("https://nova.arbitrum.io/rpc", { timeout: 30_000 }),
    http(process.env.ALCHEMY_URL_NOVA, { timeout: 30_000 }),
    http(process.env.QUICKNODE_URL_NOVA, { timeout: 30_000 }),
  ])
});

const oneClient = createPublicClient({
  chain: arbitrum,
  transport: fallback([
    http("https://arb1.arbitrum.io/rpc", { timeout: 30_000 }),
    http(process.env.ALCHEMY_URL_ONE, { timeout: 30_000 }),
    http(process.env.QUICKNODE_URL_ONE, { timeout: 30_000 }),
  ])
});

const ethClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http("https://eth.llamarpc.com", { timeout: 30_000 }),
    http(process.env.ALCHEMY_URL_ETH, { timeout: 30_000 }),
    http(process.env.QUICKNODE_URL_ETH, { timeout: 30_000 }),
  ])
});

const TOTAL_SUPPLY_ABI = [parseAbiItem('function totalSupply() view returns (uint256)')];
const RESERVES_ABI = [parseAbiItem('function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)')];

interface MarketData {
  priceUsd: number;
  priceEth: number;
  totalSupply: number;
  marketCap: number;
  volume24h: number | null;
  change24h: number | null;
  source: string; // 'kraken' | 'pool' | 'coingecko'
}

/**
 * Fetch MOON price from Kraken (free, no API key needed)
 */
async function getPriceFromKraken(): Promise<{ usd: number; volume24h: number } | null> {
  try {
    // Kraken uses MOONUSD pair
    const response = await axios.get('https://api.kraken.com/0/public/Ticker?pair=MOONUSD', {
      timeout: 10000
    });
    
    if (response.data.error?.length > 0) {
      console.warn('Kraken API error:', response.data.error);
      return null;
    }
    
    const ticker = response.data.result?.MOONUSD;
    if (!ticker) {
      console.warn('No MOONUSD data from Kraken');
      return null;
    }
    
    // c = last trade closed [price, lot volume]
    // v = volume [today, last 24 hours]
    const price = parseFloat(ticker.c[0]);
    const volume24h = parseFloat(ticker.v[1]) * price; // Convert to USD volume
    
    return { usd: price, volume24h };
  } catch (error: any) {
    console.error('Error fetching from Kraken:', error.message);
    return null;
  }
}

/**
 * Get ETH price in USD from Kraken
 */
async function getEthPrice(): Promise<number> {
  try {
    const response = await axios.get('https://api.kraken.com/0/public/Ticker?pair=ETHUSD', {
      timeout: 10000
    });
    
    const ticker = response.data.result?.XETHZUSD;
    if (ticker) {
      return parseFloat(ticker.c[0]);
    }
  } catch (error) {
    console.error('Error fetching ETH price from Kraken');
  }
  
  // Fallback to a reasonable estimate
  return 3500;
}

/**
 * Calculate MOON price from SushiSwap V2 pool reserves
 */
async function getPriceFromPool(): Promise<number | null> {
  try {
    const reserves = await novaClient.readContract({
      address: SUSHI_POOL_NOVA as `0x${string}`,
      abi: RESERVES_ABI,
      functionName: 'getReserves'
    }) as [bigint, bigint, number];
    
    const reserve0 = Number(reserves[0]) / 1e18; // MOON
    const reserve1 = Number(reserves[1]) / 1e18; // ETH
    
    if (reserve0 === 0) return null;
    
    const priceInEth = reserve1 / reserve0;
    const ethPrice = await getEthPrice();
    
    return priceInEth * ethPrice;
  } catch (error) {
    console.error('Error calculating price from pool');
    return null;
  }
}

/**
 * Fetch total supply from all Moon contracts
 */
async function getTotalSupply(): Promise<number> {
  try {
    const [novaTotalBigInt, oneTotalBigInt, ethTotalBigInt] = await Promise.all([
      novaClient.readContract({
        address: MOON_CONTRACTS.arbitrumNova as `0x${string}`,
        abi: TOTAL_SUPPLY_ABI,
        functionName: 'totalSupply'
      }).catch(() => 0n),
      oneClient.readContract({
        address: MOON_CONTRACTS.arbitrumOne as `0x${string}`,
        abi: TOTAL_SUPPLY_ABI,
        functionName: 'totalSupply'
      }).catch(() => 0n),
      ethClient.readContract({
        address: MOON_CONTRACTS.ethereum as `0x${string}`,
        abi: TOTAL_SUPPLY_ABI,
        functionName: 'totalSupply'
      }).catch(() => 0n)
    ]);
    
    const novaSupply = Number(novaTotalBigInt) / 1e18;
    const oneSupply = Number(oneTotalBigInt) / 1e18;
    const ethSupply = Number(ethTotalBigInt) / 1e18;
    
    // Note: These are the same token bridged, not additive
    // The majority of supply is on Nova, use that as primary
    // But we should also account for burned supply tracking
    console.log(`   Supply on Nova: ${novaSupply.toLocaleString()}`);
    console.log(`   Supply on Arb One: ${oneSupply.toLocaleString()}`);
    console.log(`   Supply on Eth: ${ethSupply.toLocaleString()}`);
    
    // Return the max (most accurate total circulating)
    return Math.max(novaSupply, oneSupply, ethSupply);
  } catch (error) {
    console.error('Error fetching total supply');
    return 0;
  }
}

/**
 * Fallback to CoinGecko if other sources fail
 */
async function getPriceFromCoinGecko(): Promise<{ usd: number; volume24h: number; change24h: number; marketCap: number } | null> {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const headers: any = {};
    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey;
    }
    
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=moon&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true',
      { headers, timeout: 10000 }
    );
    
    const data = response.data.moon;
    if (data) {
      return {
        usd: data.usd,
        volume24h: data.usd_24h_vol,
        change24h: data.usd_24h_change,
        marketCap: data.usd_market_cap
      };
    }
  } catch (error: any) {
    // Rate limited or error - fail silently
    console.warn('CoinGecko unavailable:', error.message);
  }
  return null;
}

/**
 * Get 24h price change from our database
 */
async function get24hChange(): Promise<number | null> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldStat = await prisma.marketStat.findFirst({
      where: { timestamp: { lte: oneDayAgo } },
      orderBy: { timestamp: 'desc' },
      select: { priceUsd: true }
    });
    
    if (oldStat && oldStat.priceUsd > 0) {
      const latestStat = await prisma.marketStat.findFirst({
        orderBy: { timestamp: 'desc' },
        select: { priceUsd: true }
      });
      
      if (latestStat) {
        return ((latestStat.priceUsd - oldStat.priceUsd) / oldStat.priceUsd) * 100;
      }
    }
  } catch (error) {
    // Ignore
  }
  return null;
}

/**
 * Main function to fetch market data using multiple sources
 * Priority: Kraken (free) -> Pool calculation -> CoinGecko (fallback)
 */
export async function fetchMarketData(): Promise<MarketData | null> {
  console.log('Fetching MOON market data...');
  
  let priceUsd: number | null = null;
  let volume24h: number | null = null;
  let change24h: number | null = null;
  let source = 'unknown';
  
  // 1. Try Kraken first (free, no API key)
  const krakenData = await getPriceFromKraken();
  if (krakenData && krakenData.usd > 0) {
    priceUsd = krakenData.usd;
    volume24h = krakenData.volume24h;
    source = 'kraken';
    console.log(`   ✅ Price from Kraken: $${priceUsd.toFixed(6)}`);
  }
  
  // 2. If Kraken failed, try pool calculation
  if (!priceUsd) {
    const poolPrice = await getPriceFromPool();
    if (poolPrice && poolPrice > 0) {
      priceUsd = poolPrice;
      source = 'pool';
      console.log(`   ✅ Price from Pool: $${priceUsd.toFixed(6)}`);
    }
  }
  
  // 3. Last resort: CoinGecko
  if (!priceUsd) {
    const cgData = await getPriceFromCoinGecko();
    if (cgData) {
      priceUsd = cgData.usd;
      volume24h = cgData.volume24h;
      change24h = cgData.change24h;
      source = 'coingecko';
      console.log(`   ✅ Price from CoinGecko: $${priceUsd.toFixed(6)}`);
    }
  }
  
  if (!priceUsd) {
    console.error('   ❌ Failed to get price from any source');
    return null;
  }
  
  // Get total supply from chain
  const totalSupply = await getTotalSupply();
  const marketCap = priceUsd * totalSupply;
  
  // Get 24h change from our own data if not from CoinGecko
  if (change24h === null) {
    change24h = await get24hChange();
  }
  
  // Get ETH price for reference
  const ethPrice = await getEthPrice();
  const priceEth = priceUsd / ethPrice;
  
  console.log(`   Market Cap: $${marketCap.toLocaleString()}`);
  console.log(`   Source: ${source}`);
  
  return {
    priceUsd,
    priceEth,
    totalSupply,
    marketCap,
    volume24h,
    change24h,
    source
  };
}

/**
 * Fetch and save market data to database
 */
export async function updateMarketData(): Promise<void> {
  const data = await fetchMarketData();
  
  if (!data) {
    console.error('Failed to fetch market data');
    return;
  }
  
  // Fetch Reddit stats
  let redditSubscribers = 0;
  let activeUsers = 0;
  
  try {
    const redditResponse = await axios.get('https://www.reddit.com/r/CryptoCurrency/about.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MoonBot/1.0)'
      },
      timeout: 10000
    });
    const redditData = redditResponse.data.data;
    redditSubscribers = redditData.subscribers || 0;
    activeUsers = redditData.active_user_count || 0;
  } catch (error) {
    console.warn('Failed to fetch Reddit stats');
  }
  
  // Save to database
  await prisma.marketStat.create({
    data: {
      priceUsd: data.priceUsd,
      marketCap: data.marketCap,
      volume24h: data.volume24h || 0,
      change24h: data.change24h || 0,
      redditSubscribers,
      activeUsers
    }
  });
  
  console.log(`✅ Market data saved: $${data.priceUsd.toFixed(6)} | MCap: $${data.marketCap.toLocaleString()}`);
}
