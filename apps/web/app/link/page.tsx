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
      </div>
    </div>
  );
}
