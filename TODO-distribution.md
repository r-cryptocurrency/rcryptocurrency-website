# Decentralized MOON Distribution System

**Goal:** Allow r/CryptoCurrency users to claim MOON tokens (and eventually POL) based on their karma contributions, verified through Reddit comment proof.

**Status:** Implementation Complete - Awaiting Deployment
**Updated:** January 5, 2026

---

## New Environment Variables Required

Add these to your `.env` file:

```bash
# Contract Deployment (for MoonDistributor)
DEPLOYER_PRIVATE_KEY=0x...your_deployer_wallet_private_key

# Optional: For contract verification on Arbiscan
ARBISCAN_API_KEY=your_arbiscan_api_key
```

**Notes:**
- `DEPLOYER_PRIVATE_KEY` should be a funded wallet on Arbitrum Nova (for gas + MOON tokens)
- Get Arbiscan API key at https://nova.arbiscan.io/myapikey (optional, for contract verification)

---

## System Overview

```
                                    DECENTRALIZED DISTRIBUTION FLOW

  +------------------+     +-------------------+     +------------------+
  |   Reddit User    |     |   r/cc Website    |     |  Smart Contract  |
  |                  |     |                   |     |                  |
  |  1. Posts karma  |     |  Link Address Page|     |  MoonDistributor |
  |     content      |     |  - Connect wallet |     |  - Merkle claims |
  +--------+---------+     |  - Submit comment |     |  - Pull payments |
           |               |    URL proof      |     +--------+---------+
           v               +--------+----------+              ^
  +------------------+              |                         |
  |  Scraper (existing)            v                         |
  |  Tracks karma in  |     +-------------------+             |
  |  KarmaEntry table |     |  Verify API       |             |
  +--------+---------+     |  - Fetch Reddit   |             |
           |               |    comment JSON   |             |
           v               |  - Validate addr  |             |
  +------------------+     |  - Store link     |             |
  | export-karma-csv |     +--------+----------+             |
  | (existing script)|              |                        |
  +--------+---------+     +--------v----------+             |
           |               |  UserAddressLink  |             |
           v               |  (new DB table)   |             |
  +------------------+     +--------+----------+             |
  | generate-merkle  |              |                        |
  | (new script)     |<-------------+                        |
  |  - Join karma    |                                       |
  |  - Build tree    |     +-------------------+             |
  |  - Output JSON   +---->|  Claim Page       +-------------+
  +------------------+     |  - Select round   |
                           |  - View eligible  |
                           |  - Submit claim   |
                           +-------------------+
```

---

## Phase 1: Database Schema Updates

### 1.1 Add New Models to Prisma Schema

**File:** `packages/database/prisma/schema.prisma`

Add after the existing models:

```prisma
// Verified Reddit username <-> ETH address links for distributions
model UserAddressLink {
  id         Int        @id @default(autoincrement())
  username   String     @unique // Reddit username (without u/)
  address    String     // ETH address (checksummed)
  linkedAt   DateTime   @default(now())
  verifiedAt DateTime   @default(now())

  // Relation to existing RedditUser if exists
  user       RedditUser? @relation(fields: [username], references: [username])

  @@index([address])
  @@index([username])
}

// Distribution rounds with Merkle roots
model DistributionRound {
  id              Int       @id // Matches KarmaRound id
  merkleRoot      String    // 0x... hex string
  totalAmount     String    // BigInt as string for precision
  tokenAddress    String    // MOON contract address
  chainId         Int       // 42170 for Arbitrum Nova
  contractAddress String    // MoonDistributor contract address
  claimsJson      String?   // JSON filename or IPFS hash
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  expirationDate  DateTime

  @@index([isActive])
}

// Track individual claims (for UI status, contract is source of truth)
model DistributionClaim {
  id        Int      @id @default(autoincrement())
  roundId   Int
  username  String
  address   String
  amount    String   // BigInt as string
  index     Int      // Merkle tree leaf index
  claimedAt DateTime?
  txHash    String?

  @@unique([roundId, username])
  @@index([roundId])
  @@index([address])
}
```

### 1.2 Update RedditUser Model

Add relation to UserAddressLink:

```prisma
model RedditUser {
  username       String           @id
  rawUpvotes     Int              @default(0)
  estimatedKarma Float            @default(0)
  earnedMoons    Float            @default(0)
  lastScraped    DateTime         @updatedAt
  holders        Holder[]
  submissions    Submission[]
  addressLink    UserAddressLink? // NEW: Add this line
}
```

### 1.3 Apply Schema

```bash
cd /home/jw/src/rcryptocurrency-site
pnpm --filter @rcryptocurrency/database db:push
# Or create migration:
# pnpm prisma migrate dev --name add-distribution-tables
```

---

## Phase 2: Web App Dependencies

### 2.1 Install Wallet Connection Libraries

```bash
cd apps/web
pnpm add wagmi@2 viem@2 @tanstack/react-query
```

### 2.2 Create Wagmi Config

**File:** `apps/web/lib/wagmi.ts`

```typescript
import { http, createConfig } from 'wagmi';
import { arbitrumNova } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Custom Arbitrum Nova chain with public RPC
const arbitrumNovaCustom = {
  ...arbitrumNova,
  rpcUrls: {
    default: { http: ['https://nova.arbitrum.io/rpc'] },
  },
} as const;

export const config = createConfig({
  chains: [arbitrumNovaCustom],
  connectors: [
    injected(), // Supports MetaMask, Coinbase Wallet, Brave, etc.
  ],
  transports: {
    [arbitrumNovaCustom.id]: http('https://nova.arbitrum.io/rpc'),
  },
  ssr: true,
});
```

### 2.3 Create Providers Wrapper

**File:** `apps/web/components/Providers.tsx`

```tsx
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 2.4 Update Root Layout

**File:** `apps/web/app/layout.tsx`

Wrap children with `<Providers>`:

```tsx
import { Providers } from '@/components/Providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {/* existing layout */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

---

## Phase 3: Link Address Feature (One-Time Verification)

**Important:** Users only need to verify their Reddit account ONCE. After linking, their `UserAddressLink` record persists and they can claim from any future distribution round automatically. The verification proves they own the Reddit account - it's not required for each claim.

### 3.1 Verification API

**File:** `apps/web/app/api/verify-link/route.ts`

```typescript
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

    // Validate subreddit - must be r/CryptoCurrencyMoons
    if (subreddit !== 'cryptocurrencymoons') {
      return NextResponse.json(
        { error: 'Comment must be in r/CryptoCurrencyMoons. Please post there and try again.' },
        { status: 400 }
      );
    }

    // Check if comment body contains the connected address
    const checksummedAddress = getAddress(connectedAddress);
    const addressLower = connectedAddress.toLowerCase();

    if (!commentBody.toLowerCase().includes(addressLower)) {
      return NextResponse.json(
        { error: `Comment does not contain your address: ${checksummedAddress}` },
        { status: 400 }
      );
    }

    // Check if this address is already linked to a different user
    const existingByAddress = await prisma.userAddressLink.findFirst({
      where: { address: checksummedAddress },
    });

    if (existingByAddress && existingByAddress.username !== redditUsername) {
      return NextResponse.json(
        { error: 'This address is already linked to another Reddit account.' },
        { status: 409 }
      );
    }

    // Upsert the link
    await prisma.userAddressLink.upsert({
      where: { username: redditUsername },
      update: {
        address: checksummedAddress,
        verifiedAt: new Date(),
      },
      create: {
        username: redditUsername,
        address: checksummedAddress,
      },
    });

    return NextResponse.json({
      success: true,
      username: redditUsername,
      address: checksummedAddress,
      message: 'Address linked successfully! You can now delete your Reddit comment.',
    });

  } catch (error) {
    console.error('Verify link error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
```

### 3.2 Link Address Page

**File:** `apps/web/app/link/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface VerifyResult {
  success?: boolean;
  username?: string;
  address?: string;
  message?: string;
  error?: string;
}

export default function LinkAddressPage() {
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [commentUrl, setCommentUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleVerify = async () => {
    if (!isConnected || !address || !commentUrl.trim()) return;

    setStatus('loading');
    setResult(null);

    try {
      const res = await fetch('/api/verify-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentUrl: commentUrl.trim(),
          connectedAddress: address,
        }),
      });

      const data = await res.json();
      setResult(data);
      setStatus(data.success ? 'success' : 'error');
    } catch (err) {
      setResult({ error: 'Network error. Please try again.' });
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-2">
          Link Reddit to Ethereum
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Verify ownership of your Reddit account to claim MOON rewards
        </p>

        {/* Step 1: Connect Wallet */}
        <div className="flex justify-center mb-8">
          {isConnected ? (
            <div className="flex items-center gap-4">
              <span className="bg-gray-800 px-4 py-2 rounded-lg text-sm font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="text-gray-400 hover:text-white text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: injected() })}
              disabled={isConnecting}
              className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-lg font-semibold"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>

        {isConnected && (
          <div className="bg-gray-900 rounded-xl p-6 space-y-6">
            {/* Instructions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                <li>
                  Copy your wallet address:
                  <code className="ml-2 bg-gray-800 px-2 py-1 rounded text-sm text-orange-400 break-all">
                    {address}
                  </code>
                </li>
                <li>
                  Go to{' '}
                  <a
                    href="https://www.reddit.com/r/CryptoCurrencyMoons/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    r/CryptoCurrencyMoons
                  </a>{' '}
                  and post a comment containing ONLY your address (any thread works)
                </li>
                <li>
                  Right-click your comment and copy the "Share" or "Permalink" link
                </li>
                <li>
                  Paste the link below and click Verify
                </li>
                <li>
                  After verification succeeds, you can delete your comment
                </li>
              </ol>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Reddit Comment URL
              </label>
              <input
                type="url"
                placeholder="https://www.reddit.com/r/CryptoCurrency/comments/..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg
                           text-white placeholder-gray-500 focus:outline-none
                           focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={commentUrl}
                onChange={(e) => setCommentUrl(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={status === 'loading' || !commentUrl.trim()}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700
                         disabled:cursor-not-allowed py-3 rounded-lg font-semibold
                         transition-colors"
            >
              {status === 'loading' ? 'Verifying...' : 'Verify Link'}
            </button>

            {/* Result Messages */}
            {status === 'success' && result && (
              <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
                <p className="text-green-400 font-medium">
                  Successfully linked u/{result.username} to {result.address?.slice(0, 10)}...
                </p>
                <p className="text-green-300 text-sm mt-1">
                  {result.message}
                </p>
              </div>
            )}

            {status === 'error' && result?.error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
                <p className="text-red-400">{result.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Already Linked Status - could add this later */}
      </div>
    </div>
  );
}
```

---

## Phase 4: Smart Contract

### 4.1 Contract Setup

Create contracts directory:
```bash
mkdir -p packages/chain-data/contracts
```

**File:** `packages/chain-data/contracts/MoonDistributor.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MoonDistributor
 * @notice Merkle-based token distributor for r/CryptoCurrency karma rewards
 * @dev Each distribution round has its own merkle root. Users claim by providing proof.
 */
contract MoonDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Distribution {
        bytes32 merkleRoot;
        address token;
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 expirationTime;
        bool isSwept;
    }

    // Round ID => Distribution
    mapping(uint256 => Distribution) public distributions;

    // Round ID => (Leaf Index => Claimed bit)
    // Uses bitmap for gas efficiency
    mapping(uint256 => mapping(uint256 => uint256)) private claimedBitMap;

    event DistributionCreated(
        uint256 indexed roundId,
        address indexed token,
        bytes32 merkleRoot,
        uint256 totalAmount,
        uint256 expirationTime
    );

    event Claimed(
        uint256 indexed roundId,
        uint256 indexed index,
        address indexed account,
        uint256 amount
    );

    event Swept(
        uint256 indexed roundId,
        address indexed token,
        uint256 amount
    );

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    /**
     * @notice Create a new distribution round
     * @param _roundId The karma round ID (matches off-chain data)
     * @param _merkleRoot Root of the merkle tree containing all claims
     * @param _token Token to distribute (MOON address)
     * @param _totalAmount Total tokens to lock for this round
     * @param _durationDays How long claims are open (e.g., 90 days)
     */
    function createDistribution(
        uint256 _roundId,
        bytes32 _merkleRoot,
        address _token,
        uint256 _totalAmount,
        uint256 _durationDays
    ) external onlyOwner {
        require(distributions[_roundId].expirationTime == 0, "Round exists");
        require(_merkleRoot != bytes32(0), "Invalid root");
        require(_totalAmount > 0, "Invalid amount");
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");

        uint256 expiration = block.timestamp + (_durationDays * 1 days);

        distributions[_roundId] = Distribution({
            merkleRoot: _merkleRoot,
            token: _token,
            totalAmount: _totalAmount,
            claimedAmount: 0,
            expirationTime: expiration,
            isSwept: false
        });

        // Transfer tokens from owner to this contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _totalAmount);

        emit DistributionCreated(_roundId, _token, _merkleRoot, _totalAmount, expiration);
    }

    /**
     * @notice Check if a specific claim index has been claimed
     */
    function isClaimed(uint256 _roundId, uint256 _index) public view returns (bool) {
        uint256 wordIndex = _index / 256;
        uint256 bitIndex = _index % 256;
        uint256 word = claimedBitMap[_roundId][wordIndex];
        uint256 mask = (1 << bitIndex);
        return word & mask == mask;
    }

    /**
     * @notice Claim tokens for a distribution round
     * @param _roundId The round to claim from
     * @param _index Leaf index in the merkle tree
     * @param _account Address to receive tokens (must match proof)
     * @param _amount Amount to claim (must match proof)
     * @param _merkleProof Proof of inclusion in the tree
     */
    function claim(
        uint256 _roundId,
        uint256 _index,
        address _account,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external nonReentrant {
        Distribution storage dist = distributions[_roundId];

        require(dist.expirationTime > 0, "Round does not exist");
        require(block.timestamp <= dist.expirationTime, "Round expired");
        require(!isClaimed(_roundId, _index), "Already claimed");

        // Verify the merkle proof
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_index, _account, _amount))));
        require(
            MerkleProof.verify(_merkleProof, dist.merkleRoot, leaf),
            "Invalid proof"
        );

        // Mark as claimed
        uint256 wordIndex = _index / 256;
        uint256 bitIndex = _index % 256;
        claimedBitMap[_roundId][wordIndex] |= (1 << bitIndex);

        // Update claimed amount
        dist.claimedAmount += _amount;

        // Transfer tokens
        IERC20(dist.token).safeTransfer(_account, _amount);

        emit Claimed(_roundId, _index, _account, _amount);
    }

    /**
     * @notice Sweep unclaimed tokens after expiration
     * @param _roundId The expired round to sweep
     */
    function sweep(uint256 _roundId) external onlyOwner {
        Distribution storage dist = distributions[_roundId];

        require(dist.expirationTime > 0, "Round does not exist");
        require(block.timestamp > dist.expirationTime, "Not expired");
        require(!dist.isSwept, "Already swept");

        uint256 unclaimed = dist.totalAmount - dist.claimedAmount;
        require(unclaimed > 0, "Nothing to sweep");

        dist.isSwept = true;

        IERC20(dist.token).safeTransfer(owner(), unclaimed);

        emit Swept(_roundId, dist.token, unclaimed);
    }

    /**
     * @notice View function to get distribution details
     */
    function getDistribution(uint256 _roundId) external view returns (
        bytes32 merkleRoot,
        address token,
        uint256 totalAmount,
        uint256 claimedAmount,
        uint256 expirationTime,
        bool isSwept,
        bool isActive
    ) {
        Distribution storage dist = distributions[_roundId];
        return (
            dist.merkleRoot,
            dist.token,
            dist.totalAmount,
            dist.claimedAmount,
            dist.expirationTime,
            dist.isSwept,
            dist.expirationTime > 0 && block.timestamp <= dist.expirationTime
        );
    }
}
```

### 4.2 Hardhat Setup in packages/chain-data

```bash
cd packages/chain-data
pnpm add -D hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
```

**File:** `packages/chain-data/hardhat.config.ts`

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    arbitrumNova: {
      url: process.env.QUICKNODE_URL_NOVA || "https://nova.arbitrum.io/rpc",
      chainId: 42170,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    arbitrumOne: {
      url: process.env.QUICKNODE_URL_ONE || "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      arbitrumNova: process.env.ARBISCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumNova",
        chainId: 42170,
        urls: {
          apiURL: "https://api-nova.arbiscan.io/api",
          browserURL: "https://nova.arbiscan.io",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
```

**File:** `packages/chain-data/scripts/deploy-distributor.ts`

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MoonDistributor with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const MoonDistributor = await ethers.getContractFactory("MoonDistributor");
  const distributor = await MoonDistributor.deploy(deployer.address);

  await distributor.waitForDeployment();
  const address = await distributor.getAddress();

  console.log("MoonDistributor deployed to:", address);
  console.log("\nUpdate packages/chain-data/src/addresses.ts with:");
  console.log(`  DISTRIBUTOR_CONTRACTS: { arbitrumNova: '${address}' }`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Update:** `packages/chain-data/package.json`

```json
{
  "scripts": {
    "compile": "hardhat compile",
    "deploy:nova": "hardhat run scripts/deploy-distributor.ts --network arbitrumNova",
    "deploy:local": "hardhat run scripts/deploy-distributor.ts --network hardhat",
    "verify": "hardhat verify --network arbitrumNova"
  }
}
```

### 4.3 Deployment Steps

```bash
# 1. Compile contract
cd packages/chain-data
pnpm compile

# 2. Deploy to Arbitrum Nova
pnpm deploy:nova

# 3. Verify on Arbiscan (optional)
pnpm verify <CONTRACT_ADDRESS> <OWNER_ADDRESS>

# 4. Update addresses.ts with deployed address
```

### 4.4 Export Contract ABI

After compilation, export ABI for web app:

**File:** `packages/chain-data/src/abis/MoonDistributor.ts`

```typescript
export const MOON_DISTRIBUTOR_ABI = [
  // ... ABI from compilation
] as const;
```

**File:** `packages/chain-data/src/addresses.ts`

Add:
```typescript
export const DISTRIBUTOR_CONTRACTS = {
  arbitrumNova: '0x...', // After deployment
} as const;
```

---

## Phase 5: Merkle Tree Generation

### 5.1 Install Dependencies

```bash
cd apps/scraper
pnpm add @openzeppelin/merkle-tree
```

### 5.2 Generate Merkle Script

**File:** `apps/scraper/scripts/generate-merkle.ts`

```typescript
#!/usr/bin/env node
/**
 * Generate Merkle tree for a karma round distribution
 *
 * Usage: pnpm tsx scripts/generate-merkle.ts <roundId> [tokensPerKarma]
 *
 * Example: pnpm tsx scripts/generate-merkle.ts 70 1
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
    console.error('Usage: pnpm tsx scripts/generate-merkle.ts <roundId> [tokensPerKarma]');
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
  const treeValues: [bigint, string, bigint][] = [];
  const claimsData: Record<string, {
    username: string;
    index: number;
    amount: string;
    karma: number;
    proof: string[];
  }> = {};

  let index = 0;
  let totalTokens = 0n;
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

    treeValues.push([BigInt(index), address, tokenAmount]);

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
  // Using OpenZeppelin's standard tree format compatible with their MerkleProof library
  const tree = StandardMerkleTree.of(
    treeValues.map(v => [v[0].toString(), v[1], v[2].toString()]),
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
  const outputDir = path.resolve(__dirname, '../../../data/distributions');
  fs.mkdirSync(outputDir, { recursive: true });

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

  // 7. Optionally save to database
  const saveToDb = process.argv.includes('--save');
  if (saveToDb) {
    // You would need to have the contract address and chain info
    console.log('\n--save flag detected, but contract deployment needed first');
  }

  console.log('\n=== Generation Complete ===\n');
  console.log('Next steps:');
  console.log('1. Deploy/fund MoonDistributor contract with', formatUnits(totalTokens, MOON_DECIMALS), 'MOON');
  console.log('2. Call createDistribution() with merkle root:', tree.root);
  console.log('3. Copy claims JSON to web app public folder or serve via API');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 5.3 Add Script to package.json

**File:** `apps/scraper/package.json`

```json
{
  "scripts": {
    "generate-merkle": "tsx scripts/generate-merkle.ts"
  }
}
```

---

## Phase 6: Claim Page

### 6.1 Claims API (for dynamic round selection)

**File:** `apps/web/app/api/claims/[address]/route.ts`

```typescript
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
    const claimsPath = path.resolve(
      process.cwd(),
      `../../data/distributions/round-${round.id}-claims.json`
    );

    if (!fs.existsSync(claimsPath)) continue;

    const claimsData = JSON.parse(fs.readFileSync(claimsPath, 'utf-8'));
    const claim = claimsData[address];

    if (claim) {
      claims.push({
        roundId: round.id,
        ...claim,
        expirationDate: round.expirationDate,
        contractAddress: round.contractAddress,
        tokenAddress: round.tokenAddress,
      });
    }
  }

  return NextResponse.json({ claims });
}
```

### 6.2 Claim Page

**File:** `apps/web/app/claim/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { formatUnits } from 'viem';
import { MOON_DISTRIBUTOR_ABI } from '@rcryptocurrency/chain-data';

interface ClaimInfo {
  roundId: number;
  username: string;
  index: number;
  amount: string;
  karma: number;
  proof: string[];
  expirationDate: string;
  contractAddress: string;
  tokenAddress: string;
}

export default function ClaimPage() {
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const [claims, setClaims] = useState<ClaimInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  // Fetch eligible claims for connected address
  useEffect(() => {
    if (!address) {
      setClaims([]);
      return;
    }

    setLoading(true);
    fetch(`/api/claims/${address}`)
      .then(res => res.json())
      .then(data => {
        setClaims(data.claims || []);
        if (data.claims?.length > 0) {
          setSelectedRound(data.claims[0].roundId);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  const selectedClaim = claims.find(c => c.roundId === selectedRound);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-2">
          Claim MOON Rewards
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Claim your karma-based MOON distribution
        </p>

        <div className="flex justify-center mb-8">
          {isConnected ? (
            <div className="flex items-center gap-4">
              <span className="bg-gray-800 px-4 py-2 rounded-lg text-sm font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="text-gray-400 hover:text-white text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: injected() })}
              disabled={isConnecting}
              className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-lg font-semibold"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>

        {isConnected && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center text-gray-400">Loading claims...</div>
            ) : claims.length === 0 ? (
              <div className="bg-gray-900 rounded-xl p-6 text-center">
                <p className="text-gray-400">
                  No active claims found for this address.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Make sure you have{' '}
                  <a href="/link" className="text-orange-400 hover:underline">
                    linked your Reddit account
                  </a>{' '}
                  and earned karma in an active round.
                </p>
              </div>
            ) : (
              <>
                {/* Round Selector */}
                {claims.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {claims.map(claim => (
                      <button
                        key={claim.roundId}
                        onClick={() => setSelectedRound(claim.roundId)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors
                          ${selectedRound === claim.roundId
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                      >
                        Round {claim.roundId}
                      </button>
                    ))}
                  </div>
                )}

                {/* Claim Card */}
                {selectedClaim && (
                  <ClaimCard claim={selectedClaim} />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClaimCard({ claim }: { claim: ClaimInfo }) {
  const { address } = useAccount();

  // Check if already claimed
  const { data: isClaimed, isLoading: checkingClaimed } = useReadContract({
    address: claim.contractAddress as `0x${string}`,
    abi: MOON_DISTRIBUTOR_ABI,
    functionName: 'isClaimed',
    args: [BigInt(claim.roundId), BigInt(claim.index)],
  });

  // Claim transaction
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleClaim = () => {
    writeContract({
      address: claim.contractAddress as `0x${string}`,
      abi: MOON_DISTRIBUTOR_ABI,
      functionName: 'claim',
      args: [
        BigInt(claim.roundId),
        BigInt(claim.index),
        address!,
        BigInt(claim.amount),
        claim.proof as `0x${string}`[],
      ],
    });
  };

  const formattedAmount = formatUnits(BigInt(claim.amount), 18);
  const expirationDate = new Date(claim.expirationDate);
  const isExpired = expirationDate < new Date();

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">Round {claim.roundId}</h3>
          <p className="text-gray-400 text-sm">u/{claim.username}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-400">
            {parseFloat(formattedAmount).toLocaleString()} MOON
          </p>
          <p className="text-gray-500 text-sm">
            From {claim.karma.toLocaleString()} karma
          </p>
        </div>
      </div>

      <div className="text-sm text-gray-400">
        Expires: {expirationDate.toLocaleDateString()}
        {isExpired && <span className="text-red-400 ml-2">(Expired)</span>}
      </div>

      {checkingClaimed ? (
        <div className="text-gray-400">Checking claim status...</div>
      ) : isClaimed || isSuccess ? (
        <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
          <p className="text-green-400 font-medium">
            Already claimed!
          </p>
          {hash && (
            <a
              href={`https://nova.arbiscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-300 hover:underline"
            >
              View transaction
            </a>
          )}
        </div>
      ) : isExpired ? (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">This round has expired and cannot be claimed.</p>
        </div>
      ) : (
        <button
          onClick={handleClaim}
          disabled={isPending || isConfirming}
          className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700
                     disabled:cursor-not-allowed py-3 rounded-lg font-semibold
                     transition-colors"
        >
          {isPending ? 'Confirm in wallet...' :
           isConfirming ? 'Claiming...' :
           `Claim ${parseFloat(formattedAmount).toLocaleString()} MOON`}
        </button>
      )}
    </div>
  );
}
```

---

## Phase 7: Testing & Deployment Checklist

### 7.1 Development Testing

```bash
# 1. Apply schema changes
pnpm --filter @rcryptocurrency/database db:push

# 2. Test address linking
pnpm --filter web dev
# Go to http://localhost:3000/link

# 3. Generate test merkle tree
pnpm --filter @rcryptocurrency/scraper run generate-merkle 70 1

# 4. Deploy contract to testnet (Arbitrum Goerli/Sepolia)
# ... hardhat deploy script

# 5. Test claim page
# Go to http://localhost:3000/claim
```

### 7.2 Production Deployment

```bash
# 1. Build all
pnpm build

# 2. Deploy contract to Arbitrum Nova mainnet
# Fund with MOON tokens

# 3. Update addresses in chain-data package
# 4. Rebuild web app

# 5. Restart PM2
pm2 restart all
```

---

## File Summary

### New Files to Create

| Location | File | Purpose |
|----------|------|---------|
| `packages/database/prisma/` | schema.prisma (modify) | Add 3 new models |
| `apps/web/lib/` | wagmi.ts | Wallet config |
| `apps/web/components/` | Providers.tsx | Wagmi/RainbowKit wrapper |
| `apps/web/app/link/` | page.tsx | Link address UI |
| `apps/web/app/claim/` | page.tsx | Claim rewards UI |
| `apps/web/app/api/verify-link/` | route.ts | Verify Reddit comment |
| `apps/web/app/api/claims/[address]/` | route.ts | Get eligible claims |
| `packages/chain-data/contracts/` | MoonDistributor.sol | Distribution contract |
| `packages/chain-data/src/abis/` | MoonDistributor.ts | Contract ABI export |
| `apps/scraper/scripts/` | generate-merkle.ts | Build merkle tree |
| `data/distributions/` | round-*-claims.json | Generated claim data |

### Modified Files

| Location | File | Changes |
|----------|------|---------|
| `packages/database/prisma/` | schema.prisma | Add UserAddressLink, DistributionRound, DistributionClaim |
| `apps/web/` | package.json | Add wagmi, viem, @tanstack/react-query deps |
| `apps/web/app/` | layout.tsx | Wrap with Providers |
| `apps/scraper/` | package.json | Add @openzeppelin/merkle-tree |
| `packages/chain-data/src/` | addresses.ts | Add DISTRIBUTOR_CONTRACTS |

---

## Future Enhancements

- [ ] **Multi-token support:** Add POL/MATIC distribution option
- [ ] **IPFS claims storage:** Store claims JSON on IPFS instead of filesystem
- [ ] **Claim notifications:** Telegram alerts when new rounds open
- [ ] **Batch claims:** Claim multiple rounds in one transaction
- [ ] **Admin dashboard:** UI for creating distributions
- [ ] **Claim history:** Show past claims on user's claim page
