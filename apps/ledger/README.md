# Ledger Indexer (`apps/ledger`)

A blockchain indexer built with `viem` to track MOON token transfers across multiple chains.

## Supported Chains
- **Arbitrum Nova** (Primary MOON chain): `0x0057ac2d777797d31cd3f8f13bf5e927571d6ad0`
- **Arbitrum One** (Bridged MOONs via Celer): `0x24404dc041d74cd03cfe28855f555559390c931b`
- **Ethereum Mainnet** (L1 MOONs): `0xb2490e357980ce57bf5745e181e537a64eb367b1`

## How it Works
1.  Connects to RPC endpoints for each chain.
2.  Listens for `Transfer` events on the MOON contract addresses.
3.  Updates the `Holder` table in the shared SQLite database.
4.  Aggregates balances to calculate a `totalBalance` for the Richlist.

## Database Schema

The Ledger app primarily interacts with the `Holder` table in the shared SQLite database.

### `Holder` Table
| Column | Type | Description |
|--------|------|-------------|
| `address` | String (PK) | The blockchain address (lowercase). |
| `balanceNova` | Float | Balance on Arbitrum Nova. |
| `balanceOne` | Float | Balance on Arbitrum One. |
| `balanceEth` | Float | Balance on Ethereum Mainnet. |
| `totalBalance` | Float | Sum of all balances (used for sorting). |
| `lastTransferAt` | DateTime? | Timestamp of the last outgoing/incoming transfer. |
| `hasOutgoing` | Boolean | True if the address has ever sent tokens. |
| `label` | String? | Optional label (e.g., "Kraken", "Bridge"). |
| `username` | String? | Linked Reddit username (from historical data). |
| `lastUpdated` | DateTime | When the record was last modified. |

## Configuration
Create a `.env` file if you need custom RPCs (copy from `.env.example`):

```env
RPC_URL_NOVA=https://nova.arbitrum.io/rpc
RPC_URL_ONE=https://arb1.arbitrum.io/rpc
RPC_URL_ETH=https://eth.llamarpc.com
```

## Development

```bash
pnpm dev --filter=ledger
```

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

