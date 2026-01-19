'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/app/actions/admin';

type Status = 'idle' | 'loading' | 'error';

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setStatus('loading');
    setErrorMessage('');

    const result = await adminLogin(password);

    if (result.success) {
      router.push('/admin/posts');
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Login failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          autoComplete="current-password"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg
                     text-white placeholder-gray-500 focus:outline-none
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>

      {status === 'error' && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !password}
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
            Logging in...
          </span>
        ) : 'Login'}
      </button>
    </form>
  );
}
