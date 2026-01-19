import { prisma } from '@rcryptocurrency/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering (don't try to query DB at build time)
export const dynamic = 'force-dynamic';

// Format date for display
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Simple markdown to HTML conversion (basic support)
function renderMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-orange-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1 rounded">$1</code>')
    // Unordered lists
    .replace(/^\s*[-*]\s+(.*)$/gim, '<li class="ml-4">$1</li>')
    // Ordered lists (basic)
    .replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="ml-4 list-decimal">$1</li>')
    // Horizontal rules
    .replace(/^---$/gim, '<hr class="border-gray-700 my-8" />')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p class="my-4">')
    // Single newlines to breaks
    .replace(/\n/g, '<br />');
}

export default async function NewsletterPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await prisma.newsletterPost.findUnique({
    where: { slug: params.slug },
  });

  // Only show published posts to public
  if (!post || !post.publishedAt) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="/newsletter"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Newsletter
        </Link>

        {/* Post header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-gray-400">
            <time>{formatDate(post.publishedAt)}</time>
            {post.authorName && (
              <>
                <span>•</span>
                <span>by {post.authorName}</span>
              </>
            )}
          </div>
        </header>

        {/* Post content */}
        <article className="prose prose-invert prose-orange max-w-none">
          <div
            className="text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: `<p class="my-4">${renderMarkdown(post.body)}</p>`,
            }}
          />
        </article>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800">
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="font-semibold mb-2">Want more updates?</h3>
            <p className="text-gray-400 mb-4">
              Subscribe to get MOON news, governance updates, and community highlights.
            </p>
            <Link
              href="/newsletter#top"
              className="inline-block bg-orange-600 hover:bg-orange-500 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Subscribe
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
