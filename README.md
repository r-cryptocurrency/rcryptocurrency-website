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

## 📦 Database Migration & Backup

Moving your data from your local development environment (Docker) to production (PM2 or Docker) requires exporting and importing the PostgreSQL database.

### 1. Export (From Local Docker)
First, create a compressed dump of your local database. Run this on your **local machine**:

```bash
# 1. Find your database container name
docker ps
# (Look for the postgres container, e.g., rcryptocurrency-site-db-1)

# 2. Create the dump file
docker exec -t rcryptocurrency-site-db-1 pg_dump -U rcc_user -d rcc_db -F c > rcc_db_backup.dump
```

### 2. Transfer
Upload the `rcc_db_backup.dump` file to your VPS.
```bash
scp rcc_db_backup.dump user@your-vps-ip:~/
```

### 3. Import (Restore)

#### Option A: Importing to PM2 (Native Postgres)
If you followed the **PM2 Deployment** guide, your database is running natively on the VPS.

1.  **Reset the Database** (Optional but recommended for a clean slate):
    ```bash
    # Drop and recreate the schema to ensure no conflicts
    sudo -u postgres psql -d rcc_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    ```

2.  **Restore the Data**:
    ```bash
    # Restore using pg_restore
    # You might need to specify the host as localhost if peer authentication fails
    pg_restore -U rcc_user -d rcc_db -h localhost -F c --clean --if-exists rcc_db_backup.dump
    ```
    *Note: You will be prompted for the `rcc_user` password you set during setup.*

#### Option B: Importing to Docker (Containerized Postgres)
If you followed the **Docker Deployment** guide, your database is running inside a container.

1.  **Copy the dump into the container**:
    ```bash
    docker cp rcc_db_backup.dump rcryptocurrency-site-postgres-1:/tmp/backup.dump
    ```

2.  **Restore inside the container**:
    ```bash
    docker exec -i rcryptocurrency-site-postgres-1 pg_restore -U rcc_user -d rcc_db -F c --clean --if-exists /tmp/backup.dump
    ```

---

## 🚢 Deployment Guide (Production)

This guide details how to deploy the stack to a VPS (App Server) while using a separate machine for SSL termination/Reverse Proxy (e.g., Nginx Proxy Manager).

### 🖥️ Resource Requirements (VPS)
For low to moderate traffic, the following specifications are recommended for the App Server:
*   **CPU**: 2 vCPU
*   **RAM**: 4GB Recommended (2GB Minimum + 2GB Swap File is required to prevent build crashes).
*   **Storage**: 25GB+ SSD.
*   **OS**: Ubuntu 22.04 LTS or similar.

---

### Option 1: PM2 (Recommended)
This method is lighter on resources and easier to debug for single-server deployments.

#### 1. Prerequisites
Install Node.js 18+, PostgreSQL, and PM2 on the App Server.
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2 pnpm

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
```

#### 2. Database Setup
Configure a local PostgreSQL user and database.
```bash
sudo -u postgres psql
# Inside psql shell:
CREATE DATABASE rcc_db;
CREATE USER rcc_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE rcc_db TO rcc_user;
\q
```

#### 3. Application Setup
Clone the repo and build the application.
```bash
git clone https://github.com/r-cryptocurrency/rcryptocurrency-website.git
cd rcryptocurrency-website

# Install dependencies
pnpm install

# Configure Environment
cp .env.example .env
# Edit .env to set DATABASE_URL="postgresql://rcc_user:your_secure_password@localhost:5432/rcc_db"

# Push Database Schema
pnpm db:push

# Build Applications
pnpm build
```

#### 4. Start Services
Use the included `ecosystem.config.js` to start all services (Web, Ledger, Oracle, Scraper, Monitor).
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
*Note: The `web` application is configured to run in **Cluster Mode** (`instances: "max"`), which will spawn a worker for every CPU core available. The other services (`ledger`, `scraper`, etc.) run as single instances to prevent data duplication.*

---

### Option 2: Docker (Alternative)
Use this method if you prefer container isolation or are deploying to a cluster.

#### 1. Docker Configuration
Since this is a Turborepo, we need to create Dockerfiles that prune the workspace to only include necessary dependencies for each app.

**Create `apps/web/Dockerfile`:**
```dockerfile
FROM node:18-alpine AS base

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Set working directory
RUN npm install turbo --global
COPY . .
RUN turbo prune --scope=web --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN npm install -g pnpm
RUN pnpm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=web...

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=installer /app/apps/web/next.config.js .
COPY --from=installer /app/apps/web/package.json .

# Automatically leverage output traces to reduce image size
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "apps/web/server.js"]
```
*(Note: You will need similar Dockerfiles for `ledger`, `oracle`, and `scraper`, adjusting the scope and CMD).*

#### 2. Orchestration (docker-compose.prod.yml)
Create a `docker-compose.prod.yml` on your App Server:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: rcc_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: rcc_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - rcc_net

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: always
    ports:
      - "3000:3000" # Expose to host for Reverse Proxy
    environment:
      - DATABASE_URL=postgresql://rcc_user:${DB_PASSWORD}@postgres:5432/rcc_db
    depends_on:
      - postgres
    networks:
      - rcc_net

  # Add other services (ledger, oracle, scraper) similarly...

networks:
  rcc_net:
    driver: bridge

volumes:
  postgres_data:
```

---

### Reverse Proxy Setup (Multi-Machine)

Regardless of whether you use PM2 or Docker, if you are running **Nginx Proxy Manager (NPM)** on a separate machine (Proxy Server) to handle SSL for `rcryptocurrency.com`:

1.  **App Server (Machine A)**:
    *   Ensure the `web` application is running on port `3000`.
    *   **Firewall**: Allow incoming traffic on port `3000` *only* from the IP address of the Proxy Server.
        ```bash
        # Example UFW command
        sudo ufw allow from <PROXY_SERVER_IP> to any port 3000
        ```

2.  **Proxy Server (Machine B)**:
    *   Log in to Nginx Proxy Manager.
    *   Create a new **Proxy Host**.
    *   **Domain Names**: `rcryptocurrency.com`
    *   **Scheme**: `http`
    *   **Forward Hostname / IP**: `<APP_SERVER_IP>` (Internal IP if on same VPC, else Public IP)
    *   **Forward Port**: `3000`
    *   **Websockets Support**: Enable this (Required for Next.js).
    *   **SSL**: Request a new Let's Encrypt certificate and enable "Force SSL".
