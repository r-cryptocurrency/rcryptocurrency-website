# Server Update Instructions (Post-Migration & Security Audit)

This file tracks the commands and steps required to update the production server following the major security upgrade (TS 5.4.5, Viem 2.x, Prisma 5) and the rollout of the decentralized MOON distribution system.

## ⚠️ CRITICAL: Karma Count Bug Fix (January 6, 2026)

### Updated: January 6, 2026

Fixed a bug where post/comment counts were not being tracked correctly on the leaderboard. The issue was that counts were only incremented when a post/comment was first seen in the database, but not tracked per-round. This caused users to show karma but 0 counts after round transitions.

**What changed:**
- Added `karmaCountedRound` field to `RedditPost` and `RedditComment` tables
- Updated scraper to track which round each post/comment has been counted for
- Counts now correctly increment once per round, per post/comment

**To deploy this fix:**

```bash
# 1. Force pull (discard local lockfile changes)
git fetch origin
git reset --hard origin/master

# 2. Install dependencies
pnpm install

# 3. Regenerate Prisma Client (picks up new karmaCountedRound field)
pnpm --filter @rcryptocurrency/database db:generate

# 4. Apply schema changes to database
pnpm --filter @rcryptocurrency/database db:push

# 5. Fix Round 71 data (recalculates counts from actual posts/comments)
pnpm --filter scraper recalc-karma 71

# 6. Rebuild everything
pnpm build

# 7. Restart services
pm2 reload ecosystem.config.js
```

---

## ⚠️ Security & Core Dependencies (January 5, 2026)

### Updated: January 5, 2026

We have patched 28 vulnerabilities and upgraded the entire codebase to TypeScript 5.4.5. You **must** perform a clean install and rebuild.

```bash
# 1. Clear any old lockfile state (on server)
rm pnpm-lock.yaml

# 2. Force update dependencies and apply security overrides
pnpm install

# 3. Regenerate Prisma Client (v5.21.1)
pnpm --filter @rcryptocurrency/database db:generate
```

---

## Phase 1: Database Migration

### Updated: January 5, 2026

Run the following commands to apply the new schema models (`UserAddressLink`, `DistributionRound`, `DistributionClaim`, and karma tracking fields) and update the `RedditUser` model to accommodate the new distribution system.

```bash
# Navigate to the root of the project
cd /home/jw/src/rcryptocurrency-site

# Apply the schema changes (Non-destructive update)
# Note: Using db:push is recommended for the initial rollout phase
pnpm --filter @rcryptocurrency/database db:push
```

---

## Phase 2: Build & Verification

Due to the strict TypeScript 5.4.5 upgrade and module resolution changes, the server **must** run a full build to ensure all type-check constraints are met.

```bash
# Run a full monorepo build (will build packages/database, web, oracle, ledger, etc.)
pnpm build
```

If the build fails with "BigInt literals" errors, ensure the server's Node.js version is at least **v18.0.0** (Recommended: **v20+**).

---

## Phase 3: Service Restart (PM2)

After a successful build, you must reload the background services to pick up the new dependency versions and compiled code.

```bash
# Reload all applications defined in the ecosystem config
pm2 reload ecosystem.config.js

# Verify all services are online
pm2 list
```

---

## Phase 4: Redistribution & Merkle Pipeline

To run a distribution round with the new pipeline:

1. **Recalculate Karma**:
   ```bash
   pnpm --filter scraper run export-karma
   ```

2. **Generate Merkle Root & Claims**:
   ```bash
   pnpm --filter scraper run generate-merkle
   ```

3. **Ingest Proofs to Database**:
   ```bash
   pnpm --filter ledger run ingest-csv
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
