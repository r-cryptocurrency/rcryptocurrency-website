# Shared Database (`packages/database`)

The shared Prisma schema and client for the r/CryptoCurrency monorepo.

## Schema
The schema is defined in `prisma/schema.prisma` and covers three main domains:
1.  **Blockchain State**: `Holder` (with `label` support), `LiquiditySnapshot`
2.  **Blockchain Events**: `Burn`, `Swap`
3.  **Social**: `RedditUser`, `Submission`, `RedditComment`, `Mention`, `MarketStat` (includes `redditSubscribers`)

## Usage
This package exports a singleton `prisma` instance that can be imported by any app in the monorepo:

```typescript
import { prisma } from '@rcryptocurrency/database';

const users = await prisma.redditUser.findMany();
```

## Commands

- `pnpm db:generate`: Generate the Prisma Client.
- `pnpm db:push`: Push schema changes to the PostgreSQL database.
- `pnpm db:studio`: Open Prisma Studio to view/edit data.

## Database Migration & Backup

To migrate your PostgreSQL database to another machine or create a backup, you can use standard PostgreSQL tools (`pg_dump` and `pg_restore`). Since we are using Docker, we execute these commands inside the container or via `docker exec`.

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

