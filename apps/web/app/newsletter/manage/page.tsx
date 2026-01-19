'use client';

import { useState } from 'react';
import { unsubscribeFromNewsletter } from '@/app/actions/newsletter';
import Link from 'next/link';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ManageNewsletterPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    const result = await unsubscribeFromNewsletter(email);

    if (result.success) {
      setStatus('success');
      setMessage(result.message || 'You have been unsubscribed.');
      setEmail('');
    } else {
      setStatus('error');
      setMessage(result.error || 'Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white pt-24">
      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Subscription</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your newsletter preferences
          </p>
        </div>

        {/* Unsubscribe Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Unsubscribe</h2>

          {status === 'success' ? (
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-500 dark:border-green-600 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-700 dark:text-green-400 font-semibold">Unsubscribed</span>
              </div>
              <p className="text-green-800 dark:text-gray-300">{message}</p>
              <Link
                href="/newsletter"
                className="inline-block mt-4 text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 transition-colors"
              >
                &larr; Back to Newsletter
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUnsubscribe} className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Enter your email address to unsubscribe from all newsletter emails.
              </p>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg
                             text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none
                             focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full bg-red-600 hover:bg-red-500 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700
                           disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold
                           transition-colors"
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </span>
                ) : 'Unsubscribe'}
              </button>

              {status === 'error' && (
                <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{message}</p>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/newsletter"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-sm"
          >
            &larr; Back to Newsletter
          </Link>
        </div>
      </div>
    </div>
  );
}
