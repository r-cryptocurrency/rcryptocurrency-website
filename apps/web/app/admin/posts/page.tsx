import { redirect } from 'next/navigation';
import { prisma } from '@rcryptocurrency/database';
import { verifyAdminSession } from '@/lib/admin-auth';
import Link from 'next/link';
import AdminPostsList from './AdminPostsList';
import AdminLogoutButton from './AdminLogoutButton';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminPostsPage() {
  const isAdmin = await verifyAdminSession();

  if (!isAdmin) {
    redirect('/admin');
  }

  const posts = await prisma.newsletterPost.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const subscriberCount = await prisma.newsletterSubscriber.count({
    where: { isActive: true },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Newsletter Admin</h1>
            <p className="text-gray-400 mt-1">
              {subscriberCount} active subscriber{subscriberCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/posts/new"
              className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              New Post
            </Link>
            <AdminLogoutButton />
          </div>
        </div>

        {/* Posts list */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">All Posts</h2>
          <AdminPostsList initialPosts={posts} />
        </div>
      </div>
    </div>
  );
}
