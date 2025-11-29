import { PrismaClient } from '@rcryptocurrency/database';

// Initialize Prisma Client
export const prisma = new PrismaClient();

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
    } else {
        // Debugging: Log if address not found, might help trace why 'jwinterm' wasn't found
        // console.log(`[Resolve] Address ${lowerAddr} not found in DB.`);
    }
  } catch (e) {
    console.error(`Error resolving address ${address}:`, e);
  }

  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
