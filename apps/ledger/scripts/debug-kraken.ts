
import { createPublicClient, http, parseAbiItem } from 'viem';
import { arbitrum } from 'viem/chains';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';

const BALANCE_ABI = parseAbiItem('function balanceOf(address owner) view returns (uint256)');

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

const novaClient = createPublicClient({
  chain: arbitrumNova,
  transport: http("https://nova.arbitrum.io/rpc") 
});

const oneClient = createPublicClient({
  chain: arbitrum,
  transport: http("https://arb1.arbitrum.io/rpc")
});

async function checkBalance(address: string) {
  console.log(`Checking balance for ${address}...`);
  
  try {
    const novaBal = await novaClient.readContract({
      address: MOON_CONTRACTS.arbitrumNova as `0x${string}`,
      abi: [BALANCE_ABI],
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });
    console.log(`Nova Balance: ${Number(novaBal) / 1e18}`);
  } catch (e) {
    console.error('Nova Error:', e);
  }

  try {
    const oneBal = await oneClient.readContract({
      address: MOON_CONTRACTS.arbitrumOne as `0x${string}`,
      abi: [BALANCE_ABI],
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });
    console.log(`One Balance: ${Number(oneBal) / 1e18}`);
  } catch (e) {
    console.error('One Error:', e);
  }
}

// Kraken addresses from csv
const addresses = [
  '0xc06f25517a906b7f9b4dec3c7889503bb00b3370',
  '0x22af984f13dfb5c80145e3f9ae1050ae5a5fb651',
  '0x964409310371a594494ec8ef84581bc3473188c9'
];

async function main() {
  for (const addr of addresses) {
    await checkBalance(addr);
  }
}

main();
