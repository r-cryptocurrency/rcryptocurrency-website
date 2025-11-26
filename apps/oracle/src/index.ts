import { CronJob } from 'cron';
import { fetchCoinGeckoData } from './coingecko';
import { fetchRedditStats } from './reddit';

console.log('Starting Oracle Service...');

// Run every 5 minutes
const job = new CronJob('*/5 * * * *', async () => {
  console.log('Running scheduled tasks...');
  try {
    await fetchCoinGeckoData();
    await fetchRedditStats();
  } catch (error) {
    console.error('Error running tasks:', error);
  }
});

job.start();

// Run immediately on startup
fetchCoinGeckoData();
fetchRedditStats();
