import axios from 'axios';
import { prisma } from '@rcryptocurrency/database';
import { CronJob } from 'cron';
import dotenv from 'dotenv';

dotenv.config();

async function fetchNewActivity() {
  console.log('Polling r/CryptoCurrency via Public JSON...');
  
  try {
    // Fetch last 100 submissions from public JSON
    const response = await axios.get('https://www.reddit.com/r/CryptoCurrency/new.json?limit=100', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const submissions = response.data.data.children.map((child: any) => child.data);

    for (const post of submissions) {
      // Ensure user exists (or update their last seen)
      await prisma.redditUser.upsert({
        where: { username: post.author },
        update: { lastScraped: new Date() },
        create: { username: post.author }
      });

      // Upsert submission
      // We use Upsert because we might encounter the same post multiple times 
      // in subsequent polls, and we want to update its score (upvotes change over time).
      
      await prisma.submission.upsert({
        where: { id: post.id },
        update: { score: post.score }, // Update score as it grows
        create: {
          id: post.id,
          authorName: post.author,
          title: post.title,
          subreddit: post.subreddit,
          score: post.score,
          isComment: false,
          createdAt: new Date(post.created_utc * 1000)
        }
      });
    }
    console.log(`Processed ${submissions.length} posts.`);
  } catch (error) {
    console.error('Error fetching Reddit data:', error);
  }
}

async function fetchMarketData() {
  console.log('Fetching MOON market data and Reddit stats...');
  try {
    // 1. Fetch CoinGecko Data
    const apiKey = process.env.COINGECKO_API_KEY;
    const headers = apiKey ? { 'x-cg-demo-api-key': apiKey } : {};
    
    const cgResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=moon&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true', {
      headers
    });
    const cgData = cgResponse.data.moon;

    // 2. Fetch Reddit Subreddit Stats
    const redditResponse = await axios.get('https://www.reddit.com/r/CryptoCurrency/about.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const redditData = redditResponse.data.data;

    if (cgData) {
      await prisma.marketStat.create({
        data: {
          priceUsd: cgData.usd,
          marketCap: cgData.usd_market_cap,
          volume24h: cgData.usd_24h_vol,
          change24h: cgData.usd_24h_change,
          redditSubscribers: redditData.subscribers,
          activeUsers: redditData.active_user_count
        }
      });
      console.log(`Market data updated: $${cgData.usd} | Subscribers: ${redditData.subscribers}`);
    }
  } catch (error) {
    console.error('Error fetching market/reddit data:', error);
  }
}

async function ensureUserExists(username: string) {
  // Simple helper to create user record if missing
  await prisma.redditUser.upsert({
    where: { username },
    update: { lastScraped: new Date() },
    create: { username, lastScraped: new Date() }
  });
}

// Run every 5 minutes to ensure we don't miss high-velocity posting periods
const job = new CronJob('*/5 * * * *', fetchNewActivity);
job.start();

// Run every 10 minutes for market data
const marketJob = new CronJob('*/10 * * * *', fetchMarketData);
marketJob.start();

// Initial run
fetchNewActivity();
fetchMarketData();
