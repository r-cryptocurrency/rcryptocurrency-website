import { http, createConfig } from 'wagmi';
import { arbitrumNova } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Custom Arbitrum Nova chain with public RPC
const arbitrumNovaCustom = {
  ...arbitrumNova,
  rpcUrls: {
    default: { http: ['https://nova.arbitrum.io/rpc'] },
  },
} as const;

export const config = createConfig({
  chains: [arbitrumNovaCustom],
  connectors: [
    injected(), // Supports MetaMask, Coinbase Wallet, Brave, etc.
  ],
  transports: {
    [arbitrumNovaCustom.id]: http('https://nova.arbitrum.io/rpc'),
  },
  ssr: true,
});
