# r/CryptoCurrency Superrepo

This monorepo contains the complete ecosystem for the r/CryptoCurrency community platform. It consolidates the website, blockchain indexer, market data oracle, Reddit scraper, and real-time monitoring into a single, high-performance workspace.

## 🏗 Architecture

The project is built as a **Monorepo** using [pnpm workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/).

### 📂 Directory Structure

```
rcryptocurrency-site/
├── apps/
│   ├── web/              # Next.js 13 Frontend Dashboard
│   ├── ledger/           # Blockchain Indexer + Monitor (Viem)
│   ├── oracle/           # Market Data + Reddit Stats (Kraken/Pool/CoinGecko)
│   └── scraper/          # Reddit Scraper (Public JSON + NLP)
├── packages/
│   ├── chain-data/       # Shared Blockchain Constants (ABIs, Addresses)
│   ├── database/         # Shared Prisma Schema & Client (PostgreSQL)
│   ├── ui/               # Shared React Components (Tailwind)
│   ├── tsconfig/         # Shared TypeScript Configs
│   └── eslint-config/    # Shared Linting Rules
└── notes/                # Research notes and Python prototypes
```

---

## 🚀 Applications

### 1. Web Dashboard (`apps/web`)
- **Tech**: Next.js 13, Tailwind CSS, Tremor
- **Features**:
  - Dark/light theme with persistent preference
  - **Richlist**: Top MOON holders with address labels (exchanges, bridges, etc.)
  - **Burns**: Real-time tracking across all chains (Nova, One, ETH)
  - **Swaps**: Live DEX swap feed (SushiSwap, Camelot, Uniswap)
  - **Scraper**: Karma leaderboard with dynamic Moon round calculation
  - **Stats**: Market data, subreddit stats, timeline
  - **2024/2025 Constitution**: Governance documents

### 2. Ledger (`apps/ledger`)
- **Tech**: Node.js, Viem, TypeScript
- **Chains**: Arbitrum Nova (primary), Arbitrum One, Ethereum Mainnet
- **RPC Priority**: 
  - Heavy scans (backfills): QuickNode → Alchemy → Public
  - Light monitoring: Public → Alchemy → QuickNode
- **Core Scripts**:
  | Script | Purpose |
  |--------|---------|
  | `ingest-csv` | Import Reddit username → address mappings from CSV |
  | `calc-earned-moons` | Calculate earned moons from genesis/distributor transfers |
  | `backfill-burns` | Scan historical burns (resumes from last block) |
  | `backfill-swaps` | Scan historical DEX swaps |
  | `refresh-balances` | Update all holder balances from chain |
  | `monitor-moons` | Real-time burn/swap monitoring + Telegram alerts |
  | `health-check` | Verify system integrity and data freshness |
  | `seed-labels` | Label known addresses (exchanges, bridges) |

### 3. Oracle (`apps/oracle`)
- **Tech**: Node.js, Viem, Axios, Cron
- **Market Data Sources** (NO CoinGecko payment required!):
  | Data | Primary Source | Fallback |
  |------|----------------|----------|
  | Price | Kraken API (free) | Pool calculation → CoinGecko |
  | Supply | On-chain `totalSupply()` | N/A |
  | Market Cap | Calculated (price × supply) | N/A |
  | 24h Change | DB price history | CoinGecko |
- **Reddit Stats**: Subscriber count, active users via public JSON

### 4. Scraper (`apps/scraper`)
- **Tech**: Node.js, Axios, Natural (NLP)
- **Function**: Scrapes r/CryptoCurrency for karma tracking
- **Features**:
  - Public JSON API (no OAuth needed)
  - Sentiment analysis on posts
  - Project mention tracking

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- pnpm (`npm i -g pnpm`)
- Docker & Docker Compose (for PostgreSQL)
- PM2 (`npm i -g pm2`) for production

### 1. Installation

```bash
git clone <repo-url> rcryptocurrency-site
cd rcryptocurrency-site
pnpm install
```

### 2. Environment Setup

Create `.env` in project root:

```bash
# Database
DATABASE_URL="postgresql://rcc_user:rcc_password@localhost:5433/rcc_db"

# RPC Endpoints (QuickNode for heavy lifting)
QUICKNODE_URL_NOVA=https://your-quicknode-nova-endpoint
QUICKNODE_URL_ONE=https://your-quicknode-one-endpoint
QUICKNODE_URL_ETH=https://your-quicknode-eth-endpoint

# Alchemy Fallbacks (free tier)
ALCHEMY_URL_NOVA=https://arb-nova.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_URL_ONE=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_URL_ETH=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Public RPCs (automatic fallback, no config needed)
# Nova: https://nova.arbitrum.io/rpc
# One: https://arb1.arbitrum.io/rpc
# ETH: https://eth.llamarpc.com

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=@your_channel
MOON_NOTIFICATION_THRESHOLD=50

# Optional: CoinGecko API (only used as last resort fallback)
# COINGECKO_API_KEY=your_key
```

### 3. Database Setup

```bash
# Start PostgreSQL
docker-compose up -d db

# Push schema
pnpm --filter @rcryptocurrency/database db:push
```

### 4. Initial Data Load

```bash
# 1. Ingest CSV (username → address mapping)
# Ensure MoonDistributions.csv is in project root
pnpm --filter @rcryptocurrency/ledger run ingest-csv

# 2. Calculate earned moons (LONG - 2-6 hours, uses QuickNode)
tmux new -s earned
pnpm --filter @rcryptocurrency/ledger run calc-earned-moons

# 3. Backfill burns (LONG - run in tmux)
tmux new -s burns
pnpm --filter @rcryptocurrency/ledger run backfill-burns

# 4. Backfill swaps (LONG - run in tmux)
tmux new -s swaps
pnpm --filter @rcryptocurrency/ledger run backfill-swaps

# 5. Seed known address labels
pnpm --filter @rcryptocurrency/ledger run seed-labels
```

### 5. Build & Run

```bash
# Build all apps
pnpm build

# Development
pnpm dev

# Production (PM2)
pm2 start ecosystem.config.js
```

---

## 🛠 Operations Guide

### PM2 Log Rotation (IMPORTANT!)

Prevent logs from filling disk:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 3
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

### Scripts Reference

| Task | Command |
|------|---------|
| Ingest CSV | `pnpm --filter @rcryptocurrency/ledger run ingest-csv` |
| Calculate earned | `pnpm --filter @rcryptocurrency/ledger run calc-earned-moons` |
| Backfill burns | `pnpm --filter @rcryptocurrency/ledger run backfill-burns` |
| Backfill swaps | `pnpm --filter @rcryptocurrency/ledger run backfill-swaps` |
| Refresh balances | `pnpm --filter @rcryptocurrency/ledger run refresh-balances` |
| Health check | `pnpm --filter @rcryptocurrency/ledger run health-check` |
| Monitor (realtime) | `pnpm --filter @rcryptocurrency/ledger run monitor-moons` |
| Seed labels | `pnpm --filter @rcryptocurrency/ledger run seed-labels` |
| DB Studio | `pnpm --filter @rcryptocurrency/database db:studio` |

### Database Management

```bash
# View data in browser
pnpm --filter @rcryptocurrency/database db:studio

# Reset database (DESTRUCTIVE)
pnpm prisma migrate reset --force

# Push schema changes
pnpm --filter @rcryptocurrency/database db:push
```

### Disk Space Management

```bash
# Check disk usage
du -h --max-depth=2 . | sort -h | tail -20

# Clear build caches
rm -rf apps/web/.next/cache
rm -rf node_modules/.cache

# Check PM2 logs
du -sh ~/.pm2/logs/

# Flush logs if needed
pm2 flush
```

### Health Monitoring

```bash
# Quick health check
pnpm --filter @rcryptocurrency/ledger run health-check

# PM2 status
pm2 status

# View logs
pm2 logs --lines 50
```

---

## 🌙 Moon Token Details

### Contracts
| Chain | Address |
|-------|---------|
| Arbitrum Nova | `0x0057Ac2d777797d31CD3f8f13bF5e927571D6Ad0` |
| Arbitrum One | `0x24404DC041d74cd03cFE28855F555559390C931b` |
| Ethereum | `0xb2490e357980ce57bf5745e181e537a64eb367b1` |

### Key Addresses
| Label | Address |
|-------|---------|
| Genesis | `0x0000000000000000000000000000000000000000` |
| TheMoonDistributor | `0xda9338361d1CFAB5813a92697c3f0c0c42368FB3` |
| Burn Address | `0x000000000000000000000000000000000000dEaD` |

### Moon Rounds
- **Round 70**: Started December 9, 2025
- **Cycle**: 28 days per round
- Calculation: `Round = 70 + floor((now - Dec 9 2025) / 28 days)`

---

## 📦 Database Backup & Restore

### Export (Local Docker)
```bash
sudo docker exec -t rcryptocurrency-site-db-1 pg_dump -U rcc_user -d rcc_db -F c > rcc_db_backup.dump
```

### Import (Native Postgres)
```bash
cp rcc_db_backup.dump /tmp/
sudo -u postgres pg_restore -d rcc_db --clean --if-exists /tmp/rcc_db_backup.dump
```

### Import (Docker)
```bash
sudo docker cp rcc_db_backup.dump rcryptocurrency-site-postgres-1:/tmp/backup.dump
sudo docker exec -i rcryptocurrency-site-postgres-1 pg_restore -U rcc_user -d rcc_db -F c --clean --if-exists /tmp/backup.dump
```

---

## 🚢 Production Deployment

### PM2 (Recommended)

```bash
# Install prerequisites
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib
sudo npm install -g pm2 pnpm

# Setup database
sudo -u postgres psql
CREATE DATABASE rcc_db;
CREATE USER rcc_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rcc_db TO rcc_user;
\q

# Clone and build
git clone <repo-url>
cd rcryptocurrency-site
pnpm install
cp .env.example .env  # Edit with your values
pnpm build

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 3
pm2 set pm2-logrotate:compress true
```

### Resource Requirements
- **CPU**: 2+ vCPU
- **RAM**: 4GB recommended (2GB min + 2GB swap)
- **Storage**: 25GB+ SSD
- **OS**: Ubuntu 22.04 LTS

---

## 📋 Maintenance Schedule

### Daily
- `pm2 status` - Verify all services running (web, ledger, monitor, oracle, scraper)
- Check Telegram for burn/swap notifications

### Weekly
- `pnpm --filter @rcryptocurrency/ledger run health-check`

### As Needed (Recovery Only)
- `pnpm --filter @rcryptocurrency/ledger run refresh-balances` - Only if ledger was down and missed events

### After New CSV Release
1. Place new `MoonDistributions.csv` in project root
2. `pnpm --filter @rcryptocurrency/ledger run ingest-csv`
3. `pnpm --filter @rcryptocurrency/ledger run calc-earned-moons` (optional)

---

## ✅ Status

- [x] Monorepo with Turborepo + pnpm workspaces
- [x] Multi-chain indexing (Nova, One, ETH)
- [x] Real-time burn/swap monitoring with Telegram alerts
- [x] Earned moons calculation from blockchain transfers
- [x] Dynamic moon round calculation for scraper
- [x] Free market data (Kraken API + on-chain supply)
- [x] PM2 production deployment with log rotation
- [x] Database indexes for performance
- [x] Health check system
- [ ] CI/CD pipeline (GitHub Actions)

---

## 📄 Additional Documentation

- [TODOmini.md](./TODOmini.md) - Quick setup checklist
- [TODO.md](./TODO.md) - Detailed implementation plan
- [apps/ledger/README.md](./apps/ledger/README.md) - Ledger details
- [apps/oracle/README.md](./apps/oracle/README.md) - Oracle details
- [apps/web/README.md](./apps/web/README.md) - Web app details
- [packages/database/README.md](./packages/database/README.md) - Database schema
