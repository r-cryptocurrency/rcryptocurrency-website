# Architecture Improvements Roadmap

**Created:** January 18, 2026
**Updated:** January 18, 2026
**Based on:** Architectural Audit Report

---

## Priority 1: Newsletter/Blog Page ✅ COMPLETE

**Goal:** Get a visible `/newsletter` page live with email signup form that collects subscribers via Resend.

### Completed Tasks
- [x] Create `apps/web/app/newsletter/page.tsx` - signup + past posts list
- [x] Create `apps/web/app/newsletter/[slug]/page.tsx` - individual post view
- [x] Build `NewsletterForm` client component
- [x] Create Server Action `apps/web/app/actions/newsletter.ts` to add contacts to Resend
- [x] Add `NewsletterSubscriber` model to Prisma schema (local backup)
- [x] Add `NewsletterPost` model to Prisma schema (blog posts)
- [x] Add newsletter link to navigation

### Files Created
- `apps/web/app/newsletter/page.tsx`
- `apps/web/app/newsletter/[slug]/page.tsx`
- `apps/web/app/actions/newsletter.ts`
- `apps/web/components/NewsletterForm.tsx`

### Dependencies
- Resend API key (`RESEND_API_KEY`)
- Resend Segment ID (`RESEND_SEGMENT_ID`) - For broadcasts only
- Verified domain: `updates.rcryptocurrency.com` ✅

---

## Priority 3: Admin Blog/Newsletter Dashboard ✅ COMPLETE

**Goal:** Unlisted admin page for team to upload blog posts and trigger newsletter broadcasts.

### Completed Tasks
- [x] Create `apps/web/app/admin/page.tsx` (login page)
- [x] Implement session-based auth with shared password (`ADMIN_PASSWORD` env var)
- [x] Blog post creation UI (title, excerpt, author, markdown body)
- [x] Add `NewsletterPost` model to Prisma schema
- [x] Blog post list/edit/delete functionality
- [x] Newsletter broadcast trigger (sends post to all subscribers via Resend)

### Files Created
- `apps/web/lib/admin-auth.ts` - JWT session utilities
- `apps/web/app/actions/admin.ts` - admin server actions
- `apps/web/app/admin/page.tsx` - login page
- `apps/web/app/admin/AdminLoginForm.tsx`
- `apps/web/app/admin/posts/page.tsx` - posts list
- `apps/web/app/admin/posts/AdminPostsList.tsx`
- `apps/web/app/admin/posts/AdminLogoutButton.tsx`
- `apps/web/app/admin/posts/PostForm.tsx`
- `apps/web/app/admin/posts/new/page.tsx`
- `apps/web/app/admin/posts/[id]/edit/page.tsx`

### Security
- Session-based auth (24h expiry, HTTP-only cookie)
- Password stored in env variable
- All admin actions verify session before executing

---

## Deployment Steps

### 1. Pull Changes
```bash
cd ~/rcryptocurrency-website
git pull origin master
```

### 2. Add Environment Variables

Add these to the root `.env` file:
```bash
ADMIN_PASSWORD=your_secure_password_here
RESEND_API_KEY=re_...
RESEND_SEGMENT_ID=...  # Create segment in Resend dashboard first
RESEND_FROM_EMAIL=updates@updates.rcryptocurrency.com
```

Next.js reads env vars from `apps/web/.env` at build time. Create a symlink so it reads from root:
```bash
ln -sf ~/rcryptocurrency-website/.env ~/rcryptocurrency-website/apps/web/.env
```

### 3. Push Prisma Schema Changes
This adds the `NewsletterSubscriber` and `NewsletterPost` tables to the database:
```bash
# Push schema changes (creates tables if they don't exist)
pnpm --filter @rcryptocurrency/database db:push

# Regenerate Prisma client with new models
pnpm --filter @rcryptocurrency/database db:generate
```

**Note:** `db:push` is safe for adding new tables. It won't drop existing data.

### 4. Rebuild and Restart
```bash
# Rebuild all apps
pnpm build

# Restart the web app
pm2 restart web
```

### 5. Verify
- Visit `/newsletter` - should show signup form and empty posts list
- Visit `/admin` - should show login page
- Login with your `ADMIN_PASSWORD`
- Create a test post to verify everything works

---

## Resend Setup

### How It Works
- **Contacts**: When someone subscribes, they're added to Resend's Contacts (via API)
- **Segments**: To send broadcasts, you need a Segment that groups your contacts
- **Broadcasts**: Sends an email to all contacts in a segment

### Step 1: Create a Segment for Broadcasts
1. Go to [Resend Audience](https://resend.com/audience) → **Segments** tab
2. Click "Create Segment"
3. Name it "All Subscribers" or similar
4. Set filter: `unsubscribed = false` (to only include active subscribers)
5. Copy the Segment ID from the URL or segment details
6. Add to `.env` as `RESEND_SEGMENT_ID`

### Step 2: Verify Domain (if not done)
1. Go to [Resend Domains](https://resend.com/domains)
2. Add `updates.rcryptocurrency.com`
3. Add the DNS records they provide
4. Wait for verification (usually a few minutes)

### Step 3: Get API Key
1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Create a new key or copy existing one
3. Add to `.env` as `RESEND_API_KEY`

### Test Email Sending
After setup:
1. Subscribe yourself at `/newsletter`
2. Check Resend dashboard → Contacts to confirm you appear
3. Create a post in `/admin`, publish it, click "Send"
4. The email goes to all contacts in your segment

---

---

## Priority 2: Navigation UI Refactor ✅ COMPLETE

**Goal:** Replace overcrowded hamburger menu with categorized navigation.

### Navigation Structure

| Category | Links |
|----------|-------|
| **Home** | Direct link to `/` |
| **Market** | Stats, Richlist, Burns, Swap |
| **Community** | Leaderboard, Calendar, Advertise, Newsletter, Constitution |
| **Account** | Link Wallet, Claim Moons, Preferences |

### Completed Tasks
- [x] Create navigation config with Heroicons (`components/navigation/types.tsx`)
- [x] Implement mobile bottom tab bar with slide-up sheets (Headless UI Dialog)
- [x] Implement desktop horizontal nav with Popover dropdowns
- [x] Add hamburger menu for medium screens (md to lg breakpoint)
- [x] Full accessibility: ARIA roles, keyboard nav, focus management
- [x] Safe area insets for notched devices

### Files Created
- `apps/web/components/navigation/types.tsx` - Nav config and types
- `apps/web/components/navigation/MobileBottomNav.tsx` - Bottom tab bar
- `apps/web/components/navigation/BottomSheet.tsx` - Slide-up menu
- `apps/web/components/navigation/DesktopNav.tsx` - Desktop nav with dropdowns
- `apps/web/components/navigation/index.ts` - Barrel export

### Responsive Breakpoints
- **Mobile (< 768px)**: Bottom tab bar with 4 tabs
- **Tablet (768px - 1024px)**: Top bar with hamburger menu
- **Desktop (> 1024px)**: Full horizontal nav with dropdowns

---

## Priority 4: Complete Newsletter System

**Status:** Partially complete (broadcast works, templates are basic)

**Goal:** Full newsletter functionality including templates, management, and unsubscribe.

### Tasks
- [ ] Create React Email templates in `apps/web/components/emails/`
  - [ ] `WeeklyUpdate.tsx` - stats + top content
  - [ ] `NewBlogPost.tsx` - blog announcement
  - [ ] `Welcome.tsx` - subscription confirmation
- [ ] Implement `/newsletter/manage` page for preference management
- [ ] Handle Resend unsubscribe webhook
- [x] Add unsubscribe link to all email templates (`{{{RESEND_UNSUBSCRIBE_URL}}}`) - done in broadcast
- [ ] Test email rendering across clients (Gmail, Outlook, Apple Mail)

### Automation (Future)
- [ ] Consider cron job for weekly automated sends
- [ ] GitHub Actions workflow for scheduled broadcasts

---

## Priority 5: Database Backup Strategy

**Status:** Not started

**Goal:** Automated backup system for PostgreSQL data.

### Current State
- Manual `pg_dump` via Docker (documented in `packages/database/README.md`)
- No automated backups

### Tasks
- [ ] Evaluate backup solutions:
  - [ ] Cron job with `pg_dump` to cloud storage (S3/GCS)
  - [ ] Managed Postgres with built-in backups (Supabase, Neon, RDS)
  - [ ] pg_basebackup for point-in-time recovery
- [ ] Implement chosen solution
- [ ] Document restore procedures
- [ ] Test restore process

### Considerations
- Backup frequency (daily recommended for this data volume)
- Retention period (30 days minimum)
- Off-site storage requirement

---

## Priority 6: Connection Pooling

**Status:** Not started

**Goal:** Prevent connection exhaustion between serverless web app and persistent ledger.

### Problem
- `apps/web` (serverless/ephemeral) opens many short-lived connections
- `apps/ledger` (persistent PM2 process) holds long-lived connections
- Risk of exhausting Postgres connection pool during traffic spikes

### Tasks
- [ ] Evaluate pooling options:
  - [ ] PgBouncer (self-hosted)
  - [ ] Prisma Accelerate (managed)
  - [ ] Supabase connection pooler (if migrating)
- [ ] Configure separate connection strings:
  - Web app → Pooled connection (transaction mode)
  - Ledger → Direct connection (session mode)
- [ ] Update `packages/database` to support both connection types
- [ ] Load test to verify improvement

### Notes
- May not be critical at current scale
- Monitor connection count before implementing

---

## Environment Variables Summary

```bash
# Newsletter & Admin (Priority 1 & 3) - REQUIRED NOW
ADMIN_PASSWORD=your_secure_password_here
RESEND_API_KEY=re_...
RESEND_SEGMENT_ID=...   # Required for broadcasts
RESEND_FROM_EMAIL=updates@updates.rcryptocurrency.com

# Database Backup (Priority 5) - Future
BACKUP_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## Quick Wins (Can Do Anytime)

- [ ] Update Turborepo (v1.10 → v2.7.5) or add `--no-daemon` to build script
- [ ] Add structured logging (pino) to `apps/ledger`
- [ ] Add health check endpoint to ledger for monitoring

---

## Reference

- [Resend Documentation](https://resend.com/docs)
- [React Email](https://react.email)
- [Radix UI Navigation Menu](https://www.radix-ui.com/primitives/docs/components/navigation-menu)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
