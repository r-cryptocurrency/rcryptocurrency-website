# 🌙 r/CryptoCurrency Site - Quick Setup Guide

**For fresh server deployment. Follow steps in order.**

---

## Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL running (via Docker or native)
- PM2 installed globally (`npm i -g pm2`)

---

## Step 1: Clone & Install

```bash
cd /home/jw/src
git clone <repo-url> rcryptocurrency-site
cd rcryptocurrency-site
pnpm install
```

---

## Step 2: Environment Setup

```bash
# Copy and edit .env file
cp .env.example .env
nano .env
```

Required vars:
- `DATABASE_URL` - PostgreSQL connection string
- `QUICKNODE_URL_NOVA` - QuickNode RPC for Arb Nova
- `QUICKNODE_URL_ONE` - QuickNode RPC for Arb One
- `QUICKNODE_URL_ETH` - QuickNode RPC for Ethereum
- `TELEGRAM_BOT_TOKEN` - For notifications
- `TELEGRAM_CHANNEL_ID` - Channel to post to

Optional (fallback):
- `ALCHEMY_URL_NOVA` - Free tier Alchemy RPC for Nova
- `ALCHEMY_URL_ONE` - Free tier Alchemy RPC for One
- `ALCHEMY_URL_ETH` - Free tier Alchemy for Ethereum
- `COINGECKO_API_KEY` - Only used as last-resort fallback for price

---

## Step 3: Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d db

# Reset and migrate database
pnpm --filter @rcryptocurrency/database db:reset
```

---

## Step 4: CSV Ingestion (Username → Address mapping)

Ensure `MoonDistributions.csv` is in project root, then:

```bash
pnpm --filter @rcryptocurrency/ledger run ingest-csv
```

Expected: Creates ~100k+ Reddit users and ~80k+ holders

---

## Step 5: Calculate Earned Moons (LONG - run in tmux!)

```bash
tmux new -s earned
pnpm --filter @rcryptocurrency/ledger run calc-earned-moons
# Ctrl+B, D to detach
```

⚠️ Takes 2-6 hours. Uses QuickNode credits.

---

## Step 6: Backfill Burns (LONG - run in tmux!)

```bash
tmux new -s burns
pnpm --filter @rcryptocurrency/ledger run backfill-burns
# Ctrl+B, D to detach
```

---

## Step 7: Backfill Swaps (LONG - run in tmux!)

```bash
tmux new -s swaps
pnpm --filter @rcryptocurrency/ledger run backfill-swaps
# Ctrl+B, D to detach
```

---

## Step 8: Seed Known Addresses

```bash
pnpm --filter @rcryptocurrency/ledger run seed-labels
```

---

## Step 9: Build All Apps

```bash
pnpm build
```

---

## Step 10: Start PM2 Services

```bash
# Install log rotation to prevent logs from filling disk
pm2 install pm2-logrotate

# Configure log rotation (100MB max per file, keep 3 rotated files, compress old logs)
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 3
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

---

## Step 11: Clean Up Build Cache (Optional)

```bash
# Clear Next.js cache (can grow to 1GB+)
rm -rf apps/web/.next/cache
rm -rf node_modules/.cache

# If needed, rebuild
pnpm build
```

---

## Step 12: Verify Everything

```bash
# Check PM2 status
pm2 status

# Run health check
pnpm --filter @rcryptocurrency/ledger run health-check

# Check logs
pm2 logs --lines 50

# Check log rotation is working
pm2 show pm2-logrotate
```

---

## ✅ Checklist

- [ ] `pnpm install` completed
- [ ] `.env` configured with all RPCs and tokens
- [ ] `pnpm prisma migrate reset --force` completed
- [ ] `ingest-csv` completed (check: users/holders in DB)
- [ ] `calc-earned-moons` completed (check: users have earnedMoons > 0)
- [ ] `backfill-burns` completed (check: burns in DB)
- [ ] `backfill-swaps` completed (check: swaps in DB)
- [ ] `seed-labels` completed
- [ ] `pnpm build` completed
- [ ] `pm2 start` completed
- [ ] PM2 log rotation configured
- [ ] `health-check` passes
- [ ] Website accessible
- [ ] Telegram notifications working

---

## Disk Space Management

```bash
# Check disk usage
du -h --max-depth=2 /root/rcryptocurrency-site | sort -h | tail -n 20

# Clear build caches (safe to delete, will rebuild)
rm -rf apps/web/.next/cache
rm -rf node_modules/.cache

# Check PM2 logs size
du -sh ~/.pm2/logs/

# Flush PM2 logs if too large
pm2 flush
```

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Ingest CSV | `pnpm --filter @rcryptocurrency/ledger run ingest-csv` |
| Calculate earned moons | `pnpm --filter @rcryptocurrency/ledger run calc-earned-moons` |
| Backfill burns | `pnpm --filter @rcryptocurrency/ledger run backfill-burns` |
| Backfill swaps | `pnpm --filter @rcryptocurrency/ledger run backfill-swaps` |
| Refresh balances | `pnpm --filter @rcryptocurrency/ledger run refresh-balances` |
| Health check | `pnpm --filter @rcryptocurrency/ledger run health-check` |
| Start services | `pm2 start ecosystem.config.js` |
| View logs | `pm2 logs` |
| Restart all | `pm2 restart all` |

---

## Ongoing Maintenance

### Daily
- `pm2 status` - verify all services running
- Check Telegram for notifications

### Weekly  
- `pnpm --filter @rcryptocurrency/ledger run health-check`
- `pnpm --filter @rcryptocurrency/ledger run refresh-balances`

### After New CSV Release
1. `pnpm --filter @rcryptocurrency/ledger run ingest-csv`
2. `pnpm --filter @rcryptocurrency/ledger run calc-earned-moons` (if you want updated earned moons)

---

## Market Data Sources (No CoinGecko Required!)

The oracle now fetches price/supply data WITHOUT needing CoinGecko:

**Price Priority:**
1. **Kraken API** (free, no key needed) - `GET https://api.kraken.com/0/public/Ticker?pair=MOONUSD`
2. **Pool Calculation** - Calculate from SushiSwap V2 reserves (MOON/ETH pool)
3. **CoinGecko** - Last resort fallback only

**Supply:**
- Reads `totalSupply()` directly from Moon contracts on all 3 chains
- Calculates our own market cap: `price × totalSupply`

**24h Change:**
- Calculated from our own DB price history (no external API needed)
