'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';

/**
 * Navigation bar — role-aware, route-aware
 * Hides on login page to keep the auth screen clean
 * Settings link only visible to admin role
 * Logo and Bank Gothic branding on the left
 */
export default function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Login page has its own branding — no nav needed
  if (pathname === '/login') return null;

  return (
    <nav className="flex items-center justify-between px-6 py-7 bg-[#1a1d23] text-white border-b border-gray-800">

      {/* Brand — logo + wordmark */}
      <Link href="/queue" className="flex items-center no-underline">
      <img src="/phylax.jpg" alt="Phylax" className="w-24 h-24 rounded-lg -my-7 brightness-145" />
      </Link>

      <div className="flex gap-6 items-center">
        {user ? (
          <>
            {/* Core navigation — visible to all authenticated users */}
            <Link
              href="/submit"
              className={`no-underline text-sm transition-colors ${pathname === '/submit' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              Submit
            </Link>
            <Link
              href="/queue"
              className={`no-underline text-sm transition-colors ${pathname === '/queue' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              Queue
            </Link>
            <Link
              href="/dashboard"
              className={`no-underline text-sm transition-colors ${pathname === '/dashboard' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/archive"
              className={`no-underline text-sm transition-colors ${pathname === '/archive' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              Archive
            </Link>

            {/* Admin-only — settings restricted to prevent config drift */}
            {user.role === 'admin' && (
              <Link
                href="/settings"
                className={`no-underline text-sm transition-colors ${pathname === '/settings' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
              >
                Settings
              </Link>
            )}

            {/* Separator between nav and user controls */}
            <div className="w-px h-5 bg-gray-700" />

            {/* User identity and session control */}
            <span className="text-xs text-gray-500">
              {user.name} <span className="text-gray-600">({user.role})</span>
            </span>
            <button
              onClick={logout}
              className="bg-transparent border border-gray-600 text-gray-400 px-3 py-1 rounded text-xs cursor-pointer hover:text-white hover:border-gray-400 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="no-underline text-gray-400 text-sm">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}