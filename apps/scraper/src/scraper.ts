import axios from 'axios';
import { prisma } from '@rcryptocurrency/database';
import { analyzeSentiment, findProjectMentions } from './analyzer';
import { updateKarmaForUser, getOrCreateCurrentRound, getRoundForDate, getRoundDates } from './karma';

const USER_AGENT = 'Reddit-Scraper/1.0 (by /u/TheMoonDistributor)';
const SUBREDDIT = 'CryptoCurrency';
const DELAY_MS = 5000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Debug helper
function checkPrisma() {
  if (!prisma) {
    console.error('CRITICAL: Prisma client is undefined in scraper.ts!');
    return false;
  }
  if (!prisma.redditPost) {
    console.error('CRITICAL: prisma.redditPost is undefined! Available models:', Object.keys(prisma).filter(k => !k.startsWith('_')));
    return false;
  }
  return true;
}

async function fetchWithRetry(url: string, retries = 3, backoff = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn(`Rate limited (429) on ${url}. Waiting ${backoff/1000}s...`);
        await delay(backoff);
        backoff *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

async function upsertWithRetry(operation: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      if (error?.code === 'P2024' || error?.message?.includes('Timed out')) {
        console.log(`Database timeout, retrying (${i + 1}/${retries})...`);
        await delay(1000 * (i + 1));
        continue;
      }
      throw error;
    }
  }
}

export async function runScraper(sortType: 'new' | 'hot' | 'top' = 'new') {
  if (!checkPrisma()) {
    throw new Error('Prisma client not ready');
  }

  console.log(`Scraping r/${SUBREDDIT} (${sortType}) via public JSON...`);
  
  try {
    // Construct URL based on sort type
    let url = `https://www.reddit.com/r/${SUBREDDIT}/${sortType}.json?limit=50`;
    if (sortType === 'top') {
      url += '&t=day'; // Top posts of the day
    }

    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT }
    });

    const posts = response.data.data.children;

    for (const item of posts) {
      const post = item.data;
      
      // Process Post
      const sentiment = analyzeSentiment(post.title + ' ' + (post.selftext || ''));
      const mentions = findProjectMentions(post.title + ' ' + (post.selftext || ''));

      try {
        // Check if post already exists to calculate karma delta
        const existingPost = await prisma.redditPost.findUnique({
          where: { id: post.id },
          select: { score: true }
        });
        const oldScore = existingPost?.score || 0;
        const scoreChange = post.score - oldScore;

        await upsertWithRetry(() => prisma.redditPost.upsert({
          where: { id: post.id },
          update: {
            score: post.score,
            numComments: post.num_comments,
            updatedAt: new Date(),
          },
          create: {
            id: post.id,
            title: post.title,
            author: post.author,
            score: post.score,
            url: post.url,
            createdUtc: new Date(post.created_utc * 1000),
            selftext: post.selftext || '',
            flair: post.link_flair_text,
            numComments: post.num_comments,
            sentiment: sentiment,
            mentions: {
              create: mentions.map(m => ({
                projectId: m,
                sentiment: sentiment
              }))
            }
          }
        }));

        // Track karma for current round (only new posts or score changes)
        const postDate = new Date(post.created_utc * 1000);
        const currentRound = getRoundForDate(new Date());
        const postRound = getRoundForDate(postDate);
        
        // Only track karma for posts in current round
        if (postRound === currentRound && post.author && post.author !== '[deleted]') {
          if (!existingPost) {
            // New post - record full score AND increment count
            await updateKarmaForUser(post.author, post.score, false, true);
          } else if (scoreChange !== 0) {
            // Existing post - record delta only (don't increment count)
            await updateKarmaForUser(post.author, scoreChange, false, false);
          }
        }
      } catch (err: any) {
        console.error(`Failed to upsert post ${post.id}:`, err);
        continue; // Skip to next post if this one fails
      }

      // Fetch Comments
      try {
        await delay(DELAY_MS); // Respect rate limits
        const commentsUrl = `https://www.reddit.com/comments/${post.id}.json`;
        const commentRes = await fetchWithRetry(commentsUrl);

        const comments = commentRes.data[1]?.data?.children || [];

        for (const cItem of comments) {
          if (cItem.kind === 'more') continue;
          const comment = cItem.data;

          const cSentiment = analyzeSentiment(comment.body);
          const cMentions = findProjectMentions(comment.body);

          // Check if comment exists to calculate karma delta
          const existingComment = await prisma.redditComment.findUnique({
            where: { id: comment.id },
            select: { score: true }
          });
          const oldCommentScore = existingComment?.score || 0;
          const commentScoreChange = comment.score - oldCommentScore;

          await upsertWithRetry(() => prisma.redditComment.upsert({
            where: { id: comment.id },
            update: {
              score: comment.score,
              updatedAt: new Date()
            },
            create: {
              id: comment.id,
              post: { connect: { id: post.id } },
              author: comment.author,
              body: comment.body,
              score: comment.score,
              createdUtc: new Date(comment.created_utc * 1000),
              sentiment: cSentiment,
              mentions: {
                create: cMentions.map(m => ({
                  projectId: m,
                  sentiment: cSentiment
                }))
              }
            }
          }));

          // Track comment karma for current round
          const commentDate = new Date(comment.created_utc * 1000);
          const currentRound = getRoundForDate(new Date());
          const commentRound = getRoundForDate(commentDate);
          
          if (commentRound === currentRound && comment.author && comment.author !== '[deleted]') {
            if (!existingComment) {
              // New comment - record full score AND increment count
              await updateKarmaForUser(comment.author, comment.score, true, true);
            } else if (commentScoreChange !== 0) {
              // Existing comment - record delta only (don't increment count)
              await updateKarmaForUser(comment.author, commentScoreChange, true, false);
            }
          }
          
          await delay(100); // Small delay to ease DB load
        }
      } catch (err: any) {
        console.error(`Error fetching comments for ${post.id}:`, err);
      }
    }
    console.log(`Scraping complete. Processed ${posts.length} posts.`);
  } catch (error) {
    console.error('Scraping failed:', error);
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.log('Rate limited. Waiting before retry...');
    }
  }
}
