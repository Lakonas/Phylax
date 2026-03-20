'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/api';

/**
 * Settings page — admin only
 * Configures queue strategy (FIFO/SLAP) and stale incident threshold
 * Reads current values from settings table on mount
 * Team management placeholder for future sprint
 */
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
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Save confirmation toast */}
        {message && (
          <div className={`p-3 mb-4 rounded-lg text-sm ${message === 'Setting saved' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Queue strategy — FIFO vs SLAP toggle cards */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Queue Strategy</h3>
          <p className="text-xs text-gray-500 mb-4">
            Controls how incidents are sorted in the triage queue.
          </p>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setQueueStrategy('fifo')}
              className={`flex-1 p-4 rounded-lg cursor-pointer text-left transition-colors border-2 ${queueStrategy === 'fifo' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="font-bold text-gray-900 mb-1">FIFO</div>
              <div className="text-xs text-gray-500">
                First In, First Out. Oldest incidents served first regardless of severity.
              </div>
            </button>
            <button
              onClick={() => setQueueStrategy('slap')}
              className={`flex-1 p-4 rounded-lg cursor-pointer text-left transition-colors border-2 ${queueStrategy === 'slap' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="font-bold text-gray-900 mb-1">SLA/P</div>
              <div className="text-xs text-gray-500">
                SLA Protection. Severity-first sorting. P1s always surface to the top.
              </div>
            </button>
          </div>

          <button
            onClick={() => handleSave('queue_strategy', queueStrategy)}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Queue Strategy'}
          </button>
        </div>

        {/* Stale threshold — configurable hours */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Stale Incident Threshold</h3>
          <p className="text-xs text-gray-500 mb-4">
            Incidents older than this threshold appear in the stale incidents list on the dashboard.
          </p>

          <div className="flex gap-3 items-center mb-4">
            <input
              type="number"
              value={staleThreshold}
              onChange={(e) => setStaleThreshold(e.target.value)}
              min="1"
              max="720"
              className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-500">hours</span>
          </div>

          <button
            onClick={() => handleSave('stale_threshold_hours', staleThreshold)}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Threshold'}
          </button>
        </div>

        {/* Team members — placeholder for post-auth feature */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Team Members</h3>
          <p className="text-xs text-gray-500 mb-4">
            Manage team members and their roles.
          </p>
          <div className="py-6 rounded-lg bg-gray-50 text-center text-sm text-gray-400">
            Coming in v2
          </div>
        </div>

      </div>
    </div>
  );
}