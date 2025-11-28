# Oracle Service (`apps/oracle`)

A background service that fetches high-level market and community statistics.

## Data Sources
- **CoinGecko**: Fetches MOON price, market cap, 24h volume, and 24h change.
- **Reddit JSON API**: Fetches subreddit subscriber count and active user count.

## Configuration
Configuration is handled via the **root** `.env` file.

*   **CoinGecko**: `COINGECKO_API_KEY` (Optional)

## Development

```bash
pnpm dev --filter=oracle
```
