import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rcryptocurrency/database';
import { getAddress, isAddress } from 'viem';

interface VerifyRequest {
  commentUrl: string;
  connectedAddress: string;
}

// Parse Reddit comment URL to extract thread ID and comment ID
function parseRedditUrl(url: string): { threadId: string; commentId: string } | null {
  // Supports formats:
  // https://www.reddit.com/r/CryptoCurrency/comments/abc123/title/def456/
  // https://reddit.com/r/CryptoCurrency/comments/abc123/title/def456
  // https://old.reddit.com/r/CryptoCurrency/comments/abc123/title/def456/
  // https://www.reddit.com/r/CryptoCurrency/comments/abc123/comment/def456/ (new Reddit share format)

  // Try standard format with title slug
  let match = url.match(/reddit\.com\/r\/\w+\/comments\/(\w+)\/[^/]+\/(\w+)/);
  if (match) {
    return { threadId: match[1], commentId: match[2] };
  }

  // Try format without title (some share links)
  match = url.match(/reddit\.com\/r\/\w+\/comments\/(\w+)\/(\w+)/);
  if (match) {
    return { threadId: match[1], commentId: match[2] };
  }

  return null;
}

// Extract ETH address from comment text, handling Reddit's formatting
// Handles: backticks, code blocks, quotes, markdown, inline text, etc.
function extractEthAddress(text: string, targetAddress: string): boolean {
  const targetLower = targetAddress.toLowerCase();

  // First try direct match (case-insensitive)
  if (text.toLowerCase().includes(targetLower)) {
    return true;
  }

  // Extract all potential ETH addresses from text using regex
  // This handles addresses wrapped in backticks, code blocks, quotes, etc.
  const ethAddressRegex = /0x[a-fA-F0-9]{40}/g;
  const foundAddresses = text.match(ethAddressRegex) || [];

  return foundAddresses.some(addr => addr.toLowerCase() === targetLower);
}

// Fetch comment with retries (Reddit caching can delay new comments)
async function fetchCommentWithRetry(
  url: string,
  maxRetries: number = 3,
  delayMs: number = 5000
): Promise<{ data: any; error?: string; status?: number }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const redditRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; r/CryptoCurrency-Verifier/1.0)',
        },
        cache: 'no-store',
      });

      if (redditRes.status === 429) {
        return { data: null, error: 'Reddit rate limited. Please try again in a minute.', status: 429 };
      }

      if (!redditRes.ok) {
        // If not found and we have retries left, wait and try again
        if (redditRes.status === 404 && attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        return { data: null, error: 'Failed to fetch comment from Reddit. Check the URL.', status: 400 };
      }

      const data = await redditRes.json();
      const commentData = data[1]?.data?.children?.[0]?.data;

      // If comment data not found in response, retry (Reddit sometimes returns empty)
      if (!commentData && attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      return { data: commentData };
    } catch (err) {
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      return { data: null, error: 'Network error fetching from Reddit.', status: 500 };
    }
  }

  return { data: null, error: 'Comment not found after multiple attempts. Please wait a moment and try again.', status: 404 };
}

export async function POST(req: NextRequest) {
  try {
    const body: VerifyRequest = await req.json();
    const { commentUrl, connectedAddress } = body;

    // Validate address format
    if (!isAddress(connectedAddress)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    const checksummedAddress = getAddress(connectedAddress);
    const addressLower = checksummedAddress.toLowerCase();

    // Parse URL
    const parsed = parseRedditUrl(commentUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid Reddit comment URL. Use the direct link to your comment.' },
        { status: 400 }
      );
    }

    // Fetch comment from Reddit's public JSON API (with retries for new comments)
    const redditUrl = `https://www.reddit.com/comments/${parsed.threadId}/_/${parsed.commentId}.json`;

    const { data: commentData, error: fetchError, status: fetchStatus } = await fetchCommentWithRetry(redditUrl);

    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: fetchStatus || 400 });
    }

    if (!commentData) {
      return NextResponse.json(
        { error: 'Comment not found. It may have been deleted or not yet visible. Please wait a moment and try again.' },
        { status: 404 }
      );
    }

    const redditUsername = commentData.author;
    const commentBody = commentData.body || '';
    const subreddit = commentData.subreddit?.toLowerCase();

    // Check if user account is deleted
    if (!redditUsername || redditUsername === '[deleted]' || redditUsername === '[removed]') {
      return NextResponse.json(
        { error: 'Cannot verify: the comment author appears to be deleted.' },
        { status: 400 }
      );
    }

    // Validate subreddit - must be cryptocurrencymoons
    if (subreddit !== 'cryptocurrencymoons') {
      return NextResponse.json(
        { error: 'Comment must be in r/CryptoCurrencyMoons. Please post there and try again.' },
        { status: 400 }
      );
    }

    // Check if comment body contains the connected address
    // Uses flexible extraction to handle Reddit formatting (backticks, code blocks, etc.)
    if (!extractEthAddress(commentBody, checksummedAddress)) {
      return NextResponse.json(
        { error: `Comment does not contain your address: ${checksummedAddress}. Make sure you copied the full address.` },
        { status: 400 }
      );
    }

    // Check if this address is already linked to a different distribution user
    // Use lowercase for consistent lookups (addresses are stored lowercase in UserAddressLink)
    const existingDistroLink = await prisma.userAddressLink.findFirst({
      where: { address: addressLower },
    });

    if (existingDistroLink && existingDistroLink.username.toLowerCase() !== redditUsername.toLowerCase()) {
      return NextResponse.json(
        { error: 'This address is already linked to another Reddit account for distributions.' },
        { status: 409 }
      );
    }

    // Check if address exists in Holder table with a DIFFERENT username
    // This protects existing ledger relationships (e.g., from CSV imports)
    const existingHolder = await prisma.holder.findUnique({
      where: { address: addressLower },
    });

    if (existingHolder?.username && existingHolder.username.toLowerCase() !== redditUsername.toLowerCase()) {
      return NextResponse.json(
        { error: `This address is already associated with Reddit user u/${existingHolder.username} in our records. If this is your address, please contact support.` },
        { status: 409 }
      );
    }

    // Ensure RedditUser exists first (UserAddressLink has FK to RedditUser)
    await prisma.redditUser.upsert({
      where: { username: redditUsername },
      update: {},
      create: {
        username: redditUsername,
        earnedMoons: 0,
      },
    });

    // Now create the links in a transaction
    // Note: Store addresses in lowercase for consistency across the system
    await prisma.$transaction([
      // Upsert the distribution link (One per user - for MOON distributions)
      prisma.userAddressLink.upsert({
        where: { username: redditUsername },
        update: {
          address: addressLower,  // Store lowercase for consistency
          verifiedAt: new Date(),
        },
        create: {
          username: redditUsername,
          address: addressLower,  // Store lowercase for consistency
        },
      }),

      // Create/update Holder for Oracle/Ledger purposes
      // Only set username if it's not already set (preserve existing relationships)
      // or if it matches the current user (re-verification)
      prisma.holder.upsert({
        where: { address: addressLower },
        update: {
          // Only update username if holder has no username yet
          // This preserves existing CSV-imported relationships
          ...(existingHolder?.username ? {} : { username: redditUsername }),
        },
        create: {
          address: addressLower,
          username: redditUsername,
          balanceNova: 0,
          balanceOne: 0,
          balanceEth: 0,
          totalBalance: 0,
        },
      })
    ]);

    return NextResponse.json({
      success: true,
      username: redditUsername,
      address: checksummedAddress,
      message: 'Address linked successfully for both distributions and ledger! You can now delete your Reddit comment.',
    });

  } catch (error) {
    console.error('Verify link error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
