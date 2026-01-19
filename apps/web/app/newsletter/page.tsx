import { prisma } from '@rcryptocurrency/database';
import NewsletterForm from '@/components/NewsletterForm';
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

export default async function NewsletterPage() {
  // Fetch published posts, most recent first
  const posts = await prisma.newsletterPost.findMany({
    where: {
      publishedAt: { not: null },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            r/CryptoCurrency Newsletter
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Stay up to date with MOON distributions, governance updates, and community news.
          </p>
        </div>

        {/* Signup Section */}
        <div className="bg-gray-900 rounded-xl p-6 mb-12">
          <h2 className="text-xl font-semibold mb-4">Subscribe to Updates</h2>
          <NewsletterForm />

          <div className="mt-6 pt-6 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-3">What you'll get:</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                <span>MOON distribution announcements and claim reminders</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                <span>Governance proposals and voting updates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                <span>Weekly burn and market stats</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                <span>Community highlights and important announcements</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Past Updates Section */}
        <div id="past-updates">
          <h2 className="text-2xl font-semibold mb-6">Past Updates</h2>

          {posts.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-8 text-center">
              <p className="text-gray-400">No updates yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/newsletter/${post.slug}`}
                  className="block bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white hover:text-orange-400 transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-gray-400 mt-2 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    <time className="text-sm text-gray-500 whitespace-nowrap">
                      {post.publishedAt && formatDate(post.publishedAt)}
                    </time>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
