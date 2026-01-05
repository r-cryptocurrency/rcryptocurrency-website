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

  const match = url.match(/reddit\.com\/r\/\w+\/comments\/(\w+)\/[^/]+\/(\w+)/);
  if (!match) return null;

  return {
    threadId: match[1],
    commentId: match[2],
  };
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

    // Fetch comment from Reddit's public JSON API
    const redditUrl = `https://www.reddit.com/comments/${parsed.threadId}/_/${parsed.commentId}.json`;

    const redditRes = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; r/CryptoCurrency-Verifier/1.0)',
      },
      next: { revalidate: 0 }, // Don't cache
    });

    if (!redditRes.ok) {
      if (redditRes.status === 429) {
        return NextResponse.json(
          { error: 'Reddit rate limited. Please try again in a minute.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch comment from Reddit. Check the URL.' },
        { status: 400 }
      );
    }

    const data = await redditRes.json();

    // Reddit returns array: [thread, comments]
    const commentData = data[1]?.data?.children?.[0]?.data;

    if (!commentData) {
      return NextResponse.json(
        { error: 'Comment not found. It may have been deleted.' },
        { status: 404 }
      );
    }

    const redditUsername = commentData.author;
    const commentBody = commentData.body || '';
    const subreddit = commentData.subreddit?.toLowerCase();

    // Validate subreddit - must be cryptocurrencymoons (or allow main sub for flexibility, but instruction says cryptocurrencymoons)
    // The TODO-distribution.md says r/CryptoCurrencyMoons
    if (subreddit !== 'cryptocurrencymoons') {
      return NextResponse.json(
        { error: 'Comment must be in r/CryptoCurrencyMoons. Please post there and try again.' },
        { status: 400 }
      );
    }

    // Check if comment body contains the connected address
    if (!commentBody.toLowerCase().includes(addressLower)) {
      return NextResponse.json(
        { error: `Comment does not contain your address: ${checksummedAddress}` },
        { status: 400 }
      );
    }

    // Check if this address is already linked to a different distribution user
    const existingByAddress = await prisma.userAddressLink.findFirst({
      where: { address: checksummedAddress },
    });

    if (existingByAddress && existingByAddress.username !== redditUsername) {
      return NextResponse.json(
        { error: 'This address is already linked to another Reddit account for distributions.' },
        { status: 409 }
      );
    }

    // 1. Transaction to update both tables
    await prisma.$transaction([
      // Upsert the distribution link (One per user)
      prisma.userAddressLink.upsert({
        where: { username: redditUsername },
        update: {
          address: checksummedAddress,
          verifiedAt: new Date(),
        },
        create: {
          username: redditUsername,
          address: checksummedAddress,
        },
      }),

      // Also ensure the RedditUser exists (if not already)
      prisma.redditUser.upsert({
        where: { username: redditUsername },
        update: {},
        create: { 
          username: redditUsername,
          earnedMoons: 0,
        },
      }),

      // Create/update Holder for Oracle/Ledger purposes
      prisma.holder.upsert({
        where: { address: addressLower },
        update: {
          username: redditUsername,
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
