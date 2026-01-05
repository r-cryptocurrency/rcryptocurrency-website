import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rcryptocurrency/database';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();

  // Get active distribution rounds
  const activeRounds = await prisma.distributionRound.findMany({
    where: { isActive: true },
    orderBy: { id: 'desc' },
  });

  const claims = [];

  for (const round of activeRounds) {
    // Load claims JSON for this round
    // Note: This assumes the data directory is available at the project root
    const claimsPath = path.resolve(
      process.cwd(),
      `../../data/distributions/round-${round.id}-claims.json`
    );

    if (!fs.existsSync(claimsPath)) {
      console.warn(`Claims file not found: ${claimsPath}`);
      continue;
    }

    try {
      const claimsData = JSON.parse(fs.readFileSync(claimsPath, 'utf-8'));
      const claim = claimsData[address];

      if (claim) {
        claims.push({
          roundId: round.id,
          address: address, // Explicitly include address
          ...claim,
          expirationDate: round.expirationDate,
          contractAddress: round.contractAddress,
          tokenAddress: round.tokenAddress,
        });
      }
    } catch (e) {
      console.error(`Error reading claims for round ${round.id}:`, e);
    }
  }

  return NextResponse.json({ claims });
}
