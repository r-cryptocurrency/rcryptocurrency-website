# Decentralized MOON Distribution System

**Status:** Implementation Complete - Awaiting Contract Deployment
**Updated:** January 6, 2026

---

## Overview

Users link their Reddit account to an Ethereum address via `/link` page, then claim MOON rewards on `/claim` page. Distribution uses Merkle trees for gas-efficient claims on Arbitrum One.

**Flow:**
1. User links Reddit → ETH address (one-time verification via r/CryptoCurrencyMoons comment)
2. Admin generates Merkle tree from karma data + linked addresses
3. Admin deploys distribution round to MoonDistributor contract
4. Users claim their MOONs on the claim page

---

## Pre-Deployment Setup

### 1. Deploy MoonDistributor Contract

```bash
cd packages/chain-data

# Set deployer private key in .env
# DEPLOYER_PRIVATE_KEY=0x...

# Deploy to Arbitrum One
pnpm deploy:one
```

### 2. Update Contract Address

After deployment, update [packages/chain-data/src/addresses.ts](packages/chain-data/src/addresses.ts):

```typescript
export const DISTRIBUTOR_CONTRACTS = {
  arbitrumOne: "0x...", // Replace with deployed address
} as const;
```

Then rebuild:
```bash
pnpm build
pm2 restart web
```

---

## Running a Distribution Round

### Step 1: Generate Merkle Tree

```bash
cd apps/scraper

# Generate for round 70 with 1 MOON per karma point
pnpm tsx scripts/generate-merkle.ts 70 1

# Or with different ratio (0.5 MOON per karma)
pnpm tsx scripts/generate-merkle.ts 70 0.5
```

This creates files in `data/distributions/`:
- `round-{id}-claims.json` - Claim data with proofs (used by API)
- `round-{id}-summary.json` - Round metadata
- `round-{id}-tree.json` - Full tree for verification

### Step 2: Fund & Create Distribution on Contract

1. Approve MoonDistributor to spend MOON tokens
2. Call `createDistribution()` with:
   - `roundId`: Karma round ID
   - `merkleRoot`: From summary.json
   - `token`: MOON contract address (`0x24404DC041d74cd03cFE28855F555559390C931b`)
   - `totalAmount`: From summary.json
   - `durationDays`: Claim window (e.g., 90 days)

### Step 3: Create Database Round Record

```sql
INSERT INTO "DistributionRound" (id, "merkleRoot", "totalAmount", "tokenAddress", "chainId", "contractAddress", "isActive", "expirationDate")
VALUES (
  70,
  '0x...merkleRoot',
  '1000000000000000000000',
  '0x24404DC041d74cd03cFE28855F555559390C931b',
  42161,
  '0x...distributorAddress',
  true,
  NOW() + INTERVAL '90 days'
);
```

### Step 4: Verify

- Users can now claim at `/claim`
- Claims page fetches from `/api/claims/{address}` which reads the claims JSON

---

## Sweeping Unclaimed Tokens

After a round expires, recover unclaimed tokens:

```solidity
// Call on MoonDistributor contract
distributor.sweep(roundId)
```

---

## Adding POL (Polygon) Rewards

The wagmi config already includes Polygon. To add POL distributions:

1. **Deploy a new distributor on Polygon** (or modify existing contract for multi-token)
2. **Update addresses.ts** with Polygon distributor address
3. **Generate separate Merkle tree** for POL rewards
4. **Update claim page** to handle multiple tokens/chains (currently hardcoded to Arbitrum One)

Consider creating a separate `/claim-pol` page or adding token selection to existing claim page.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `apps/web/app/link/page.tsx` | Reddit → ETH linking UI |
| `apps/web/app/claim/page.tsx` | Claim rewards UI |
| `apps/web/app/api/verify-link/route.ts` | Verify Reddit comment ownership |
| `apps/web/app/api/claims/[address]/route.ts` | Get eligible claims for address |
| `apps/scraper/scripts/generate-merkle.ts` | Build Merkle tree from karma data |
| `packages/chain-data/contracts/MoonDistributor.sol` | Distribution contract |
| `packages/chain-data/src/addresses.ts` | Contract addresses |
| `data/distributions/` | Generated claim JSONs |

---

## Contract Addresses

| Contract | Chain | Address |
|----------|-------|---------|
| MOON Token | Arbitrum One | `0x24404DC041d74cd03cFE28855F555559390C931b` |
| MoonDistributor | Arbitrum One | `TODO: Deploy and update` |
| MOON Token | Arbitrum Nova (legacy) | `0x0057Ac2d777797d31CD3f8f13bF5e927571D6Ad0` |
