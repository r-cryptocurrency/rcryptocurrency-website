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
│   ├── database/         # Shared Prisma Schema & Client (SQLite/Postgres) - [README](./packages/database/README.md)
│   ├── ui/               # Shared React Components (Tailwind/Tremor)
│   ├── tsconfig/         # Shared TypeScript Configs
│   └── eslint-config/    # Shared Linting Rules
├── legacy-site/          # Original HTML/CSS/JS site (Reference)
└── notes/                # Research notes and Python prototypes
```

---

## 🚀 Applications

### 1. Web Dashboard (`apps/web`)
*   **Tech Stack**: Next.js 13, Tailwind CSS, Tremor, Next-Themes.
*   **Function**: The user-facing frontend. It replicates the legacy site's aesthetic while injecting real-time data from the database.
*   **Features**:
    *   **Dark Mode**: Fully responsive dark/light theme with persistent user preference.
    *   **Modern UI**: Glassmorphism effects, floaty background animations, and high-contrast data visualization.
    *   **Scraper Page**: Visualizes top mentioned projects and sentiment from r/CryptoCurrency.
    *   **Richlist**: Displays top MOON holders with support for address labels (e.g., "Kraken", "Bridge").
    *   **Market Stats**: Real-time MOON price, volume, market cap, and subreddit subscriber counts.
    *   **Timeline**: A history of the MOON token ecosystem.

### 2. Ledger (`apps/ledger`)
*   **Tech Stack**: Node.js, Viem.
*   **Function**: Indexes blockchain events for MOON tokens across Arbitrum Nova, Arbitrum One, and Ethereum Mainnet.
*   **Key Logic**:
    *   Listens for `Transfer` events.
    *   Updates user balances in the shared database.
    *   Handles cross-chain balance aggregation.
    *   **Management**: Includes scripts to manually label addresses (e.g., Exchanges).

## ⚡ Quick Start

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Setup Database**:
    ```bash
    # Generate Prisma Client and push schema to SQLite
    pnpm db:push
    ```

3.  **Seed Data** (Optional but recommended):
    ```bash
    # Seed known exchange labels (Kraken, MEXC, etc.)
    pnpm --filter ledger seed:labels
    
    # Ingest historical Reddit distribution data (if CSV is present)
    pnpm --filter ledger ingest
    ```

4.  **Run Development Server**:
    ```bash
    pnpm dev
    ```
    *   Web: http://localhost:3000
    *   Scraper: Runs in background
    *   Oracle: Runs in background

5.  **Populate Balances**:
    ```bash
    # Fetch live balances from blockchain
    pnpm --filter ledger refresh-balances
    ```

### 3. Oracle (`apps/oracle`)
*   **Tech Stack**: Node.js, Axios, Cron.
*   **Function**: Fetches high-level stats.
    *   **CoinGecko**: MOON price, volume, market cap. (Supports API Key via `COINGECKO_API_KEY`)
    *   **Reddit API**: Subreddit subscriber count, active users.

### 4. Scraper (`apps/scraper`)
*   **Tech Stack**: Node.js, Axios, Natural (NLP).
*   **Function**: Deep dives into subreddit content.
    *   **Public JSON API**: Scrapes `r/CryptoCurrency/new.json` without OAuth, using a custom User-Agent.
    *   **Sentiment Analysis**: Analyzes post titles/bodies for positive/negative sentiment.
    *   **Project Mentions**: Tracks mentions of specific coins (BTC, ETH, MOON, etc.).

---

## 🛠 Setup & Development

### Prerequisites
*   Node.js >= 18
*   pnpm (`npm install -g pnpm`)

### Installation
1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Database Setup**:
    The project currently uses **SQLite** for ease of development.
    ```bash
    pnpm run -w db:generate  # Generate Prisma Client
    pnpm run -w db:push      # Push schema to dev.db
    ```

3.  **Environment Variables**:
    Create a `.env` file in `apps/ledger` (and other apps as needed) with:
    ```env
    # Optional: Custom RPC URLs if needed
    # ARBITRUM_NOVA_RPC=...
    
    # Optional: CoinGecko API Key for Oracle
    # COINGECKO_API_KEY=...
    ```

### Running the Stack
You can run all applications simultaneously using Turbo:

```bash
pnpm dev
```

Or run specific apps:
```bash
pnpm dev --filter=web       # Run only the frontend
pnpm dev --filter=scraper   # Run only the scraper
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

### To Do / Next Steps
- [ ] **Web Integration**:
    - [ ] Connect the "Richlist" page in `apps/web` to the `Holder` table.
    - [ ] Create a "Dashboard" page showing MOON price (from Oracle) vs. Reddit Activity (from Scraper).
- [ ] **Ledger Refinement**:
    - [ ] Test the indexer against live RPC endpoints (Arbitrum Nova/One).
    - [ ] Handle reorgs and missed blocks more robustly.
- [ ] **Deployment Pipeline**:
    - [ ] Set up Dockerfiles for each app (using `turbo prune`).
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
