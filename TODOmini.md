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

---

## Step 3: Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d db

# Reset and migrate database
pnpm prisma migrate reset --force
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
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

---

## Step 11: Verify Everything

```bash
# Check PM2 status
pm2 status

# Run health check
pnpm --filter @rcryptocurrency/ledger run health-check

# Check logs
pm2 logs --lines 50
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
- [ ] `health-check` passes
- [ ] Website accessible
- [ ] Telegram notifications working

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
