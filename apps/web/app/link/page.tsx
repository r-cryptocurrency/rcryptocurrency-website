'use client';

import { useState, useEffect } from 'react';
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

interface LinkStatus {
  isLinked: boolean;
  username: string | null;
  linkedAt: string | null;
  currentDistroAddress: string | null;
}

export default function LinkAddressPage() {
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [commentUrl, setCommentUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check existing link status when address changes
  useEffect(() => {
    if (address) {
      setCheckingStatus(true);
      fetch(`/api/link-status/${address}`)
        .then(res => res.json())
        .then(data => setLinkStatus(data))
        .catch(() => setLinkStatus(null))
        .finally(() => setCheckingStatus(false));
    } else {
      setLinkStatus(null);
    }
  }, [address]);

  // Refresh link status after successful verification
  useEffect(() => {
    if (status === 'success' && address) {
      fetch(`/api/link-status/${address}`)
        .then(res => res.json())
        .then(data => setLinkStatus(data))
        .catch(() => {});
    }
  }, [status, address]);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
    <div className="min-h-screen bg-gray-950 text-white pt-24">
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
            {/* Current Link Status */}
            {checkingStatus ? (
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <span className="text-gray-400">Checking link status...</span>
              </div>
            ) : linkStatus?.isLinked ? (
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-400 font-semibold">Address Already Linked</span>
                </div>
                <p className="text-gray-300">
                  This address is linked to <span className="text-orange-400 font-mono">u/{linkStatus.username}</span>
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  You can re-link to update your distribution address if needed.
                </p>
              </div>
            ) : linkStatus?.username ? (
              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-yellow-400 font-semibold">Different Distribution Address</span>
                </div>
                <p className="text-gray-300">
                  Your Reddit account <span className="text-orange-400 font-mono">u/{linkStatus.username}</span> has a different address linked for distributions.
                </p>
                {linkStatus.currentDistroAddress && (
                  <p className="text-gray-400 text-sm mt-1 font-mono">
                    Current: {linkStatus.currentDistroAddress.slice(0, 10)}...{linkStatus.currentDistroAddress.slice(-8)}
                  </p>
                )}
                <p className="text-gray-400 text-sm mt-2">
                  Complete verification below to use this address for future distributions.
                </p>
              </div>
            ) : null}

            {/* Instructions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                <li className="flex flex-wrap items-center gap-2">
                  <span>Copy your wallet address:</span>
                  <button
                    onClick={copyAddress}
                    className="relative bg-gray-800 px-2 py-1 rounded text-sm text-orange-400 break-all
                               hover:bg-gray-700 cursor-pointer transition-colors"
                    title="Click to copy"
                  >
                    <code>{address}</code>
                    {copied && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white
                                       text-xs px-2 py-1 rounded whitespace-nowrap">
                        Copied!
                      </span>
                    )}
                  </button>
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
                  and post a comment containing your address (any thread works)
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
                placeholder="https://www.reddit.com/r/CryptoCurrencyMoons/comments/..."
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
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying (this may take 15-20 seconds)...
                </span>
              ) : 'Verify Link'}
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
      </div>
    </div>
  );
}
