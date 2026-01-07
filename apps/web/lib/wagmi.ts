import { http, createConfig } from 'wagmi';
import { arbitrum, polygon } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Arbitrum One is the primary chain for MOON distributions
// Polygon is available for potential POL rewards
export const config = createConfig({
  chains: [arbitrum, polygon],
  connectors: [
    injected(), // Supports MetaMask, Coinbase Wallet, Brave, etc.
  ],
  transports: {
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [polygon.id]: http('https://polygon-rpc.com'),
  },
  ssr: true,
});
