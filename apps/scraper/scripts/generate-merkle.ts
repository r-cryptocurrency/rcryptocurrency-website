#!/usr/bin/env node
/**
 * Generate Merkle tree for a karma round distribution
 *
 * Usage: pnpm ts-node scripts/generate-merkle.ts <roundId> [tokensPerKarma]
 *
 * Example: pnpm ts-node scripts/generate-merkle.ts 70 1
 *          (1 MOON per karma point for round 70)
 */

import { prisma } from '@rcryptocurrency/database';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import * as fs from 'fs';
import * as path from 'path';
import { parseUnits, formatUnits } from 'viem';

const MOON_DECIMALS = 18;

async function main() {
  const args = process.argv.slice(2);
  const roundId = parseInt(args[0]);
  const tokensPerKarma = parseFloat(args[1] || '1');

  if (isNaN(roundId)) {
    console.error('Usage: pnpm ts-node scripts/generate-merkle.ts <roundId> [tokensPerKarma]');
    process.exit(1);
  }

  console.log(`\n=== Generating Merkle Tree for Round ${roundId} ===`);
  console.log(`Tokens per karma: ${tokensPerKarma}\n`);

  // 1. Get all karma entries for this round
  const karmaEntries = await prisma.karmaEntry.findMany({
    where: { roundId },
    orderBy: { totalKarma: 'desc' },
  });

  if (karmaEntries.length === 0) {
    console.error(`No karma entries found for round ${roundId}`);
    process.exit(1);
  }

  console.log(`Found ${karmaEntries.length} karma entries`);

  // 2. Get all verified address links
  const addressLinks = await prisma.userAddressLink.findMany();
  const usernameToAddress = new Map(
    addressLinks.map(link => [link.username.toLowerCase(), link.address])
  );

  console.log(`Found ${addressLinks.length} verified address links`);

  // 3. Build tree data - only include users with verified addresses
  // Format: [index, address, amount]
  const treeValues: [string, string, string][] = [];
  const claimsData: Record<string, {
    username: string;
    index: number;
    amount: string;
    karma: number;
    proof: string[];
  }> = {};

  let index = 0;
  let totalTokens = BigInt(0);
  let usersWithAddress = 0;
  let usersWithoutAddress = 0;

  for (const entry of karmaEntries) {
    const address = usernameToAddress.get(entry.username.toLowerCase());

    if (!address) {
      usersWithoutAddress++;
      continue;
    }

    usersWithAddress++;

    // Calculate token amount: karma * tokensPerKarma * 10^18
    const tokenAmount = parseUnits(
      (entry.totalKarma * tokensPerKarma).toString(),
      MOON_DECIMALS
    );

    treeValues.push([index.toString(), address, tokenAmount.toString()]);

    // Store for claims JSON (proof added after tree generation)
    claimsData[address.toLowerCase()] = {
      username: entry.username,
      index,
      amount: tokenAmount.toString(),
      karma: entry.totalKarma,
      proof: [], // Will be populated
    };

    totalTokens += tokenAmount;
    index++;
  }

  if (treeValues.length === 0) {
    console.error('\nNo users have verified addresses! Cannot generate tree.');
    process.exit(1);
  }

  console.log(`\nEligible users: ${usersWithAddress}`);
  console.log(`Users without verified address: ${usersWithoutAddress}`);
  console.log(`Total tokens to distribute: ${formatUnits(totalTokens, MOON_DECIMALS)} MOON`);

  // 4. Generate Merkle Tree
  // Using OpenZeppelin's standard tree format
  const tree = StandardMerkleTree.of(
    treeValues,
    ['uint256', 'address', 'uint256']
  );

  console.log(`\nMerkle Root: ${tree.root}`);

  // 5. Add proofs to claims data
  for (const [i, value] of tree.entries()) {
    const address = value[1].toLowerCase();
    if (claimsData[address]) {
      claimsData[address].proof = tree.getProof(i);
    }
  }

  // 6. Generate output files
  const outputDir = path.resolve(process.cwd(), '../../data/distributions');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Claims JSON for frontend
  const claimsFile = path.join(outputDir, `round-${roundId}-claims.json`);
  fs.writeFileSync(claimsFile, JSON.stringify(claimsData, null, 2));
  console.log(`\nClaims data: ${claimsFile}`);

  // Full tree dump for verification/debugging
  const treeFile = path.join(outputDir, `round-${roundId}-tree.json`);
  fs.writeFileSync(treeFile, JSON.stringify(tree.dump(), null, 2));
  console.log(`Tree dump: ${treeFile}`);

  // Summary file
  const summary = {
    roundId,
    merkleRoot: tree.root,
    totalAmount: totalTokens.toString(),
    totalAmountFormatted: formatUnits(totalTokens, MOON_DECIMALS),
    tokensPerKarma,
    eligibleUsers: usersWithAddress,
    generatedAt: new Date().toISOString(),
  };

  const summaryFile = path.join(outputDir, `round-${roundId}-summary.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`Summary: ${summaryFile}`);

  console.log('\n=== Generation Complete ===\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
