'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function Nav() {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 24px', backgroundColor: '#1a1d23', color: 'white',
    }}>
      <Link href="/" style={{ textDecoration: 'none', color: 'white', fontWeight: 700, fontSize: 18 }}>
        PHYLAX
      </Link>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {user ? (
          <>
            <Link href="/submit" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>
              Submit
            </Link>
            <Link href="/queue" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>
              Queue
            </Link>
            <Link href="/dashboard" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>
              Dashboard
            </Link>
            {user.role === 'admin' && (
              <Link href="/settings" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>
                Settings
              </Link>
            )}
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              {user.name} ({user.role})
            </span>
            <button
              onClick={logout}
              style={{
                background: 'none', border: '1px solid #4b5563', color: '#9ca3af',
                padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13,
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}