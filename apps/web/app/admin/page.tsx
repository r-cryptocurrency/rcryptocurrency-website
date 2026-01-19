import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/admin-auth';
import AdminLoginForm from './AdminLoginForm';

// Force dynamic rendering (reads cookies)
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAdmin = await verifyAdminSession();

  // If already logged in, redirect to posts management
  if (isAdmin) {
    redirect('/admin/posts');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-gray-400 mt-2">
            Enter the admin password to continue.
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
