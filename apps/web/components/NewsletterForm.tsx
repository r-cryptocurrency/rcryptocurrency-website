'use client';

import { useState } from 'react';
import { subscribeToNewsletter } from '@/app/actions/newsletter';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    const result = await subscribeToNewsletter(email);

    if (result.success) {
      setStatus('success');
      setEmail('');
      // Store in localStorage so we can show "already subscribed" message
      localStorage.setItem('newsletter_subscribed', 'true');
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Something went wrong.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-900/30 border border-green-600 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-400 font-semibold text-lg">You're subscribed!</span>
        </div>
        <p className="text-gray-300">
          Thanks for signing up. We'll send you updates about r/CryptoCurrency.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
          Email Address
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            id="email"
            placeholder="you@example.com"
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 focus:outline-none
                       focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700
                       disabled:cursor-not-allowed px-4 sm:px-6 py-3 rounded-lg font-semibold
                       transition-colors"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Joining...</span>
              </span>
            ) : 'Subscribe'}
          </button>
        </div>
      </div>

      {status === 'error' && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      <p className="text-gray-500 text-xs">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
