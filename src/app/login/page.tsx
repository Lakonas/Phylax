'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

      // Store token and user in cookie for server components
      document.cookie = `token=${data.token}; path=/; max-age=86400`;
      document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=86400`;

      window.location.href = '/queue';

    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '120px auto', padding: 24 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>PHYLAX</h1>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 32 }}>
        {isRegister ? 'Create an account' : 'Sign in to continue'}
      </p>

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              style={{ width: '100%', padding: 10, fontSize: 16 }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            style={{ width: '100%', padding: 10, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
            style={{ width: '100%', padding: 10, fontSize: 16 }}
          />
        </div>

        {error && (
          <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: 12, fontSize: 16, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: 6, border: 'none',
            backgroundColor: '#2563eb', color: 'white',
          }}
        >
          {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#6b7280' }}>
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => { setIsRegister(!isRegister); setError(''); }}
          style={{
            background: 'none', border: 'none', color: '#2563eb',
            cursor: 'pointer', fontSize: 14, textDecoration: 'underline',
          }}
        >
          {isRegister ? 'Sign In' : 'Register'}
        </button>
      </p>

      {/* Demo login for recruiters */}
      <div style={{
        marginTop: 32, padding: 16, borderRadius: 8,
        backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
          Recruiter? Try the demo:
        </p>
        <button
          onClick={() => {
            setEmail('admin@phylax.dev');
            setPassword('password123');
            setIsRegister(false);
          }}
          style={{
            background: 'none', border: '1px solid #2563eb', color: '#2563eb',
            padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
          }}
        >
          Fill Demo Credentials
        </button>
      </div>
    </div>
  );
}
