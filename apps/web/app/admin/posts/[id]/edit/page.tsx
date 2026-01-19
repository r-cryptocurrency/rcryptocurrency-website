import { redirect, notFound } from 'next/navigation';
import { prisma } from '@rcryptocurrency/database';
import { verifyAdminSession } from '@/lib/admin-auth';
import Link from 'next/link';
import PostForm from '../../PostForm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const isAdmin = await verifyAdminSession();

  if (!isAdmin) {
    redirect('/admin');
  }

  const postId = parseInt(params.id, 10);
  if (isNaN(postId)) {
    notFound();
  }

  const post = await prisma.newsletterPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/posts"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Edit Post</h1>
        </div>

        {/* Form */}
        <div className="bg-gray-900 rounded-xl p-6">
          <PostForm post={post} />
        </div>
      </div>
    </div>
  );
}
