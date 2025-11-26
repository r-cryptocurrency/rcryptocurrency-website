import { CronJob } from 'cron';
import { runScraper } from './scraper';

console.log('Starting Scraper Service...');

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
runScraper('new');
