'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Login/Register page — dual-mode auth form
 * Handles both sign-in and registration with a toggle
 * Includes recruiter demo credentials for portfolio evaluation
 * Watermark background uses the Phylax geometric wolfhead logo
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { name, email, password, role: 'submitter' }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        setLoading(false);
        return;
      }

      // Store JWT and user in cookies (24h expiry matches token TTL)
      document.cookie = `token=${data.token}; path=/; max-age=86400`;
      document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=86400`;

      // Full page redirect ensures AuthContext reads fresh cookies
      window.location.href = '/queue';

    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-24 bg-[#1a1d23] relative overflow-hidden">

      {/* Watermark — geometric wolfhead as subtle brand stamp */}
      <img
        src="/phylax.jpg"
        alt=""
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] object-contain opacity-[0.15] pointer-events-none select-none"
      />

      <div className="w-full max-w-sm mx-4 relative z-10">

        {/* Branding */}
        <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-400 tracking-widest" style={{ fontFamily: "'Bank Gothic', sans-serif" }}>PHYLAX</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isRegister ? 'Create an account' : 'Sign in to continue'}
          </p>
        </div>

        {/* Auth form card — transparent to show watermark */}
        <div className="bg-blue-950/30 backdrop-blur-sm rounded-lg border border-blue-800/40 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name field — only visible in register mode */}
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-3 py-2 bg-[#1a1d23]/60 border border-blue-800/40 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-3 py-2 bg-[#1a1d23]/60 border border-blue-800/40 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                className="w-full px-3 py-2 bg-[#1a1d23]/60 border border-blue-800/40 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle between login and register */}
          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>

        {/* Recruiter demo — pre-fills admin credentials for portfolio evaluation */}
        <div className="mt-6 bg-blue-950/30 backdrop-blur-sm rounded-lg border border-blue-800/40 p-4 text-center shadow-sm">
          <p className="text-xs text-blue-300/60 mb-2">Recruiter? Try the demo:</p>
          <button
            onClick={() => {
              setEmail('admin@phylax.dev');
              setPassword('password123');
              setIsRegister(false);
            }}
            className="text-xs text-blue-400 border border-blue-400 px-3 py-1.5 rounded-md hover:bg-blue-900/30 transition-colors"
          >
            Fill Demo Credentials
          </button>
        </div>

      </div>
    </div>
  );
}