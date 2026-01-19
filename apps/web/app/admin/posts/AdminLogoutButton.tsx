'use client';

import { adminLogout } from '@/app/actions/admin';

export default function AdminLogoutButton() {
  return (
    <button
      onClick={() => adminLogout()}
      className="text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
    >
      Logout
    </button>
  );
}
