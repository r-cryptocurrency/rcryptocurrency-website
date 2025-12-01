import { createPublicClient, http, fallback } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';
import { 
  MOON_CONTRACTS, 
  POOLS, 
  NOTIFICATION_THRESHOLD, 
  CHANNEL_ID 
} from './config';
import { ChainMonitor } from './chain-monitor';
import { setupBurnWatcher, setupSwapWatcher } from './watchers';

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

export async function main() {
  console.log(`🔥 Starting Moon Monitor (Burns & Swaps)...`);
  console.log(`📢 Notifications > ${NOTIFICATION_THRESHOLD} MOONs to ${CHANNEL_ID}`);

  // --- Arbitrum Nova ---
  // Strategy: Free RPC -> Alchemy -> QuickNode -> Public RPC
  const novaTransports = [];
  if (process.env.RPC_URL_NOVA) {
      novaTransports.push(http(process.env.RPC_URL_NOVA));
  }
  if (process.env.ALCHEMY_URL_NOVA) {
      novaTransports.push(http(process.env.ALCHEMY_URL_NOVA));
  }
  if (process.env.QUICKNODE_URL_NOVA) {
      novaTransports.push(http(process.env.QUICKNODE_URL_NOVA));
  }
  novaTransports.push(http("https://nova.arbitrum.io/rpc"));

  const novaClient = createPublicClient({
    chain: arbitrumNova,
    transport: fallback(novaTransports),
  });
  // QuickNode Free Tier: 5 block range limit.
  const novaMonitor = new ChainMonitor('Arbitrum Nova', novaClient, 20000, 5n);
  setupBurnWatcher(novaMonitor, MOON_CONTRACTS.arbitrumNova, 'https://nova.arbiscan.io');
  setupSwapWatcher(novaMonitor, POOLS.NOVA_SUSHI_V2, 'https://nova.arbiscan.io');
  novaMonitor.start();

  // --- Arbitrum One ---
  // Strategy: Free RPC -> Alchemy -> QuickNode -> Infura -> Public RPC
  const oneTransports = [];
  if (process.env.RPC_URL_ONE) {
      oneTransports.push(http(process.env.RPC_URL_ONE));
  }
  if (process.env.ALCHEMY_URL_ONE) {
      oneTransports.push(http(process.env.ALCHEMY_URL_ONE));
  }
  if (process.env.QUICKNODE_URL_ONE) {
      oneTransports.push(http(process.env.QUICKNODE_URL_ONE));
  }
  if (process.env.INFURA_API_KEY) {
      oneTransports.push(http(`https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`));
  }
  oneTransports.push(http("https://arb1.arbitrum.io/rpc"));

  const oneClient = createPublicClient({
    chain: arbitrum,
    transport: fallback(oneTransports),
  });
  // Use conservative block range (100) to be safe with free tiers
  const oneMonitor = new ChainMonitor('Arbitrum One', oneClient, 20000, 100n);
  setupBurnWatcher(oneMonitor, MOON_CONTRACTS.arbitrumOne, 'https://arbiscan.io');
  setupSwapWatcher(oneMonitor, POOLS.ONE_CAMELOT_V3, 'https://arbiscan.io');
  setupSwapWatcher(oneMonitor, POOLS.ONE_UNI_V3, 'https://arbiscan.io');
  setupSwapWatcher(oneMonitor, POOLS.ONE_POOL_MANAGER, 'https://arbiscan.io');
  oneMonitor.start();

  // --- Ethereum Mainnet ---
  // Strategy: Free RPC -> Alchemy -> QuickNode -> Infura -> Public RPC
  const ethTransports = [];
  if (process.env.RPC_URL_ETH) {
      ethTransports.push(http(process.env.RPC_URL_ETH));
  }
  if (process.env.ALCHEMY_URL_ETH) {
      ethTransports.push(http(process.env.ALCHEMY_URL_ETH));
  }
  if (process.env.QUICKNODE_URL_ETH) {
      ethTransports.push(http(process.env.QUICKNODE_URL_ETH));
  }
  if (process.env.INFURA_API_KEY) {
      ethTransports.push(http(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`));
  }
  ethTransports.push(http("https://eth.llamarpc.com"));

  const ethClient = createPublicClient({
    chain: mainnet,
    transport: fallback(ethTransports),
  });
  const ethMonitor = new ChainMonitor('Ethereum', ethClient, 60000, 100n);
  setupBurnWatcher(ethMonitor, MOON_CONTRACTS.ethereum, 'https://etherscan.io');
  ethMonitor.start();
  
  // Keep process alive
  process.stdin.resume();
}
