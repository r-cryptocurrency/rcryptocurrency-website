# Shared Database (`packages/database`)

The shared Prisma schema and client for the r/CryptoCurrency monorepo.

## Schema
The schema is defined in `prisma/schema.prisma` and covers two main domains:
1.  **Blockchain**: `Holder` (with `label` support), `LiquiditySnapshot`
2.  **Social**: `RedditUser`, `Submission`, `RedditComment`, `Mention`, `MarketStat` (includes `redditSubscribers`)

## Usage
This package exports a singleton `prisma` instance that can be imported by any app in the monorepo:

```typescript
import { prisma } from '@rcryptocurrency/database';

const users = await prisma.redditUser.findMany();
```

## Commands

- `pnpm db:generate`: Generate the Prisma Client.
- `pnpm db:push`: Push schema changes to the local SQLite database (`dev.db`).
- `pnpm db:studio`: Open Prisma Studio to view/edit data.
