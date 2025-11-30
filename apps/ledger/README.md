# Ledger Indexer (`apps/ledger`)

A blockchain indexer built with `viem` to track MOON token transfers across multiple chains.

## Supported Chains
- **Arbitrum Nova** (Primary MOON chain): `0x0057ac2d777797d31cd3f8f13bf5e927571d6ad0`
- **Arbitrum One** (Bridged MOONs via Celer): `0x24404dc041d74cd03cfe28855f555559390c931b`
- **Ethereum Mainnet** (L1 MOONs): `0xb2490e357980ce57bf5745e181e537a64eb367b1`

## Configuration

Configuration is handled via the **root** `.env` file.
*   **RPC URLs**: `RPC_URL_NOVA`, `RPC_URL_ONE`, `RPC_URL_ETH`
*   **Telegram**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID` (for Monitor)
*   **Monitoring**: `MOON_NOTIFICATION_THRESHOLD` (Minimum MOON amount to trigger a notification)

## Monitored Contracts

### Tokens
- **Arbitrum Nova**: `0x0057ac2d777797d31cd3f8f13bf5e927571d6ad0`
- **Arbitrum One**: `0x24404dc041d74cd03cfe28855f555559390c931b`
- **Ethereum Mainnet**: `0xb2490e357980ce57bf5745e181e537a64eb367b1`

### DEX Pools (Arbitrum One)
The `monitor-moons` script watches these pools for large swaps:
*   **Camelot V3**: `0x5e27a422ec06a57567a843fd65a1bbb06ac19fc0`
*   **Uniswap V3**: `0x285b461B3d233ab24C665E9FbAF5B96352E3ED07`
*   **Uniswap V4**:
    *   **Universal Router**: `0xA51afAFe0263b40EdaEf0Df8781eA9aa03E381a3`
    *   **PoolManager**: `0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32`
    *   **Pool (MOON/USDC)**: `0x065144c11d71d908594e6305b7ae834d00443374f87cc82692fbac8ed81af56a`
    *   **Pool (MOON/ETH)**: `0xa14aaa23a3b1ae4b0bdc031151c6814f1d06a901ffc5f8ab6951c75de2bc2c17`

### DEX Pools (Arbitrum Nova)
*   **SushiSwap V2**: `0xd6c821b282531868721b41badca1f1ce471f43c5`

## How it Works
1.  Connects to RPC endpoints for each chain.
2.  Listens for `Transfer` events on the MOON contract addresses.
3.  Updates the `Holder` table in the shared PostgreSQL database.
4.  Aggregates balances to calculate a `totalBalance` for the Richlist.
5.  **Monitor Script**: Listens for `Transfer` to the Burn address and `Swap` events on DEX pools, sending Telegram alerts and persisting events to the `Burn` and `Swap` tables.

## Database Schema

The Ledger app interacts with the following tables in the shared PostgreSQL database:

### `Holder` Table
| Column | Type | Description |
|--------|------|-------------|
| `address` | String (PK) | The blockchain address (lowercase). |
| `balanceNova` | Float | Balance on Arbitrum Nova. |
| `balanceOne` | Float | Balance on Arbitrum One. |
| `balanceEth` | Float | Balance on Ethereum Mainnet. |
| `totalBalance` | Float | Aggregate balance. |

### `Burn` Table
| Column | Type | Description |
|--------|------|-------------|
| `txHash` | String (Unique) | Transaction hash. |
| `amount` | Float | Amount of MOONs burned. |
| `chain` | String | Chain where burn occurred. |
| `sender` | String | Address that initiated the burn. |

### `Swap` Table
| Column | Type | Description |
|--------|------|-------------|
| `txHash` | String (Unique) | Transaction hash. |
| `dex` | String | DEX Name (e.g., "Uniswap V3"). |
| `amountIn` | Float | Amount of tokens sold. |
| `amountOut` | Float | Amount of tokens bought. |
| `tokenIn` | String | Symbol of token sold. |
| `tokenOut` | String | Symbol of token bought. |

## Scripts

### `monitor-moons`
The primary monitoring script.
```bash
pnpm monitor-moons
```
*   Watches for Burns on all chains.
*   Watches for Swaps on SushiSwap (Nova), Camelot (One), Uniswap V3 (One), and Uniswap V4 (One).
*   Sends Telegram alerts for events > `MOON_NOTIFICATION_THRESHOLD`.
*   Saves events to the database.

### `seed-labels`
Seeds known exchange and bridge addresses.
```bash
pnpm seed:labels
```

### `refresh-balances`
Manually refreshes balances for all holders in the database.
*   Fetches current balances from RPC for all known addresses.
*   **Activity Tracking**: Updates "Last Active" timestamps by scanning recent blocks (via QuickNode) and deep history (via Alchemy API).

```bash
pnpm refresh-balances
```

### `backfill-burns`
Scans historical blocks for burn events to populate the Burns page.
*   Scans Arbitrum Nova and Arbitrum One for transfers to the dead address.
*   Populates the `Burn` table with historical data.

```bash
pnpm --filter ledger exec ts-node scripts/backfill-burns.ts
```

### `calc-dormant-moons`
Calculates the total number of Moons held by Redditors who have never moved them.
*   Queries the database for users with a linked Reddit account and `hasOutgoing: false`.

```bash
pnpm --filter ledger exec ts-node scripts/calc-dormant-moons.ts
```

### `cleanup-duplicates`
Removes duplicate holder entries caused by case-sensitivity issues.
*   Scans for addresses that appear multiple times with different casing.
*   Merges data and keeps the "best" record (e.g., one with a username).

```bash
pnpm --filter ledger exec ts-node scripts/cleanup-duplicates.ts
```

### `ingest`
Parses the historical CSV file (`MoonDistributions.csv`) to map Reddit usernames to blockchain addresses.

```bash
pnpm ingest
```

## Recommended Setup Workflow


To completely rebuild the ledger from scratch:

1.  **Reset Database**:
    ```bash
    rm packages/database/prisma/dev.db
    pnpm db:push
    ```

2.  **Seed Labels**:
    ```bash
    pnpm --filter ledger seed:labels
    ```

3.  **Ingest User Mappings**:
    ```bash
    pnpm --filter ledger ingest
    ```

4.  **Sync Balances & History**:
    ```bash
    pnpm --filter ledger refresh-balances
    ```
    *Note: This step can take several hours as it scans millions of blocks on Arbitrum Nova.*

## Data Gathering Strategy

### 1. Initial Snapshot & Historical Data
We perform an initial "heavy lift" to establish a baseline state. This involves:
- **Token Balance Scanning**: Querying the `balanceOf` for all known holders at a specific block height.
- **Event Replay**: Fetching historical `Transfer` events to reconstruct past movements and identify active addresses.
- **CSV Ingestion**: Loading historical distribution data (e.g., Reddit Moon Distributions) to map Reddit usernames to blockchain addresses.

### 2. Real-time Indexing
Once the baseline is established, the indexer switches to "watch mode":
- **Event Listening**: Subscribes to `Transfer` events on all supported chains.
- **Incremental Updates**: When a transfer occurs, we update the balances of the `from` and `to` addresses immediately.
- **Cross-Chain Aggregation**: The `totalBalance` is recalculated whenever a balance changes on any single chain.

## Management

### Labeling Addresses
To tag an address (e.g., "Kraken", "Bridge", "Burn Address") so it appears labeled on the Richlist:

1.  Edit `seeds/known-addresses.csv`.
2.  Run the seed script:
    ```bash
    pnpm seed:labels
    ```

### Ingesting Historical Data
To map Reddit usernames to addresses using historical distribution CSVs:

```bash
pnpm ingest
```

### Refreshing Balances & Activity
To fetch the latest balances from all chains and update "Last Active" timestamps:

```bash
pnpm refresh-balances
```
*   **Note**: This script uses `multicall3` for efficiency but processes in batches to avoid SQLite timeouts.
*   **Activity Tracking**: It also scans the last ~100k blocks on Arbitrum Nova to determine if an address is active.

## Development
# Run from apps/ledger directory
pnpm label <address> "<label>"

# Example
pnpm label 0x000000000000000000000000000000000000dead "Burn Address"
```

### Bulk Labeling
You can seed a list of known addresses from a CSV file:

1. Edit `apps/ledger/seeds/known-addresses.csv`.
2. Run the seed script:
   ```bash
   pnpm seed:labels
   ```

Alternatively, you can use **Prisma Studio** to manually edit records:

```bash
pnpm db:studio
```

## Roadmap
- [ ] **LP Position Tracking**: Monitor liquidity provider positions on Camelot, SushiSwap, and Uniswap to track "hidden" MOON holdings in pools.
- [ ] **Whale Alerts**: Notification system for large transfers.
- [ ] **Historical Balance Charts**: Store daily snapshots for graphing user balance history.

