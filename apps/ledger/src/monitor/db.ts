import { PrismaClient } from '@rcryptocurrency/database';
import { createPublicClient, http, fallback } from 'viem';
import { mainnet } from 'viem/chains';

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Setup Mainnet Client for ENS Resolution
const ethTransports = [];
if (process.env.INFURA_API_KEY) {
    ethTransports.push(http(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`));
}
if (process.env.RPC_URL_ETH) {
    ethTransports.push(http(process.env.RPC_URL_ETH));
}
ethTransports.push(http("https://eth.llamarpc.com"));

const ensClient = createPublicClient({
  chain: mainnet,
  transport: fallback(ethTransports),
});

export async function resolveAddress(address: string): Promise<string> {
  if (!address) return 'Unknown';
  const lowerAddr = address.toLowerCase();
  
  try {
    const holder = await prisma.holder.findUnique({
      where: { address: lowerAddr }
    });

    if (holder) {
      if (holder.username) {
        return holder.username.startsWith('u/') ? holder.username : `u/${holder.username}`;
      }
      if (holder.label) return holder.label;
    }
    
    // Fallback: Check ENS
    try {
        const ensName = await ensClient.getEnsName({ address: address as `0x${string}` });
        if (ensName) {
            // Save to DB so Richlist can display it without re-fetching
            await prisma.holder.upsert({
                where: { address: lowerAddr },
                update: { label: ensName },
                create: { address: lowerAddr, label: ensName }
            });
            return ensName;
        }
    } catch (e) {
        // Ignore ENS resolution errors (e.g. network issues)
    }

  } catch (e) {
    console.error(`Error resolving address ${address}:`, e);
  }

  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
