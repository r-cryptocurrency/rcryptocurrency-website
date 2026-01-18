import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rcryptocurrency/database';
import { isAddress } from 'viem';

// Normalize Reddit username by stripping u/ prefix if present
function normalizeUsername(username: string): string {
  return username.startsWith('u/') ? username.slice(2) : username;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address;

  if (!isAddress(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  const addressLower = address.toLowerCase();

  // Check UserAddressLink (distribution link)
  const distroLink = await prisma.userAddressLink.findFirst({
    where: { address: addressLower },
  });

  // Check Holder (ledger link)
  const holder = await prisma.holder.findUnique({
    where: { address: addressLower },
    select: { username: true },
  });

  // Also check if this username has a different address linked for distributions
  let currentDistroAddress: string | null = null;
  if (distroLink) {
    currentDistroAddress = distroLink.address;
  } else if (holder?.username) {
    // User might have a different address linked for distributions
    // Normalize the holder username (legacy data may have u/ prefix)
    const normalizedHolderUsername = normalizeUsername(holder.username);
    const userDistroLink = await prisma.userAddressLink.findUnique({
      where: { username: normalizedHolderUsername },
    });
    if (userDistroLink) {
      currentDistroAddress = userDistroLink.address;
    }
  }

  // Normalize username to strip u/ prefix if present (legacy data may have it)
  const rawUsername = distroLink?.username || holder?.username || null;
  const username = rawUsername ? normalizeUsername(rawUsername) : null;

  return NextResponse.json({
    isLinked: !!distroLink,
    username,
    linkedAt: distroLink?.linkedAt || null,
    // If user has a different distribution address
    currentDistroAddress: currentDistroAddress !== addressLower ? currentDistroAddress : null,
  });
}
