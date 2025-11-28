import { createPublicClient, http, parseAbiItem, Log } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import { prisma } from '@rcryptocurrency/database';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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
const novaClient = createPublicClient({
  chain: arbitrumNova,
  transport: http(process.env.RPC_URL_NOVA || "https://nova.arbitrum.io/rpc") 
});

const oneClient = createPublicClient({
  chain: arbitrum,
  transport: http(process.env.RPC_URL_ONE || "https://arb1.arbitrum.io/rpc")
});

const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL_ETH || "https://rpc.ankr.com/eth")
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

  // We optimize by marking these addresses as "dirty" and scheduling a full 
  // balance fetch, rather than doing math on the DB value. 
  // This is "Eventual Consistency" which is safer against reorgs.
  await updateBalanceFromRPC(from, chainKey);
  await updateBalanceFromRPC(to, chainKey);
}

async function updateBalanceFromRPC(address: string, chainKey: ChainKey) {
  let client;
  let contract;

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
    const updateData = { [chainKey]: floatBalance };
    
    await prisma.holder.upsert({
      where: { address: address },
      update: updateData,
      create: { 
        address: address, 
        [chainKey]: floatBalance 
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
