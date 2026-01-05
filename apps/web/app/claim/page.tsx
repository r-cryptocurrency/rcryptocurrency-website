'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { MOON_DISTRIBUTOR_ABI, DISTRIBUTOR_CONTRACTS } from '@rcryptocurrency/chain-data';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Claim {
  roundId: number;
  index: number;
  amount: string;
  address: string;
  proof: string[];
  isClaimedOnChain?: boolean;
}

export default function ClaimPage() {
  const { address, isConnected } = useAccount();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isWaitingForTransaction, isSuccess: isTransactionSuccess } = 
    useWaitForTransactionReceipt({ hash });

  const fetchClaims = async (addr: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/claims/${addr}`);
      if (!response.ok) {
        throw new Error('Failed to fetch claims');
      }
      const data = await response.json();
      setClaims(data.claims || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchClaims(address);
    } else {
      setClaims([]);
    }
  }, [address]);

  // Refresh claims after successful transaction
  useEffect(() => {
    if (isTransactionSuccess && address) {
      fetchClaims(address);
    }
  }, [isTransactionSuccess, address]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Claim Your <span className="text-rcc-orange">Moons</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            If you've earned MOONs in previous distribution rounds, you can claim them here. 
            Make sure your wallet is connected and you're on the correct network.
          </p>
        </header>

        {!isConnected ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="mb-6 inline-flex p-4 rounded-full bg-rcc-orange/10 text-rcc-orange">
              <i className="fas fa-wallet text-4xl"></i>
            </div>
            <h2 className="text-2xl font-bold ml-2 text-slate-800 dark:text-white mb-4">Connect Your Wallet</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Connect the wallet that you've linked to your Reddit account to check for available MOON distributions.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <i className="fas fa-user-circle text-2xl text-slate-400"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Connected Address</p>
                  <p className="font-mono text-slate-900 dark:text-white">{address}</p>
                </div>
              </div>
              <ConnectButton showBalance={false} chainStatus="icon" />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-rcc-orange border-t-transparent"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-400">Checking for eligible claims...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-2xl text-red-600 dark:text-red-400">
                <div className="flex items-center gap-3">
                  <i className="fas fa-exclamation-circle text-xl"></i>
                  <p className="font-semibold">Error loading claims</p>
                </div>
                <p className="mt-2 text-sm">{error}</p>
                <button 
                  onClick={() => address && fetchClaims(address)}
                  className="mt-4 text-sm font-bold underline"
                >
                  Try Again
                </button>
              </div>
            ) : claims.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-md border border-slate-200 dark:border-slate-700 text-center">
                <div className="mb-6 inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400">
                  <i className="fas fa-gift text-4xl"></i>
                </div>
                <h2 className="text-2xl font-bold ml-2 text-slate-800 dark:text-white mb-2">No Claims Found</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  We couldn't find any unclaimed MOONs for this address. 
                  Check back after the next distribution round or ensure you're using the correct address.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {claims.map((claim: any) => (
                  <ClaimRow 
                    key={`${claim.roundId}-${claim.index}`} 
                    claim={claim} 
                    writeContract={writeContract}
                    isPending={isPending}
                    isWaitingForTransaction={isWaitingForTransaction}
                    currentHash={hash}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClaimRow({ 
  claim, 
  writeContract, 
  isPending, 
  isWaitingForTransaction,
  currentHash 
}: { 
  claim: Claim; 
  writeContract: any; 
  isPending: boolean;
  isWaitingForTransaction: boolean;
  currentHash?: string;
}) {
  const { data: isClaimedOnChain, isLoading } = useReadContract({
    address: DISTRIBUTOR_CONTRACTS.arbitrumOne as `0x${string}`,
    abi: MOON_DISTRIBUTOR_ABI,
    functionName: 'isClaimed',
    args: [BigInt(claim.roundId), BigInt(claim.index)],
  });

  const handleClaim = () => {
    writeContract({
      address: DISTRIBUTOR_CONTRACTS.arbitrumOne as `0x${string}`,
      abi: MOON_DISTRIBUTOR_ABI,
      functionName: 'claim',
      args: [
        BigInt(claim.roundId),
        BigInt(claim.index),
        claim.address as `0x${string}`,
        BigInt(claim.amount),
        claim.proof as unknown as `0x${string}[]`,
      ],
    });
  };

  // Correction: the address in args[2] should be the one in the claim leaf!
  // Our API should return the address as well.
  // Wait, I need to check /api/claims/[address] output.
  
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-rcc-orange/10 text-rcc-orange text-xs font-bold px-2 py-0.5 rounded">ROUND {claim.roundId}</span>
          <span className="text-slate-400 text-xs">INDEX: {claim.index}</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
          {formatUnits(BigInt(claim.amount), 18)} <span className="text-rcc-orange text-lg">MOON</span>
        </h3>
      </div>

      <div className="flex items-center gap-3">
        {isClaimedOnChain ? (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-6 py-2 rounded-xl font-bold flex items-center gap-2">
            <i className="fas fa-check-circle"></i>
            Claimed
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={isPending || isWaitingForTransaction || isLoading}
            className="bg-rcc-orange hover:bg-rcc-orange/90 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rcc-orange/20 transition-all transform hover:scale-105 active:scale-95"
          >
            {isPending ? (
              <>
                <i className="fas fa-spinner animate-spin"></i>
                Confirming...
              </>
            ) : isWaitingForTransaction ? (
              <>
                <i className="fas fa-circle-notch animate-spin"></i>
                Processing...
              </>
            ) : (
              'Claim MOONs'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
