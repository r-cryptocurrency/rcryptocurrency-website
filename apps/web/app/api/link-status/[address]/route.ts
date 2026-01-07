import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rcryptocurrency/database';
import { isAddress } from 'viem';

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
    const userDistroLink = await prisma.userAddressLink.findUnique({
      where: { username: holder.username },
    });
    if (userDistroLink) {
      currentDistroAddress = userDistroLink.address;
    }
  }

  return NextResponse.json({
    isLinked: !!distroLink,
    username: distroLink?.username || holder?.username || null,
    linkedAt: distroLink?.linkedAt || null,
    // If user has a different distribution address
    currentDistroAddress: currentDistroAddress !== addressLower ? currentDistroAddress : null,
  });
}
