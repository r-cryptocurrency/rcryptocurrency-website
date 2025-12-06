import { createPublicClient, http, parseAbiItem, Log, fallback } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import { prisma } from '@rcryptocurrency/database';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Debug Prisma
if (!prisma) {
  console.error('CRITICAL: Prisma client is undefined in ledger!');
} else {
  console.log('Prisma client successfully loaded in ledger.');
}

// Load .env from project root
// In dev (ts-node): __dirname is src. Root is ../../../
// In prod (dist): __dirname is dist/src. Root is ../../../../
const envPath = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, '../../../../.env')
  : path.resolve(__dirname, '../../../.env');

dotenv.config({ path: envPath });

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
} as const;

// Initialize Clients with specific RPCs

// Nova
const novaTransports = [];
if (process.env.RPC_URL_NOVA) novaTransports.push(http(process.env.RPC_URL_NOVA));
if (process.env.ALCHEMY_URL_NOVA) novaTransports.push(http(process.env.ALCHEMY_URL_NOVA));
if (process.env.QUICKNODE_URL_NOVA) novaTransports.push(http(process.env.QUICKNODE_URL_NOVA));
novaTransports.push(http("https://nova.arbitrum.io/rpc"));

const novaClient = createPublicClient({
  chain: arbitrumNova,
  transport: fallback(novaTransports) 
});

// One
const oneTransports = [];
if (process.env.RPC_URL_ONE) oneTransports.push(http(process.env.RPC_URL_ONE));
if (process.env.ALCHEMY_URL_ONE) oneTransports.push(http(process.env.ALCHEMY_URL_ONE));
if (process.env.QUICKNODE_URL_ONE) oneTransports.push(http(process.env.QUICKNODE_URL_ONE));
if (process.env.INFURA_API_KEY) oneTransports.push(http(`https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`));
oneTransports.push(http("https://arb1.arbitrum.io/rpc"));

const oneClient = createPublicClient({
  chain: arbitrum,
  transport: fallback(oneTransports)
});

// Eth
const ethTransports = [];
if (process.env.RPC_URL_ETH) ethTransports.push(http(process.env.RPC_URL_ETH));
if (process.env.ALCHEMY_URL_ETH) ethTransports.push(http(process.env.ALCHEMY_URL_ETH));
if (process.env.QUICKNODE_URL_ETH) ethTransports.push(http(process.env.QUICKNODE_URL_ETH));
if (process.env.INFURA_API_KEY) ethTransports.push(http(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`));
ethTransports.push(http("https://eth.llamarpc.com"));

const ethClient = createPublicClient({
  chain: mainnet,
  transport: fallback(ethTransports)
});

// ERC-20 Transfer Event Signature
const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
);

type ChainKey = 'balanceNova' | 'balanceOne' | 'balanceEth';

async function indexChain(client: any, contractAddress: string, chainKey: ChainKey) {
  console.log(`Starting indexer for ${chainKey}...`);

  // Subscribe to live events
  client.watchEvent({
    address: contractAddress as `0x${string}`,
    event: TRANSFER_EVENT,
    onLogs: async (logs: Log[]) => {
      for (const log of logs) {
        await processTransferLog(log, chainKey);
      }
    }
  });
}

async function processTransferLog(log: any, chainKey: ChainKey) {
  const { from, to, value } = log.args;
  
  if (!from || !to) return;

  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  // Update Last Active Timestamp immediately
  const now = new Date();
  
  // We optimize by marking these addresses as "dirty" and scheduling a full 
  // balance fetch, rather than doing math on the DB value. 
  // This is "Eventual Consistency" which is safer against reorgs.
  await updateBalanceFromRPC(fromLower, chainKey, now);
  await updateBalanceFromRPC(toLower, chainKey, now);
}

async function updateBalanceFromRPC(address: string, chainKey: ChainKey, lastActive?: Date) {
  let client;
  let contract;
  
  // Ensure address is lowercase for DB consistency
  address = address.toLowerCase();

  if (chainKey === 'balanceNova') {
    client = novaClient;
    contract = MOON_CONTRACTS.arbitrumNova;
  } else if (chainKey === 'balanceOne') {
    client = oneClient;
    contract = MOON_CONTRACTS.arbitrumOne;
  } else {
    client = ethClient;
    contract = MOON_CONTRACTS.ethereum;
  }

  try {
    const balance = await client.readContract({
      address: contract as `0x${string}`,
      abi: [parseAbiItem('function balanceOf(address) view returns (uint256)')],
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });
    
    const floatBalance = Number(balance) / 1e18;

    // Upsert into DB
    const updateData: any = { 
      [chainKey]: floatBalance,
      lastUpdated: new Date(),
    };

    if (lastActive) {
      updateData.lastTransferAt = lastActive;
    }
    
    await prisma.holder.upsert({
      where: { address: address },
      update: updateData,
      create: { 
        address: address, 
        [chainKey]: floatBalance,
        lastUpdated: new Date(),
        lastTransferAt: lastActive
      }
    });

    // Recalculate Total
    await updateHolderTotal(address);

  } catch (e) {
    console.error(`Failed to fetch balance for ${address} on ${chainKey}`, e);
  }
}

// Logic to sum balances across columns
async function updateHolderTotal(address: string) {
  const holder = await prisma.holder.findUnique({ where: { address } });
  if (!holder) return;
  const total = holder.balanceNova + holder.balanceOne + holder.balanceEth;
  await prisma.holder.update({
    where: { address },
    data: { totalBalance: total }
  });
}

// Start Indexers
indexChain(novaClient, MOON_CONTRACTS.arbitrumNova, 'balanceNova');
indexChain(oneClient, MOON_CONTRACTS.arbitrumOne, 'balanceOne');
indexChain(ethClient, MOON_CONTRACTS.ethereum, 'balanceEth');
