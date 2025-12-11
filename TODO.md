
## Deep Dive Review: Reddit CSV Import & Blockchain Scraping

After reviewing all the code, here are my findings organized by severity.

---

## 🔴 CRITICAL ISSUES

### 1. Reddit CSV Import is Fundamentally Broken

**File:** ingest-csv.ts

The CSV ingestion script has **never worked correctly on the server**:

```typescript
const CSV_PATH = '/home/jw/Documents/rcryptocurrency/MOONs/MoonDistributions.csv';
```

This is a hardcoded path to YOUR LOCAL MACHINE. On the server (`root@rcc`), this file doesn't exist, so the ingestion would have failed silently or never been run.

**Evidence:** The `u/CryptoMaximalist` user has address `0x589af3e07607f94ba822c23b744c6cb5a188e5e5` in your CSV (I saw the screenshot), but the database shows them linked to a completely different address. This means either:
- The CSV was never ingested on the server, OR
- It was ingested incorrectly

**Fix Required:** 
1. Upload the CSV to the server
2. Fix the path in the script
3. Re-run the ingestion

---

### 2. Address Case Sensitivity is Still a Problem

**Files:** Multiple

The database stores addresses in mixed case, but different parts of the codebase use different conventions:

| Component | Case Used |
|-----------|-----------|
| `ingest-csv.ts` | Mixed (as-is from CSV) |
| refresh-balances.ts | `.toLowerCase()` |
| `ledger/index.ts` | `.toLowerCase()` (after my fix) |
| `monitor/watchers.ts` | `.toLowerCase()` (after my fix) |
| Web UI queries | Mixed |

This means a swap from `0xABC...` might not update the holder record for `0xabc...`.

**Fix Required:** Run a one-time migration to lowercase all addresses:

```sql
UPDATE "Holder" SET address = LOWER(address);
UPDATE "Swap" SET maker = LOWER(maker);
UPDATE "Burn" SET address = LOWER(address);
```

---

### 3. Earned Moons Calculation is Extremely Slow & Inefficient

**File:** refresh-balances.ts - `updateEarnedMoons()`

This function scans **the entire blockchain** from block 0 to latest for every refresh. For 142,000+ addresses, this is insanely expensive.

**Current Approach:**
- Scans blocks 0 → 84,000,000+ 
- Makes thousands of RPC calls
- Takes HOURS to complete
- Hits rate limits constantly

**Better Approach:** The earned moons data is **already in the CSV file**. You should:
1. Parse it during CSV ingestion
2. Store it in the `RedditUser.earnedMoons` field directly
3. Only use blockchain scanning for addresses NOT in the CSV (new earners after the last CSV export)

---

## 🟠 MAJOR ISSUES

### 4. Scraper Doesn't Update `lastTransferAt` for Existing Users

**File:** scraper.ts

The Reddit scraper creates `RedditPost` and `RedditComment` records but never updates the `Holder` table. This is fine for *Reddit* data, but it means:

- Reddit activity doesn't show up as "Last Active" on the Richlist
- Only blockchain activity updates `lastTransferAt`

**This is actually correct behavior** (Richlist = blockchain activity, not Reddit activity), but worth confirming that's what you want.

---

### 5. Monitor App Creates Duplicate Prisma Clients

**File:** db.ts

I already fixed this in a previous step, but verify it's using the shared client:

```typescript
// BAD (was)
import { PrismaClient } from '@prisma/client';
export const db = new PrismaClient();

// GOOD (should be)
import { prisma } from '@rcryptocurrency/database';
export const db = prisma;
```

---

### 6. Backfill Burns Script Has Hardcoded Start Block

**File:** backfill-burns.ts

```typescript
const START_BLOCK = 0n; // This scans from genesis!
```

This means every time you run `backfill-burns`, it rescans the entire chain history. It should:
1. Check the latest burn in the DB
2. Start from that block + 1

---

### 7. No Deduplication for Burns

**File:** backfill-burns.ts

If you run the backfill twice, you get duplicate burn records. The script should use `upsert` with `txHash` as the unique key.

---

## 🟡 EFFICIENCY IMPROVEMENTS

### 8. Use Multicall More Aggressively

**File:** refresh-balances.ts

The current approach:
```typescript
const BATCH_SIZE = 20; // Process 20 addresses at a time
```

But `multicall` can handle **hundreds** of calls in a single RPC request. You could:
```typescript
const BATCH_SIZE = 200; // 10x more efficient
```

---

### 9. Cache Alchemy API Responses

**File:** refresh-balances.ts

The `alchemy_getAssetTransfers` API is expensive. Consider caching results:

```typescript
// Check if we already know lastTransferAt for this address
const existing = await prisma.holder.findUnique({ 
  where: { address },
  select: { lastTransferAt: true }
});

// Only call Alchemy if we don't have a timestamp
if (!existing?.lastTransferAt) {
  // ... call Alchemy
}
```

---

### 10. Parallelize Activity Lookups

**File:** refresh-balances.ts

Currently, activity lookups are sequential within a batch:

```typescript
for (let index = 0; index < batch.length; index++) {
  // ... 
  const lastActive = await getActivity(...); // SEQUENTIAL!
}
```

Should be:

```typescript
const activities = await Promise.all(
  batch.map(h => getActivity(novaClient, MOON_CONTRACTS.arbitrumNova, h.address))
);
```

---

## 🟢 MINOR SUGGESTIONS

### 11. Add Progress Logging to All Long-Running Scripts

```typescript
const startTime = Date.now();
console.log(`[${new Date().toISOString()}] Starting...`);
// ... work ...
console.log(`[${new Date().toISOString()}] Completed in ${(Date.now() - startTime) / 1000}s`);
```

### 12. Add Database Indexes

```prisma
model Holder {
  // ...
  @@index([lastTransferAt])
  @@index([totalBalance])
  @@index([username])
}
```

### 13. Create Health Check Endpoints

Add an API route like `/api/health` that reports:
- Last scraper run time
- Last ledger update time
- Number of holders tracked
- Any errors in the last hour

---

## RECOMMENDED ACTION PLAN

### Immediate (Today)
1. **Upload CSV to server** and fix the path in `ingest-csv.ts`
2. **Run address normalization SQL** to lowercase all addresses
3. **Re-ingest the CSV** to fix Reddit username → address mappings

### Short-Term (This Week)
4. **Modify `ingest-csv.ts`** to parse earned moons from CSV instead of calculating from blockchain
5. **Add upsert logic** to `backfill-burns.ts` to prevent duplicates
6. **Increase multicall batch size** to 200

### Medium-Term (Next Week)
7. **Add database indexes** for performance
8. **Parallelize activity lookups**
9. **Add health check endpoints**

---

Do you want me to implement any of these fixes right now? I recommend starting with #1-3 (the CSV re-ingestion) since that's the root cause of the `u/CryptoMaximalist` issue.