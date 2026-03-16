'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';

/**
 * Navigation bar — role-aware, route-aware
 * Hides on login page to keep the auth screen clean
 * Settings link only visible to admin role
 * Shows user identity and logout when authenticated
 */
export default function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Login page has its own branding — no nav needed
  if (pathname === '/login') return null;

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-[#1a1d23] text-white">

      {/* Brand link — returns to queue (the operational home) */}
      <Link href="/queue" className="no-underline text-white font-bold text-lg">
      <span style={{ fontFamily: "'Bank Gothic', sans-serif", letterSpacing: '0.1em' }}>PHYLAX</span>
      </Link>

      <div className="flex gap-6 items-center">
        {user ? (
          <>
            {/* Core navigation — visible to all authenticated users */}
            <Link href="/submit" className="no-underline text-gray-400 text-sm hover:text-white transition-colors">
              Submit
            </Link>
            <Link href="/queue" className="no-underline text-gray-400 text-sm hover:text-white transition-colors">
              Queue
            </Link>
            <Link href="/dashboard" className="no-underline text-gray-400 text-sm hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/archive" className="no-underline text-gray-400 text-sm hover:text-white transition-colors">
              Archive
            </Link>

            {/* Admin-only — settings are restricted to prevent config drift */}
            {user.role === 'admin' && (
              <Link href="/settings" className="no-underline text-gray-400 text-sm hover:text-white transition-colors">
                Settings
              </Link>
            )}

            {/* User identity and session control */}
            <span className="text-xs text-gray-500">
              {user.name} ({user.role})
            </span>
            <button
              onClick={logout}
              className="bg-transparent border border-gray-600 text-gray-400 px-3 py-1 rounded text-xs cursor-pointer hover:text-white hover:border-gray-400 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          // Unauthenticated fallback — shouldn't normally show since login hides nav
          <Link href="/login" className="no-underline text-gray-400 text-sm">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}