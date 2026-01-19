# TODO

## Completed

- [x] **Newsletter System** - `/newsletter` page, signup form, Resend integration, React Email templates, welcome emails, `/newsletter/manage` unsubscribe
- [x] **Admin Dashboard** - `/admin` with session auth, blog post CRUD, newsletter broadcasts
- [x] **Navigation Refactor** - Mobile bottom tabs, desktop dropdowns, tablet hamburger menu, Heroicons, full a11y
- [x] **Database Backups** - Daily `pg_dump` to Google Drive via rclone (`scripts/backup-db.sh`)

## Deferred

- [ ] **Connection Pooling (PgBouncer)** - Not needed at current scale. Monitor with: `psql -c "SELECT count(*) FROM pg_stat_activity;"`

## Future Ideas

- [ ] Weekly stats email template + cron automation
- [ ] Structured logging (pino) for ledger
- [ ] Health check endpoint for ledger
- [ ] Update Turborepo to v2.x

## Quick Reference

### Deploy Changes
```bash
git pull && pnpm install && pnpm build && pm2 restart web
```

### Environment Variables
```bash
ADMIN_PASSWORD=...
RESEND_API_KEY=re_...
RESEND_SEGMENT_ID=...
RESEND_FROM_EMAIL=updates@updates.rcryptocurrency.com
```

### Backup (runs daily at 3 AM via cron)
```bash
# Manual run
./scripts/backup-db.sh

# Check backups
rclone ls db-backup:rcryptocurrency-backups
```
