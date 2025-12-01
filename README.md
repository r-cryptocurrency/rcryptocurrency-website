# r/CryptoCurrency Superrepo

This monorepo contains the complete ecosystem for the r/CryptoCurrency community platform. It consolidates the legacy website, a new blockchain indexer, a Reddit data scraper, and a unified dashboard into a single, high-performance workspace.

## 🏗 Architecture

The project is built as a **Monorepo** using [pnpm workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/). This ensures atomic versioning, shared configurations, and efficient build pipelines.

### 📂 Directory Structure

```
rcryptocurrency-site/
├── apps/
│   ├── web/              # Next.js 13 App Router (Frontend Dashboard) - [README](./apps/web/README.md)
│   ├── ledger/           # Node.js Blockchain Indexer (Viem) - [README](./apps/ledger/README.md)
│   ├── oracle/           # Node.js Data Ingestor (CoinGecko + Reddit Stats) - [README](./apps/oracle/README.md)
│   └── scraper/          # Node.js Reddit Scraper (Public JSON + NLP) - [README](./apps/scraper/README.md)
├── packages/
│   ├── chain-data/       # Shared Blockchain Constants (ABIs, Addresses)
│   ├── database/         # Shared Prisma Schema & Client (PostgreSQL) - [README](./packages/database/README.md)
│   ├── ui/               # Shared React Components (Tailwind/Tremor)
│   ├── tsconfig/         # Shared TypeScript Configs
│   └── eslint-config/    # Shared Linting Rules
├── legacy-site/          # Original HTML/CSS/JS site (Reference)
└── notes/                # Research notes and Python prototypes
```

---

## 🚀 Applications and Packages

### 1. Web Dashboard (`apps/web`)
*   **README**: [apps/web/README.md](./apps/web/README.md)
*   **Tech Stack**: Next.js 13, Tailwind CSS, Tremor, Next-Themes.
*   **Function**: The user-facing frontend. It replicates the legacy site's aesthetic while injecting real-time data from the database.
*   **Features**:
    *   **Dark Mode**: Fully responsive dark/light theme with persistent user preference.
    *   **Modern UI**: Glassmorphism effects, floaty background animations, and high-contrast data visualization.
    *   **Scraper Page**: Visualizes top mentioned projects and sentiment from r/CryptoCurrency.
    *   **Richlist**: Displays top MOON holders with support for address labels (e.g., "Kraken", "Bridge").
    *   **Market Stats**: Real-time MOON price, volume, market cap, and subreddit subscriber counts.
    *   **Timeline**: A history of the MOON token ecosystem.
    *   **Burns**: Real-time tracking of MOON burns across all chains.
    *   **Swaps**: Live feed of DEX swaps on Arbitrum One and Nova.
    *   **Advertise**: Information on advertising packages and contact details.

### 2. Ledger (`apps/ledger`)
*   **README**: [apps/ledger/README.md](./apps/ledger/README.md)
*   **Tech Stack**: Node.js, Viem.
*   **Function**: Indexes blockchain events for MOON tokens across Arbitrum Nova, Arbitrum One, and Ethereum Mainnet.
*   **Key Logic**:
    *   Listens for `Transfer` events.
    *   Updates user balances in the shared database.
    *   Handles cross-chain balance aggregation.
    *   **Monitor**: Real-time monitoring of Burns and Swaps (Uniswap V3/V4, Camelot, SushiSwap) with Telegram alerts.
    *   **Management**: Includes scripts to manually label addresses (e.g., Exchanges).

### 3. Oracle (`apps/oracle`)
*   **README**: [apps/oracle/README.md](./apps/oracle/README.md)
*   **Tech Stack**: Node.js, Axios, Cron.
*   **Function**: Fetches high-level stats.
    *   **CoinGecko**: MOON price, volume, market cap. (Supports API Key via `COINGECKO_API_KEY`)
    *   **Reddit API**: Subreddit subscriber count, active users.

### 4. Scraper (`apps/scraper`)
*   **README**: [apps/scraper/README.md](./apps/scraper/README.md)
*   **Tech Stack**: Node.js, Axios, Natural (NLP).
*   **Function**: Deep dives into subreddit content.
    *   **Public JSON API**: Scrapes `r/CryptoCurrency/new.json` without OAuth, using a custom User-Agent.
    *   **Sentiment Analysis**: Analyzes post titles/bodies for positive/negative sentiment.
    *   **Project Mentions**: Tracks mentions of specific coins (BTC, ETH, MOON, etc.).

### 5. Shared Packages
*   **Database** (`packages/database`): Shared Prisma Schema & Client. [README](./packages/database/README.md)
*   **Chain Data** (`packages/chain-data`): Shared Blockchain Constants (ABIs, Addresses). [README](./packages/chain-data/README.md)
*   **UI** (`packages/ui`): Shared React Components.
*   **Configs**: Shared TypeScript (`packages/tsconfig`) and ESLint (`packages/eslint-config`) configurations.

## ⚡ Quick Start

### Prerequisites
*   Node.js 18+
*   pnpm (`npm i -g pnpm`)
*   Docker & Docker Compose (for PostgreSQL)

### 1. Installation

```bash
# Install dependencies
pnpm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` in the root directory (or create it manually):

```bash
# .env
# Free Public RPCs (Primary)
RPC_URL_NOVA=https://nova.arbitrum.io/rpc
RPC_URL_ONE=https://arb1.arbitrum.io/rpc
RPC_URL_ETH=https://eth.llamarpc.com

# Optional: Alchemy Fallbacks (Recommended for deep history)
ALCHEMY_URL_NOVA=...
ALCHEMY_URL_ONE=...
ALCHEMY_URL_ETH=...

# Optional: QuickNode Fallbacks
QUICKNODE_URL_NOVA=...
QUICKNODE_URL_ONE=...
QUICKNODE_URL_ETH=...

TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHANNEL_ID=@your_channel
MOON_NOTIFICATION_THRESHOLD=50

DATABASE_URL="postgresql://rcc_user:rcc_password@localhost:5433/rcc_db"
```

### 3. Database Setup

See [packages/database/README.md](./packages/database/README.md) for full details.

```bash
# Start PostgreSQL container
sudo docker compose up -d

# Push schema to database
pnpm --filter @rcryptocurrency/database db:push
```

## 📦 Database Migration & Backup

To migrate your PostgreSQL database to another machine or create a backup, you can use standard PostgreSQL tools (`pg_dump` and `pg_restore`). Since we are using Docker, we execute these commands inside the container.

### Backup (Export)
Run this command to create a compressed dump of your database:

```bash
# Replace 'rcryptocurrency-site-db-1' with your actual container name if different
docker exec -t rcryptocurrency-site-db-1 pg_dump -U rcc_user -d rcc_db -F c > rcc_db_backup.dump
```

### Restore (Import)
On the new machine (after starting the docker container):

1.  Copy the backup file to the new machine.
2.  Run the restore command:

```bash
# Drop existing data (optional, be careful!)
# docker exec -i rcryptocurrency-site-db-1 psql -U rcc_user -d rcc_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore from dump
cat rcc_db_backup.dump | docker exec -i rcryptocurrency-site-db-1 pg_restore -U rcc_user -d rcc_db -F c --clean --if-exists
```

### 4. Seed Data (Optional)

```bash
# Seed known exchange labels (Kraken, MEXC, etc.)
pnpm --filter ledger seed:labels

# Ingest historical Reddit distribution data (if CSV is present)
pnpm --filter ledger ingest
```

### 5. Run Applications

The system consists of two parts: the core application stack and the standalone monitor.

**1. Run Core Services (Web, Scraper, Oracle, Indexer):**
```bash
pnpm dev
```
This starts the main application stack:
*   **Web Dashboard**: http://localhost:3000
*   **Scraper**: Background service for Reddit data.
*   **Oracle**: Background service for market stats.
*   **Ledger Indexer**: Background service for standard balance updates.

**2. Run Moon Monitor (Real-time Alerts & Swaps):**
The monitor is a standalone process that tracks live Burns and Swaps for the "Burns" and "Swaps" pages. It must be run separately.
```bash
pnpm --filter ledger monitor-moons
```

## 🛠 Operational Guide

### Database Management
*   **View Data**: `pnpm db:studio` (Opens Prisma Studio in browser)
*   **Reset DB**: `pnpm db:reset` (Drops and recreates the database)
*   **Migration**: When changing `schema.prisma`, run `pnpm db:push` to update the database structure.

### Monitoring
The `monitor-moons` script is critical for the "Burns" and "Swaps" pages. It should be kept running in a background process (e.g., via `pm2` or `systemd`) in production.

```bash
# Example with PM2
pm2 start apps/ledger/scripts/monitor-moons.ts --interpreter ./node_modules/.bin/ts-node --name moon-monitor
```

### Scripts & Maintenance

The `apps/ledger` package contains several utility scripts for maintaining the data integrity.

*   **Refresh Balances**: Updates all user balances from the blockchain.
    ```bash
    pnpm --filter ledger refresh-balances
    ```
*   **Backfill Burns**: Scans historical blocks for burn events to populate the Burns page.
    ```bash
    pnpm --filter ledger exec ts-node scripts/backfill-burns.ts
    ```
*   **Calculate Dormant Moons**: Calculates total Moons held by Redditors who have never moved them.
    ```bash
    pnpm --filter ledger exec ts-node scripts/calc-dormant-moons.ts
    ```
*   **Cleanup Duplicates**: Removes duplicate holder entries (case-sensitivity issues).
    ```bash
    pnpm --filter ledger exec ts-node scripts/cleanup-duplicates.ts
    ```

---

## ✅ Status Checklist

### Completed
- [x] **Monorepo Scaffold**: Turborepo + pnpm workspaces configured.
- [x] **Shared Packages**: `database`, `chain-data`, `ui` created and linked.
- [x] **Database Schema**: Prisma schema defined for Blockchain (Holders) and Social (Posts, Mentions) data.
- [x] **Web App**: Next.js app initialized with legacy assets (CSS/Images) ported to `public/`.
- [x] **Scraper App**: Implemented with `snoowrap` and `natural`. Includes **Mock Data** generation for dev.
- [x] **Oracle App**: Basic structure for fetching CoinGecko prices.
- [x] **Ledger App**: Viem client setup for multi-chain indexing.
- [x] **Web Integration**:
    - [x] Connect the "Richlist" page in `apps/web` to the `Holder` table.
    - [x] Create a "Dashboard" page showing MOON price (from Oracle) vs. Reddit Activity (from Scraper).
- [x] **Ledger Refinement**:
    - [x] Test the indexer against live RPC endpoints (Arbitrum Nova/One).
    - [x] Handle reorgs and missed blocks more robustly.
- [x] **Deployment Pipeline**:
    - [x] Set up Dockerfiles for each app (using `turbo prune`).
    - [ ] Configure CI/CD (GitHub Actions) to build and push images.

---

## 🚢 Deployment Guide

When ready to deploy to production (e.g., Vercel, Railway, or VPS):

1.  **Database**: Switch `packages/database/prisma/schema.prisma` from `sqlite` to `postgresql`.
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
2.  **Build**:
    ```bash
    pnpm build
    ```
3.  **Docker**:
    Use the `turbo prune` command to create lightweight Docker images for each service.
    ```bash
    # Example for web app
    turbo prune --scope=web --docker
    ```
4.  **Orchestration**:
    Use `docker-compose` or Kubernetes to run the `web`, `ledger`, `oracle`, and `scraper` containers side-by-side, all connecting to the same PostgreSQL instance.
