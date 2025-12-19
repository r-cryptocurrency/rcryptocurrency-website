
import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';

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

const client = createPublicClient({
  chain: arbitrumNova,
  transport: http("https://nova.arbitrum.io/rpc")
});

const OLD_KRAKEN_ADDRESSES = [
  '0x964409310371a594494ec8ef84581bc3473188c9', // The source
  '0xC06f25517E906b7F9B4deC3C7889503Bb00b3370', // Recipient 1 (Typo in CSV?)
  '0x22af984f13dfb5c80145e3f9ae1050ae5a5fb651', // Recipient 2
  '0x83276edce73dCde1AA4997dCaA3a9b9336dae248'  // Recipient 3 (Rank 4)
];

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
);

async function traceAddress(address: string) {
  console.log(`\nTracing transfers FROM ${address}...`);
  
  try {
    // Look back 50M blocks (approx 1 year on Nova)
    const currentBlock = await client.getBlockNumber();
    const fromBlock = currentBlock - 50000000n; 

    const logs = await client.getLogs({
      address: MOON_CONTRACTS.arbitrumNova as `0x${string}`,
      event: TRANSFER_EVENT,
      args: { from: address as `0x${string}` },
      fromBlock: fromBlock > 0n ? fromBlock : 0n,
      toBlock: 'latest' as const
    });

    console.log(`Found ${logs.length} outgoing transfers.`);

    // Sort by value descending to find the "big move"
    const sortedLogs = logs.sort((a, b) => {
      const valA = a.args.value || 0n;
      const valB = b.args.value || 0n;
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    });

    for (const log of sortedLogs) {
      const amount = formatUnits(log.args.value || 0n, 18);
      if (Number(amount) > 100000) { // Only show > 100k
         console.log(`-> Sent ${amount} MOON to ${log.args.to} at block ${log.blockNumber}`);
      }
    }

  } catch (e) {
    console.error(`Error tracing ${address}:`, e);
  }
}

async function main() {
  for (const addr of OLD_KRAKEN_ADDRESSES) {
    await traceAddress(addr);
  }
}

main();
