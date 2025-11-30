# Chain Data (`packages/chain-data`)

This package contains shared blockchain constants, contract addresses, and ABIs used across the r/CryptoCurrency ecosystem.

## Contents

### Addresses (`src/addresses.ts`)
Exports constant objects for contract addresses on various chains.

*   `MOON_CONTRACTS`: MOON token addresses on Arbitrum Nova, Arbitrum One, and Ethereum.
*   `BRIDGE_CONTRACTS`: Celer bridge contracts.
*   `LIQUIDITY_POOLS`: Addresses for DEX pools (SushiSwap, Camelot, Uniswap V3/V4).

### ABIs (`src/abis/`)
Exports TypeScript-typed ABIs for interacting with smart contracts.

*   `ERC20_ABI`: Standard ERC-20 interface.

## Usage

```typescript
import { MOON_CONTRACTS, ERC20_ABI } from '@rcryptocurrency/chain-data';

const moonAddress = MOON_CONTRACTS.arbitrumNova;
// Use with viem or ethers
```
