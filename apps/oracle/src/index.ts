import { CronJob } from 'cron';
import { updateMarketData } from './market-data';
import { fetchRedditStats } from './reddit';

console.log('Starting Oracle Service...');
console.log('Market data sources: Kraken (primary) -> Pool calc -> CoinGecko (fallback)');

// Run every 5 minutes
const job = new CronJob('*/5 * * * *', async () => {
  console.log('Running scheduled tasks...');
  try {
    await updateMarketData();
    await fetchRedditStats();
  } catch (error) {
    console.error('Error running tasks:', error);
  }
});

job.start();

// Run immediately on startup
updateMarketData();
fetchRedditStats();
