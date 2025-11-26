# Web Dashboard (`apps/web`)

The user-facing frontend for the r/CryptoCurrency ecosystem.

## Tech Stack
- **Framework**: Next.js 13 (App Router)
- **Styling**: Tailwind CSS
- **Components**: Tremor (Charts, Cards, Metrics)
- **Database**: Prisma Client (via `@rcryptocurrency/database`)

## Features
- **Home Page**: Real-time MOON price, market cap, volume stats, and subreddit subscriber counts. Includes a timeline of MOON history.
- **Richlist**: 
  - Top 100 MOON holders across Arbitrum Nova, One, and Ethereum.
  - **Search**: Real-time search by address, username, or label.
  - **Sorting**: Sort by Total Balance, Chain Balance, Earned Moons, or Last Active Date.
  - **Activity Tracking**: Shows the last time an address sent a transaction.
  - **Labels**: Identifies known exchange and bridge addresses.
- **Scraper Data**: Visualization of Reddit sentiment and project mentions.
- **Theming**: 
  - Built-in Dark/Light mode toggle.
  - Custom "Floaty Icons" background animation.
  - Glassmorphism card effects.

## Configuration
No environment variables are currently required. See `.env.example`.

## Development

Run the development server:

```bash
pnpm dev --filter=web
```

Open [http://localhost:3000](http://localhost:3000) with your browser.
