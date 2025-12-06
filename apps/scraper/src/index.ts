import { CronJob } from 'cron';
import { runScraper } from './scraper';
import { prisma } from '@rcryptocurrency/database';

console.log('Starting Scraper Service...');

// Debug Prisma models
if (prisma) {
  // @ts-ignore
  const models = Object.keys(prisma).filter(k => !k.startsWith('_'));
  console.log('Available Prisma Models:', models);
} else {
  console.error('Prisma client is undefined!');
}

// 1. Top of the hour: NEW
new CronJob('0 * * * *', async () => {
  console.log('Running scheduled scraper (NEW)...');
  try { await runScraper('new'); } catch (e) { console.error(e); }
}).start();

// 2. Quarter past: TOP (Best/Popular)
new CronJob('15 * * * *', async () => {
  console.log('Running scheduled scraper (TOP)...');
  try { await runScraper('top'); } catch (e) { console.error(e); }
}).start();

// 3. Bottom of the hour: NEW
new CronJob('30 * * * *', async () => {
  console.log('Running scheduled scraper (NEW)...');
  try { await runScraper('new'); } catch (e) { console.error(e); }
}).start();

// 4. Quarter to: HOT
new CronJob('45 * * * *', async () => {
  console.log('Running scheduled scraper (HOT)...');
  try { await runScraper('hot'); } catch (e) { console.error(e); }
}).start();

// Run immediately on startup
(async () => {
  console.log('Running initial scrape (NEW & TOP)...');
  try {
    await runScraper('new');
    console.log('Initial NEW scrape complete. Starting TOP...');
    await runScraper('top');
    console.log('Initial TOP scrape complete.');
  } catch (e) {
    console.error('Error during initial scrape:', e);
  }
})();
