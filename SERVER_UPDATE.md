# Server Update Instructions

This file tracks the commands and steps required to update the production server as we roll out the decentralized MOON distribution system.

## Phase 1: Database Schema

### Updated: January 5, 2026

Run the following commands to apply the new schema models (`UserAddressLink`, `DistributionRound`, and `DistributionClaim`) and update the `RedditUser` model.

```bash
# Navigate to the root of the project
cd /home/jw/src/rcryptocurrency-site

# Apply the schema changes and update the Prisma client
pnpm --filter @rcryptocurrency/database db:push
```

---

## Phase 2: Web App Dependencies

### Updated: January 5, 2026

Install the new wallet connection and query libraries in the web application.

```bash
# Navigate to the web app directory
cd /home/jw/src/rcryptocurrency-site/apps/web

# Install dependencies
pnpm add wagmi@2 viem@2 @tanstack/react-query
```

---

## Phase 3: Schema Synchronization (Next.js)

The web application needs the latest Prisma schema to generate the client. The `web` package is configured to copy the schema from the central database package automatically during `dev` and `build` commands.

If you manualy need to sync for local development without running `dev`:
```bash
cp packages/database/prisma/schema.prisma apps/web/prisma/schema.prisma
```

---

## Phase 4: Smart Contract and Merkle Trees

### Updated: January 5, 2026

The distribution system uses Merkle trees for gas-efficient claiming. You'll need to generate these trees and deploy the distributor contract.

### Contract Deployment
Ensure your `.env` has `PRIVATE_KEY` and `RPC_URL_ARBITRUM_ONE`.

```bash
cd packages/chain-data
# Compile contracts (if needed)
pnpm compile

# Deploy to Arbitrum One
# npx hardhat run scripts/deploy-distributor.ts --network arbitrumOne
```

### Merkle Tree Generation
Run this periodically to generate the claims JSON files.

```bash
cd apps/scraper
# Install new dependencies
pnpm add @openzeppelin/merkle-tree

# Generate Merkle tree for a round (e.g. Round 70 at 1 MOON per Karma)
# Note: Ensure you have linked addresses in the database first
pnpm ts-node scripts/generate-merkle.ts 70 1
```

---

## Phase 5: Web App Updates

After deploying the contract, update the address in `packages/chain-data/src/addresses.ts`:

```typescript
export const DISTRIBUTOR_CONTRACTS = {
  arbitrumOne: "YOUR_NEWLY_DEPLOYED_CONTRACT_ADDRESS",
} as const;
```

Then rebuild the web app:

```bash
pnpm --filter web build
```
