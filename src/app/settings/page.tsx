'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/api';

export default function SettingsPage() {
  const [queueStrategy, setQueueStrategy] = useState('slap');
  const [staleThreshold, setStaleThreshold] = useState('48');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await authFetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setQueueStrategy(data.queue_strategy || 'slap');
          setStaleThreshold(data.stale_threshold_hours || '48');
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    setMessage('');

    try {
      const response = await authFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ key, value }),
      });

      if (response.ok) {
        setMessage('Setting saved');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('Failed to save');
      }
    } catch (err) {
      setMessage('Failed to save');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
        <h1>Settings</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Settings</h1>

      {message && (
        <div style={{
          padding: 12, marginBottom: 16, borderRadius: 8,
          backgroundColor: message === 'Setting saved' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${message === 'Setting saved' ? '#86efac' : '#fca5a5'}`,
          color: message === 'Setting saved' ? '#166534' : '#991b1b',
          fontSize: 14,
        }}>
          {message}
        </div>
      )}

      <div style={{
        padding: 20, marginBottom: 24, borderRadius: 8,
        border: '1px solid #e5e7eb', backgroundColor: '#ffffff',
      }}>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Queue Strategy</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Controls how incidents are sorted in the triage queue.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => setQueueStrategy('fifo')}
            style={{
              flex: 1, padding: 16, borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${queueStrategy === 'fifo' ? '#2563eb' : '#e5e7eb'}`,
              backgroundColor: queueStrategy === 'fifo' ? '#eff6ff' : '#ffffff',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>FIFO</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              First In, First Out. Oldest incidents served first regardless of severity.
            </div>
          </button>
          <button
            onClick={() => setQueueStrategy('slap')}
            style={{
              flex: 1, padding: 16, borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${queueStrategy === 'slap' ? '#2563eb' : '#e5e7eb'}`,
              backgroundColor: queueStrategy === 'slap' ? '#eff6ff' : '#ffffff',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>SLAP</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              SLA Protection. Severity-first sorting. P1s always surface to the top.
            </div>
          </button>
        </div>

        <button
          onClick={() => handleSave('queue_strategy', queueStrategy)}
          disabled={saving}
          style={{
            padding: '10px 20px', fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            borderRadius: 6, border: 'none',
            backgroundColor: '#2563eb', color: 'white',
          }}
        >
          {saving ? 'Saving...' : 'Save Queue Strategy'}
        </button>
      </div>

      <div style={{
        padding: 20, marginBottom: 24, borderRadius: 8,
        border: '1px solid #e5e7eb', backgroundColor: '#ffffff',
      }}>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Stale Incident Threshold</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Incidents older than this threshold appear in the stale incidents list on the dashboard.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <input
            type="number"
            value={staleThreshold}
            onChange={(e) => setStaleThreshold(e.target.value)}
            min="1"
            max="720"
            style={{ width: 100, padding: 10, fontSize: 16 }}
          />
          <span style={{ fontSize: 14, color: '#6b7280' }}>hours</span>
        </div>

        <button
          onClick={() => handleSave('stale_threshold_hours', staleThreshold)}
          disabled={saving}
          style={{
            padding: '10px 20px', fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            borderRadius: 6, border: 'none',
            backgroundColor: '#2563eb', color: 'white',
          }}
        >
          {saving ? 'Saving...' : 'Save Threshold'}
        </button>
      </div>

      <div style={{
        padding: 20, borderRadius: 8,
        border: '1px solid #e5e7eb', backgroundColor: '#ffffff',
      }}>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Team Members</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Team management will be available after authentication is implemented.
        </p>
        <div style={{
          padding: 16, borderRadius: 8, backgroundColor: '#f9fafb',
          fontSize: 14, color: '#6b7280', textAlign: 'center',
        }}>
          Coming in the auth sprint
        </div>
      </div>
    </div>
  );
}