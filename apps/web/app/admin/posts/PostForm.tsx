'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createNewsletterPost, updateNewsletterPost } from '@/app/actions/admin';

interface PostFormProps {
  post?: {
    id: number;
    title: string;
    body: string;
    excerpt: string | null;
    authorName: string | null;
    publishedAt: Date | null;
  };
}

type Status = 'idle' | 'loading' | 'error';

export default function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title || '');
  const [body, setBody] = useState(post?.body || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [authorName, setAuthorName] = useState(post?.authorName || '');
  const [publish, setPublish] = useState(!!post?.publishedAt);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      setErrorMessage('Title and body are required.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    let result;
    if (isEditing) {
      result = await updateNewsletterPost(
        post.id,
        title,
        body,
        excerpt || undefined,
        authorName || undefined,
        publish
      );
    } else {
      result = await createNewsletterPost(
        title,
        body,
        excerpt || undefined,
        authorName || undefined,
        publish
      );
    }

    if (result.success) {
      router.push('/admin/posts');
      router.refresh();
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Failed to save post.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          placeholder="Post title"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg
                     text-white placeholder-gray-500 focus:outline-none
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>

      {/* Excerpt */}
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-400 mb-2">
          Excerpt (optional)
        </label>
        <input
          type="text"
          id="excerpt"
          placeholder="Short preview text for the post list"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg
                     text-white placeholder-gray-500 focus:outline-none
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>

      {/* Author Name */}
      <div>
        <label htmlFor="authorName" className="block text-sm font-medium text-gray-400 mb-2">
          Author Name (optional)
        </label>
        <input
          type="text"
          id="authorName"
          placeholder="Your name or username"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg
                     text-white placeholder-gray-500 focus:outline-none
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>

      {/* Body */}
      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-400 mb-2">
          Body * (Markdown supported)
        </label>
        <textarea
          id="body"
          rows={15}
          placeholder="Write your post content here...

You can use Markdown:
- **bold** and *italic*
- [links](https://example.com)
- ## Headers
- Lists with - or *"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg
                     text-white placeholder-gray-500 focus:outline-none
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     font-mono text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>

      {/* Publish checkbox */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="publish"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
          disabled={status === 'loading'}
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500
                     focus:ring-orange-500 focus:ring-offset-gray-900"
        />
        <label htmlFor="publish" className="text-sm text-gray-300">
          Publish immediately (visible on /newsletter)
        </label>
      </div>

      {/* Error message */}
      {status === 'error' && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Submit buttons */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700
                     disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold
                     transition-colors"
        >
          {status === 'loading' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : isEditing ? 'Update Post' : 'Create Post'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={status === 'loading'}
          className="text-gray-400 hover:text-white px-6 py-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
