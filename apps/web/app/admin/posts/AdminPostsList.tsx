'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteNewsletterPost, broadcastPost } from '@/app/actions/admin';

interface Post {
  id: number;
  slug: string;
  title: string;
  publishedAt: Date | null;
  createdAt: Date;
  isSent: boolean;
}

interface AdminPostsListProps {
  initialPosts: Post[];
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export default function AdminPostsList({ initialPosts }: AdminPostsListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [broadcastingId, setBroadcastingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setDeletingId(id);
    setError(null);

    const result = await deleteNewsletterPost(id);

    if (result.success) {
      setPosts(posts.filter(p => p.id !== id));
    } else {
      setError(result.error || 'Failed to delete post.');
    }

    setDeletingId(null);
  };

  const handleBroadcast = async (id: number) => {
    if (!confirm('Are you sure you want to send this post to all subscribers? This cannot be undone.')) return;

    setBroadcastingId(id);
    setError(null);

    const result = await broadcastPost(id);

    if (result.success) {
      setPosts(posts.map(p => p.id === id ? { ...p, isSent: true } : p));
      alert('Newsletter sent successfully!');
    } else {
      setError(result.error || 'Failed to broadcast post.');
    }

    setBroadcastingId(null);
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No posts yet.</p>
        <Link
          href="/admin/posts/new"
          className="inline-block mt-4 text-orange-400 hover:text-orange-300"
        >
          Create your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {posts.map((post) => (
        <div
          key={post.id}
          className="flex items-center justify-between gap-4 p-4 bg-gray-800 rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{post.title}</h3>
              {post.publishedAt ? (
                <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded">
                  Published
                </span>
              ) : (
                <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                  Draft
                </span>
              )}
              {post.isSent && (
                <span className="text-xs bg-blue-900 text-blue-400 px-2 py-0.5 rounded">
                  Sent
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Created {formatDate(post.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View link */}
            {post.publishedAt && (
              <Link
                href={`/newsletter/${post.slug}`}
                target="_blank"
                className="text-gray-400 hover:text-white px-3 py-1.5 rounded transition-colors"
                title="View post"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            )}

            {/* Edit button */}
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="text-gray-400 hover:text-white px-3 py-1.5 rounded transition-colors"
              title="Edit post"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>

            {/* Broadcast button */}
            {post.publishedAt && !post.isSent && (
              <button
                onClick={() => handleBroadcast(post.id)}
                disabled={broadcastingId === post.id}
                className="text-orange-400 hover:text-orange-300 disabled:text-gray-500 px-3 py-1.5 rounded transition-colors"
                title="Send as newsletter"
              >
                {broadcastingId === post.id ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={() => handleDelete(post.id)}
              disabled={deletingId === post.id}
              className="text-red-400 hover:text-red-300 disabled:text-gray-500 px-3 py-1.5 rounded transition-colors"
              title="Delete post"
            >
              {deletingId === post.id ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
