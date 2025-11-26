# Oracle Service (`apps/oracle`)

A background service that fetches high-level market and community statistics.

## Data Sources
- **CoinGecko**: Fetches MOON price, market cap, 24h volume, and 24h change.
- **Reddit JSON API**: Fetches subreddit subscriber count and active user count.

## Configuration
If you have a CoinGecko Pro API key or want to avoid rate limits, add it to `.env` (copy from `.env.example`):

```env
COINGECKO_API_KEY=your_api_key_here
```

## Development

```bash
pnpm dev --filter=oracle
```
